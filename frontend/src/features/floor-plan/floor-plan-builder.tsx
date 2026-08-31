import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ControlButton,
  MiniMap,
  applyNodeChanges,
  SelectionMode,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Plus,
  LayoutGrid,
  CheckCircle2,
  Square,
  RectangleHorizontal,
  Circle,
  Maximize,
  Minimize,
  Trash2,
  X,
  Link2,
  Unlink,
  Layers,
  Sparkles,
  Pencil,
  Lock,
  Unlock,
  Focus,
  Undo2,
  Redo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  shapeLabels,
  statusLabels,
  DEFAULT_TABLE_WIDTH,
  DEFAULT_TABLE_HEIGHT,
  facilityDefaults,
  type FloorPlanTable,
  type TableShape,
  type TableStatus,
  type FacilityType,
} from "@/features/floor-plan/floor-plan-data"
import {
  loadPositions,
  savePositions,
  loadFloorNames,
  saveFloorNames,
  saveFloorPlanTables,
  loadFloorPlanTables,
  syncFloorPlanToServer,
  fetchFloorPlanFromServer,
  isFacilityElement,
  resolveFacilityType,
} from "@/features/floor-plan/floor-plan-storage"
import { TableNode, type TableNodeData } from "@/features/floor-plan/table-node"
import { FacilityNode, type FacilityNodeData } from "@/features/floor-plan/facility-node"
import {
  Wine,
  DoorOpen,
  LogOut,
  UtensilsCrossed,
  UserCheck,
  Sprout,
  Users as RestroomIcon,
} from "lucide-react"

const nodeTypes: NodeTypes = { table: TableNode, facility: FacilityNode }
const DEFAULT_FLOOR_NAME = "Main Floor"

const shapeCycle: TableShape[] = ["RECTANGLE", "SQUARE", "CIRCLE"]

function nodeFromTable(
  table: FloorPlanTable,
  handlers: {
    onCycleShape: (id: string) => void
    onRotate: (id: string) => void
    onDelete: (id: string) => void
    onUngroup?: (id: string) => void
    onSelectGroup?: (groupId: string) => void
    onEdit?: (id: string) => void
    onResizeEnd?: (id: string, params: { width: number; height: number; x?: number; y?: number }) => void
  },
  isLocked: boolean = true,
): Node<TableNodeData | FacilityNodeData> {
  const isFacility = isFacilityElement(table)

  if (isFacility) {
    const fType = resolveFacilityType(table) || "BAR"
    const def = facilityDefaults[fType] || facilityDefaults.BAR
    return {
      id: table.id,
      type: "facility",
      position: { x: table.positionX, y: table.positionY },
      width: table.width || def.width,
      height: table.height || def.height,
      data: {
        name: table.name,
        facilityType: fType,
        rotation: table.rotation || 0,
        width: table.width || def.width,
        height: table.height || def.height,
        isLocked,
        onRotate: handlers.onRotate,
        onDelete: handlers.onDelete,
        onResizeEnd: handlers.onResizeEnd,
      } as FacilityNodeData,
    }
  }

  return {
    id: table.id,
    type: "table",
    position: { x: table.positionX, y: table.positionY },
    width: table.width || DEFAULT_TABLE_WIDTH,
    height: table.height || DEFAULT_TABLE_HEIGHT,
    data: {
      name: table.name,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
      shape: table.shape,
      rotation: table.rotation || 0,
      width: table.width || DEFAULT_TABLE_WIDTH,
      height: table.height || DEFAULT_TABLE_HEIGHT,
      isLocked,
      groupId: table.groupId,
      groupName: table.groupName,
      ...handlers,
    } as TableNodeData,
  }
}

function buildFloorTables(): Record<string, FloorPlanTable[]> {
  const tableSummaries = loadFloorPlanTables() ?? []
  const savedPositions = loadPositions()
  const byFloor: Record<string, FloorPlanTable[]> = {}
  for (const table of tableSummaries) {
    const saved = savedPositions[table.id]
    const floorName = saved?.floor ?? table.floor ?? DEFAULT_FLOOR_NAME
    const isFacility = isFacilityElement({ ...table, ...saved })
    const fType = isFacility ? resolveFacilityType({ ...table, ...saved }) : undefined
    const def = fType ? facilityDefaults[fType] : null

    const merged: FloorPlanTable = {
      id: table.id,
      name: table.name,
      capacity: isFacility ? 0 : table.capacity,
      location: isFacility ? undefined : floorName,
      status: "AVAILABLE",
      floor: floorName,
      shape: saved?.shape ?? (def ? def.shape : "RECTANGLE"),
      positionX: saved?.positionX ?? 40,
      positionY: saved?.positionY ?? 40,
      width: saved?.width ?? (def ? def.width : DEFAULT_TABLE_WIDTH),
      height: saved?.height ?? (def ? def.height : DEFAULT_TABLE_HEIGHT),
      rotation: saved?.rotation ?? 0,
      elementType: isFacility ? "FACILITY" : "TABLE",
      facilityType: fType,
      groupId: saved?.groupId ?? table.groupId ?? null,
      groupName: saved?.groupName ?? table.groupName ?? null,
    }
    byFloor[floorName] ??= []
    byFloor[floorName].push(merged)
  }
  return byFloor
}

function FloorPlanBuilderInner() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { fitView } = useReactFlow()

  // Layout Safe-Lock state: ALWAYS starts true on reload, switching pages, or initial load
  const [isLayoutLocked, setIsLayoutLocked] = useState(true)

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.25, duration: 400 })
  }, [fitView])

  // Seeded from localStorage so the canvas paints instantly, then replaced by
  // the server copy below. localStorage is per-browser, so it can only ever be
  // a cache — the database is the source of truth across devices.
  const [floorTables, setFloorTables] = useState<Record<string, FloorPlanTable[]>>(() =>
    buildFloorTables(),
  )
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const initialFloors = useMemo(() => {
    const loadedFloors = Object.keys(floorTables)
    return loadedFloors.length > 0 ? loadedFloors : [DEFAULT_FLOOR_NAME]
  }, [floorTables])
  const [floors, setFloors] = useState<string[]>(() => {
    const persisted = loadFloorNames()
    if (!persisted || persisted.length === 0) return initialFloors
    // Merge in any floors that exist on tables but weren't in the persisted
    // list yet (e.g. first load), keeping the persisted order first.
    const merged = [...persisted]
    for (const f of initialFloors) {
      if (!merged.includes(f)) merged.push(f)
    }
    return merged
  })
  const [activeFloor, setActiveFloor] = useState(initialFloors[0] ?? DEFAULT_FLOOR_NAME)
  const [nodesByFloor, setNodesByFloor] = useState<Record<string, Node<TableNodeData | FacilityNodeData>[]>>({})
  const [isDirty, setIsDirty] = useState(false)

  // History state for Undo & Redo (up to 30 steps)
  // History state for Undo & Redo (up to 30 steps)
  type HistorySnapshot = {
    nodesByFloor: Record<string, Node<TableNodeData | FacilityNodeData>[]>
    floorTables: Record<string, FloorPlanTable[]>
    floors: string[]
    activeFloor: string
  }
  const [past, setPast] = useState<HistorySnapshot[]>([])
  const [future, setFuture] = useState<HistorySnapshot[]>([])

  const isLayoutLockedRef = useRef(isLayoutLocked)
  isLayoutLockedRef.current = isLayoutLocked

  const nodesByFloorRef = useRef(nodesByFloor)
  nodesByFloorRef.current = nodesByFloor

  const floorTablesRef = useRef(floorTables)
  floorTablesRef.current = floorTables

  const activeFloorRef = useRef(activeFloor)
  activeFloorRef.current = activeFloor

  const floorsRef = useRef(floors)
  floorsRef.current = floors

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const handlersRef = useRef<{
    onCycleShape: (id: string) => void
    onRotate: (id: string) => void
    onDelete: (id: string) => void
    onUngroup?: (id: string) => void
    onSelectGroup?: (groupId: string) => void
    onEdit?: (id: string) => void
    onResizeEnd?: (id: string, params: { width: number; height: number; x?: number; y?: number }) => void
  }>({
    onCycleShape: () => {},
    onRotate: () => {},
    onDelete: () => {},
  })

  // Deep-clone snapshot of current layout state across all floors before any mutation
  const takeSnapshot = useCallback(() => {
    const currentNodes = nodesByFloorRef.current
    const currentFloors = floorsRef.current
    const currentActiveFloor = activeFloorRef.current
    const currentFloorTables = floorTablesRef.current
    const currentHandlers = handlersRef.current

    // Materialize all nodes for all floors so empty nodesByFloor never loses initial positions
    const clonedNodes: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
    for (const f of currentFloors) {
      const sourceNodes =
        currentNodes[f] ??
        (currentFloorTables[f] ?? []).map((t) =>
          nodeFromTable(t, currentHandlers, false),
        )
      clonedNodes[f] = sourceNodes.map((n) => ({
        ...n,
        position: { ...n.position },
        data: { ...n.data },
      }))
    }

    const clonedTables: Record<string, FloorPlanTable[]> = {}
    for (const [f, tbls] of Object.entries(currentFloorTables)) {
      clonedTables[f] = tbls.map((t) => ({ ...t }))
    }

    setPast((prev) => [
      ...prev.slice(-30),
      {
        nodesByFloor: clonedNodes,
        floorTables: clonedTables,
        floors: [...currentFloors],
        activeFloor: currentActiveFloor,
      },
    ])
    setFuture([]) // Clear redo stack on fresh user modification
  }, [])

  const handleUndo = useCallback(() => {
    if (past.length === 0) return

    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)

    const currentNodes = nodesByFloorRef.current
    const currentFloors = floorsRef.current
    const currentActiveFloor = activeFloorRef.current
    const currentFloorTables = floorTablesRef.current
    const currentHandlers = handlersRef.current

    // Automatically unlock if locked so user can continue editing immediately
    if (isLayoutLockedRef.current) {
      setIsLayoutLocked(false)
    }

    // Capture current state to future stack for Redo
    const currentClonedNodes: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
    for (const f of currentFloors) {
      const sourceNodes =
        currentNodes[f] ??
        (currentFloorTables[f] ?? []).map((t) =>
          nodeFromTable(t, currentHandlers, false),
        )
      currentClonedNodes[f] = sourceNodes.map((n) => ({
        ...n,
        position: { ...n.position },
        data: { ...n.data },
      }))
    }

    const currentClonedTables: Record<string, FloorPlanTable[]> = {}
    for (const [f, tbls] of Object.entries(currentFloorTables)) {
      currentClonedTables[f] = tbls.map((t) => ({ ...t }))
    }

    setFuture((prev) => [
      {
        nodesByFloor: currentClonedNodes,
        floorTables: currentClonedTables,
        floors: [...currentFloors],
        activeFloor: currentActiveFloor,
      },
      ...prev,
    ])

    setPast(newPast)

    // Reattach current active event handlers to restored nodes
    const restoredNodes: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
    for (const [f, nodesList] of Object.entries(previous.nodesByFloor)) {
      restoredNodes[f] = nodesList.map((n) => {
        if (n.type === "facility") {
          return {
            ...n,
            data: {
              ...n.data,
              isLocked: false,
              onRotate: currentHandlers.onRotate,
              onDelete: currentHandlers.onDelete,
              onResizeEnd: currentHandlers.onResizeEnd,
            },
          }
        }
        return {
          ...n,
          data: {
            ...n.data,
            isLocked: false,
            ...currentHandlers,
          },
        }
      })
    }

    setNodesByFloor(restoredNodes)
    if (previous.floorTables) {
      setFloorTables(previous.floorTables)
    }
    setFloors(previous.floors)
    setActiveFloor(previous.activeFloor)
    setIsDirty(true)
    toast.info("Undo: Reverted action", { duration: 1500 })
  }, [past])

  const handleRedo = useCallback(() => {
    if (future.length === 0) return

    const next = future[0]
    const newFuture = future.slice(1)

    const currentNodes = nodesByFloorRef.current
    const currentFloors = floorsRef.current
    const currentActiveFloor = activeFloorRef.current
    const currentFloorTables = floorTablesRef.current
    const currentHandlers = handlersRef.current

    if (isLayoutLockedRef.current) {
      setIsLayoutLocked(false)
    }

    // Capture current state to past stack for Undo
    const currentClonedNodes: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
    for (const f of currentFloors) {
      const sourceNodes =
        currentNodes[f] ??
        (currentFloorTables[f] ?? []).map((t) =>
          nodeFromTable(t, currentHandlers, false),
        )
      currentClonedNodes[f] = sourceNodes.map((n) => ({
        ...n,
        position: { ...n.position },
        data: { ...n.data },
      }))
    }

    const currentClonedTables: Record<string, FloorPlanTable[]> = {}
    for (const [f, tbls] of Object.entries(currentFloorTables)) {
      currentClonedTables[f] = tbls.map((t) => ({ ...t }))
    }

    setPast((prev) => [
      ...prev,
      {
        nodesByFloor: currentClonedNodes,
        floorTables: currentClonedTables,
        floors: [...currentFloors],
        activeFloor: currentActiveFloor,
      },
    ])

    setFuture(newFuture)

    // Reattach current active event handlers to restored nodes
    const restoredNodes: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
    for (const [f, nodesList] of Object.entries(next.nodesByFloor)) {
      restoredNodes[f] = nodesList.map((n) => {
        if (n.type === "facility") {
          return {
            ...n,
            data: {
              ...n.data,
              isLocked: false,
              onRotate: currentHandlers.onRotate,
              onDelete: currentHandlers.onDelete,
              onResizeEnd: currentHandlers.onResizeEnd,
            },
          }
        }
        return {
          ...n,
          data: {
            ...n.data,
            isLocked: false,
            ...currentHandlers,
          },
        }
      })
    }

    setNodesByFloor(restoredNodes)
    if (next.floorTables) {
      setFloorTables(next.floorTables)
    }
    setFloors(next.floors)
    setActiveFloor(next.activeFloor)
    setIsDirty(true)
    toast.info("Redo: Restored action", { duration: 1500 })
  }, [future])

  // Global Keyboard Shortcuts (Cmd+Z / Ctrl+Z for Undo, Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.shiftKey && (e.key === "z" || e.key === "Z")) {
          e.preventDefault()
          handleRedo()
        } else if (!e.shiftKey && (e.key === "z" || e.key === "Z")) {
          e.preventDefault()
          handleUndo()
        } else if (!e.shiftKey && (e.key === "y" || e.key === "Y")) {
          e.preventDefault()
          handleRedo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo, handleRedo])

  useEffect(() => {
    saveFloorNames(floors)
  }, [floors])

  // Keep isLocked synced on all nodes across all floors when toggled
  useEffect(() => {
    setNodesByFloor((current) => {
      let changed = false
      const next: typeof current = {}
      for (const [floor, floorNodes] of Object.entries(current)) {
        next[floor] = floorNodes.map((n) => {
          if (n.data.isLocked !== isLayoutLocked) {
            changed = true
            return {
              ...n,
              data: {
                ...n.data,
                isLocked: isLayoutLocked,
              },
            }
          }
          return n
        })
      }
      return changed ? next : current
    })
  }, [isLayoutLocked])

  const handleCycleShape = useCallback((id: string) => {
    takeSnapshot()
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].map((n) => {
          if (n.id !== id || n.type !== "table") return n
          const data = n.data as TableNodeData
          const idx = shapeCycle.indexOf(data.shape)
          const newShape = shapeCycle[(idx + 1) % shapeCycle.length]
          return { ...n, data: { ...data, shape: newShape } }
        })
      }
      return next
    })
    setIsDirty(true)
  }, [takeSnapshot])

  const handleRotate = useCallback((id: string) => {
    takeSnapshot()
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].map((n) =>
          n.id === id ? { ...n, data: { ...n.data, rotation: ((n.data.rotation || 0) + 15) % 360 } } : n,
        )
      }
      return next
    })
    setIsDirty(true)
  }, [takeSnapshot])

  const handleDelete = useCallback((id: string) => {
    takeSnapshot()
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].filter((n) => n.id !== id)
      }
      return next
    })
    setIsDirty(true)
  }, [takeSnapshot])

  const handleUngroupTable = useCallback((id: string) => {
    takeSnapshot()
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].map((n) => {
          if (n.id === id && n.type === "table") {
            const data = n.data as TableNodeData
            return {
              ...n,
              data: {
                ...data,
                groupId: null,
                groupName: null,
              },
            }
          }
          return n
        })
      }
      return next
    })
    setIsDirty(true)
    toast.success("Table ungrouped")
  }, [takeSnapshot])

  const handleSelectGroup = useCallback((groupId: string) => {
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].map((n) => {
          if (n.type === "table" && (n.data as TableNodeData).groupId === groupId) {
            return { ...n, selected: true }
          }
          return { ...n, selected: false }
        })
      }
      return next
    })
  }, [])

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTableId, setEditTableId] = useState<string | null>(null)
  const [editTableName, setEditTableName] = useState("")
  const [editTableCapacity, setEditTableCapacity] = useState("4")
  const [editTableLocation, setEditTableLocation] = useState("")
  const [editTableShape, setEditTableShape] = useState<TableShape>("RECTANGLE")
  const [editTableStatus, setEditTableStatus] = useState<TableStatus>("AVAILABLE")
  const [editTableWidth, setEditTableWidth] = useState<string>("")
  const [editTableHeight, setEditTableHeight] = useState<string>("")

  const handleOpenEditDialog = useCallback(
    (id: string) => {
      const currentNodes = nodesByFloorRef.current
      const currentFloorTables = floorTablesRef.current
      const currentActiveFloor = activeFloorRef.current

      // 1. Search in nodesByFloor
      for (const f of Object.keys(currentNodes)) {
        const found = currentNodes[f]?.find((n) => n.id === id && n.type === "table") as Node<TableNodeData> | undefined
        if (found) {
          const data = found.data
          const w = (found.width as number) || (data.width as number) || (data.shape === "CIRCLE" || data.shape === "SQUARE" ? 100 : DEFAULT_TABLE_WIDTH)
          const h = (found.height as number) || (data.height as number) || (data.shape === "CIRCLE" || data.shape === "SQUARE" ? 100 : DEFAULT_TABLE_HEIGHT)
          setEditTableId(id)
          setEditTableName(data.name)
          setEditTableCapacity(String(data.capacity))
          setEditTableLocation(data.location || f || currentActiveFloor)
          setEditTableShape(data.shape)
          setEditTableStatus(data.status)
          setEditTableWidth(String(Math.round(w)))
          setEditTableHeight(String(Math.round(h)))
          setIsEditDialogOpen(true)
          return
        }
      }

      // 2. Search in floorTables
      for (const f of Object.keys(currentFloorTables)) {
        const found = currentFloorTables[f]?.find((t) => t.id === id)
        if (found) {
          const w = found.width || (found.shape === "CIRCLE" || found.shape === "SQUARE" ? 100 : DEFAULT_TABLE_WIDTH)
          const h = found.height || (found.shape === "CIRCLE" || found.shape === "SQUARE" ? 100 : DEFAULT_TABLE_HEIGHT)
          setEditTableId(id)
          setEditTableName(found.name)
          setEditTableCapacity(String(found.capacity))
          setEditTableLocation(found.location || found.floor || f || currentActiveFloor)
          setEditTableShape(found.shape || "RECTANGLE")
          setEditTableStatus(found.status || "AVAILABLE")
          setEditTableWidth(String(Math.round(w)))
          setEditTableHeight(String(Math.round(h)))
          setIsEditDialogOpen(true)
          return
        }
      }

      // 3. Fallback: search stored local tables
      const localTables = loadFloorPlanTables() ?? []
      const foundLocal = localTables.find((t) => t.id === id)
      if (foundLocal) {
        setEditTableId(id)
        setEditTableName(foundLocal.name)
        setEditTableCapacity(String(foundLocal.capacity))
        setEditTableLocation(foundLocal.floor || currentActiveFloor)
        setEditTableShape("RECTANGLE")
        setEditTableStatus("AVAILABLE")
        setEditTableWidth(String(DEFAULT_TABLE_WIDTH))
        setEditTableHeight(String(DEFAULT_TABLE_HEIGHT))
        setIsEditDialogOpen(true)
        return
      }

      // 4. Default fallback
      setEditTableId(id)
      setEditTableName("Table")
      setEditTableCapacity("4")
      setEditTableLocation(currentActiveFloor)
      setEditTableShape("RECTANGLE")
      setEditTableStatus("AVAILABLE")
      setEditTableWidth(String(DEFAULT_TABLE_WIDTH))
      setEditTableHeight(String(DEFAULT_TABLE_HEIGHT))
      setIsEditDialogOpen(true)
    },
    [],
  )

  const handleSaveEditTable = useCallback(() => {
    if (!editTableId) return
    takeSnapshot()
    const capacity = Math.max(1, Number(editTableCapacity) || 1)
    const finalName = editTableName.trim() || "Table"
    const finalLocation = editTableLocation.trim() || undefined

    const parsedCustomW = Math.max(30, Number(editTableWidth) || 0)
    const parsedCustomH = Math.max(30, Number(editTableHeight) || 0)

    let updatedWidth = DEFAULT_TABLE_WIDTH
    let updatedHeight = DEFAULT_TABLE_HEIGHT

    setNodesByFloor((current) => {
      const next = { ...current }
      for (const f of Object.keys(next)) {
        next[f] = next[f].map((n) => {
          if (n.id === editTableId && n.type === "table") {
            const data = n.data as TableNodeData
            const existingW = (n.width as number) || (data.width as number) || DEFAULT_TABLE_WIDTH
            const existingH = (n.height as number) || (data.height as number) || DEFAULT_TABLE_HEIGHT

            // Preserve existing custom resized dimensions unless explicitly edited in input
            let finalW = parsedCustomW > 0 ? parsedCustomW : existingW
            let finalH = parsedCustomH > 0 ? parsedCustomH : existingH

            // If shape changed to circle/square, adjust to square aspect ratio using max dimension
            if (data.shape !== editTableShape && (editTableShape === "CIRCLE" || editTableShape === "SQUARE")) {
              const maxDim = Math.max(finalW, finalH)
              finalW = maxDim
              finalH = maxDim
            }

            updatedWidth = finalW
            updatedHeight = finalH

            return {
              ...n,
              width: finalW,
              height: finalH,
              data: {
                ...data,
                name: finalName,
                capacity,
                location: finalLocation,
                status: editTableStatus,
                shape: editTableShape,
                width: finalW,
                height: finalH,
              },
            }
          }
          return n
        })
      }
      return next
    })

    setFloorTables((current) => {
      const next = { ...current }
      for (const f of Object.keys(next)) {
        next[f] = next[f].map((t) =>
          t.id === editTableId
            ? {
                ...t,
                name: finalName,
                capacity,
                location: finalLocation,
                status: editTableStatus,
                shape: editTableShape,
                width: updatedWidth,
                height: updatedHeight,
              }
            : t,
        )
      }
      return next
    })

    setIsDirty(true)
    setIsEditDialogOpen(false)
    toast.success(`Table "${finalName}" updated`)
  }, [
    editTableId,
    editTableName,
    editTableCapacity,
    editTableLocation,
    editTableStatus,
    editTableShape,
    editTableWidth,
    editTableHeight,
    takeSnapshot,
  ])

  const handleResizeEnd = useCallback(
    (id: string, params: { width: number; height: number; x?: number; y?: number }) => {
      takeSnapshot()
      const newWidth = Math.round(params.width)
      const newHeight = Math.round(params.height)
      setNodesByFloor((current) => {
        const next = { ...current }
        for (const floor of Object.keys(next)) {
          next[floor] = next[floor].map((n) => {
            if (n.id === id) {
              const newPos =
                params.x !== undefined && params.y !== undefined
                  ? { x: Math.round(params.x), y: Math.round(params.y) }
                  : n.position
              return {
                ...n,
                position: newPos,
                width: newWidth,
                height: newHeight,
                data: {
                  ...n.data,
                  width: newWidth,
                  height: newHeight,
                },
              }
            }
            return n
          })
        }
        return next
      })

      setFloorTables((current) => {
        const next = { ...current }
        for (const floor of Object.keys(next)) {
          next[floor] = next[floor].map((t) =>
            t.id === id
              ? {
                  ...t,
                  positionX: params.x !== undefined ? Math.round(params.x) : t.positionX,
                  positionY: params.y !== undefined ? Math.round(params.y) : t.positionY,
                  width: newWidth,
                  height: newHeight,
                }
              : t,
          )
        }
        return next
      })

      setIsDirty(true)
    },
    [takeSnapshot],
  )

  const handlers = useMemo(
    () => ({
      onCycleShape: handleCycleShape,
      onRotate: handleRotate,
      onDelete: handleDelete,
      onUngroup: handleUngroupTable,
      onSelectGroup: handleSelectGroup,
      onEdit: handleOpenEditDialog,
      onResizeEnd: handleResizeEnd,
    }),
    [handleCycleShape, handleRotate, handleDelete, handleUngroupTable, handleSelectGroup, handleOpenEditDialog, handleResizeEnd],
  )

  handlersRef.current = handlers

  // Pull the authoritative plan from the database on initial mount.
  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(async () => {
      const tables = await fetchFloorPlanFromServer()
      if (cancelled) {
        return
      }
      if (tables) {
        const byFloor: Record<string, FloorPlanTable[]> = {}
        for (const table of tables) {
          const floorName = table.floor || DEFAULT_FLOOR_NAME
          byFloor[floorName] ??= []
          byFloor[floorName].push({ ...table, floor: floorName })
        }
        setFloorTables(byFloor)
        setNodesByFloor(() => {
          const next: Record<string, Node<TableNodeData | FacilityNodeData>[]> = {}
          for (const [f, tbls] of Object.entries(byFloor)) {
            next[f] = tbls.map((t) => nodeFromTable(t, handlersRef.current))
          }
          return next
        })
        setFloors((current) => {
          const merged = [...current]
          for (const f of Object.keys(byFloor)) {
            if (!merged.includes(f)) merged.push(f)
          }
          return merged
        })
        saveFloorPlanTables(
          tables.map((tb) => ({
            id: tb.id,
            name: tb.name,
            floor: tb.floor,
            capacity: tb.capacity,
            elementType: tb.elementType,
            facilityType: tb.facilityType,
            groupId: tb.groupId,
            groupName: tb.groupName,
          })),
        )
        void savePositions(
          tables.map((tb) => ({
            id: tb.id,
            positionX: tb.positionX,
            positionY: tb.positionY,
            width: tb.width,
            height: tb.height,
            shape: tb.shape,
            rotation: tb.rotation,
            floor: tb.floor,
            elementType: tb.elementType,
            facilityType: tb.facilityType,
            groupId: tb.groupId,
            groupName: tb.groupName,
          })),
        )
      }
      setIsLoadingPlan(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveResult, setLastSaveResult] = useState<"server" | "local" | null>(null)
  const [tableCounter, setTableCounter] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [newTableCapacity, setNewTableCapacity] = useState("4")
  const [newTableLocation, setNewTableLocation] = useState("")
  const [newTableShape, setNewTableShape] = useState<TableShape>("RECTANGLE")
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>("AVAILABLE")
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Add Floor Dialog state
  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false)
  const [newFloorName, setNewFloorName] = useState("")
  const [floorNameError, setFloorNameError] = useState<string | null>(null)

  // Facility Dialog state
  const [isAddFacilityDialogOpen, setIsAddFacilityDialogOpen] = useState(false)
  const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityType>("BAR")
  const [facilityCustomName, setFacilityCustomName] = useState("")

  // Group Dialog state
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [customGroupName, setCustomGroupName] = useState("")

  const handleOpenAddFloorDialog = useCallback(() => {
    const existingNumbers = floors
      .map((f) => /^Floor (\d+)$/.exec(f)?.[1])
      .filter((n): n is string => Boolean(n))
      .map(Number)
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : (floors.length + 1)
    setNewFloorName(`Floor ${nextNumber}`)
    setFloorNameError(null)
    setIsAddFloorDialogOpen(true)
  }, [floors])

  const handleCreateFloor = useCallback(() => {
    const trimmed = newFloorName.trim()
    if (!trimmed) {
      setFloorNameError(t("pages.floorPlan.addFloorDialog.errorNameRequired"))
      return
    }
    if (floors.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      setFloorNameError(t("pages.floorPlan.addFloorDialog.errorNameExists"))
      return
    }

    setNodesByFloor((current) => ({ ...current, [trimmed]: [] }))
    setFloors((current) => [...current, trimmed])
    setActiveFloor(trimmed)
    setIsDirty(true)
    setIsAddFloorDialogOpen(false)
    toast.success(`Floor "${trimmed}" added!`)
  }, [newFloorName, floors, t])

  // Delete Floor Dialog state
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null)
  const [isDeleteFloorDialogOpen, setIsDeleteFloorDialogOpen] = useState(false)

  const handleRequestDeleteFloor = useCallback(
    (floorName: string) => {
      if (floors.length <= 1) {
        toast.error(t("pages.floorPlan.deleteFloorDialog.cannotDeleteLast"))
        return
      }
      setFloorToDelete(floorName)
      setIsDeleteFloorDialogOpen(true)
    },
    [floors.length, t],
  )

  const handleConfirmDeleteFloor = useCallback(() => {
    if (!floorToDelete) return
    takeSnapshot()
    const remainingFloors = floors.filter((f) => f !== floorToDelete)
    if (remainingFloors.length === 0) return

    setNodesByFloor((current) => {
      const next = { ...current }
      delete next[floorToDelete]
      return next
    })
    setFloorTables((current) => {
      const next = { ...current }
      delete next[floorToDelete]
      return next
    })
    setFloors(remainingFloors)
    if (activeFloor === floorToDelete) {
      setActiveFloor(remainingFloors[0])
    }
    setIsDirty(true)
    setIsDeleteFloorDialogOpen(false)
    toast.success(`Floor "${floorToDelete}" deleted`)
    setFloorToDelete(null)
  }, [floorToDelete, floors, activeFloor, takeSnapshot])


  const getFloorNodes = useCallback(
    (floor: string): Node<TableNodeData | FacilityNodeData>[] => {
      if (nodesByFloor[floor]) return nodesByFloor[floor]
      return (floorTables[floor] ?? []).map((t) => nodeFromTable(t, handlers))
    },
    [nodesByFloor, floorTables, handlers],
  )

  const nodes = useMemo(() => {
    return getFloorNodes(activeFloor)
  }, [getFloorNodes, activeFloor])

  // Multi-selected tables on the active floor
  const selectedTableNodes = useMemo(() => {
    return nodes.filter((n) => n.selected && n.type === "table") as Node<TableNodeData>[]
  }, [nodes])

  const totalSelectedCapacity = useMemo(() => {
    return selectedTableNodes.reduce((acc, n) => acc + (n.data.capacity || 0), 0)
  }, [selectedTableNodes])

  const selectedGroupIds = useMemo(() => {
    const ids = new Set<string>()
    for (const n of selectedTableNodes) {
      if (n.data.groupId) ids.add(n.data.groupId)
    }
    return Array.from(ids)
  }, [selectedTableNodes])

  const handleOpenGroupDialog = useCallback(() => {
    const defaultName = `Group ${selectedTableNodes.map((n) => n.data.name).join("+")}`
    setCustomGroupName(defaultName.length > 25 ? `Banquet (${totalSelectedCapacity}p)` : defaultName)
    setIsGroupDialogOpen(true)
  }, [selectedTableNodes, totalSelectedCapacity])

  const handleGroupSelectedTables = useCallback(() => {
    if (selectedTableNodes.length < 2) return
    takeSnapshot()
    const newGroupId = `grp-${crypto.randomUUID()}`
    const finalGroupName =
      customGroupName.trim() || `Group ${selectedTableNodes.map((n) => n.data.name).join("+")}`
    const selectedIds = new Set(selectedTableNodes.map((n) => n.id))

    setActiveFloorNodes((current) =>
      current.map((n) => {
        if (selectedIds.has(n.id) && n.type === "table") {
          const data = n.data as TableNodeData
          return {
            ...n,
            data: {
              ...data,
              groupId: newGroupId,
              groupName: finalGroupName,
            },
          }
        }
        return n
      }),
    )

    setIsDirty(true)
    setIsGroupDialogOpen(false)
    toast.success(`Grouped ${selectedTableNodes.length} tables as "${finalGroupName}" (${totalSelectedCapacity} seats)`)
  }, [selectedTableNodes, customGroupName, totalSelectedCapacity, takeSnapshot])

  const handleUngroupSelectedTables = useCallback(() => {
    takeSnapshot()
    const selectedIds = new Set(selectedTableNodes.map((n) => n.id))
    setActiveFloorNodes((current) =>
      current.map((n) => {
        if (selectedIds.has(n.id) && n.type === "table") {
          const data = n.data as TableNodeData
          return {
            ...n,
            data: {
              ...data,
              groupId: null,
              groupName: null,
            },
          }
        }
        return n
      }),
    )
    setIsDirty(true)
    toast.success("Tables ungrouped")
  }, [selectedTableNodes, takeSnapshot])

  const handleDeselectAll = useCallback(() => {
    setActiveFloorNodes((current) => current.map((n) => ({ ...n, selected: false })))
  }, [])

  const setActiveFloorNodes = useCallback(
    (updater: (current: Node<TableNodeData | FacilityNodeData>[]) => Node<TableNodeData | FacilityNodeData>[]) => {
      setNodesByFloor((current) => {
        const floorNodes = current[activeFloor] ?? (floorTables[activeFloor] ?? []).map((t) => nodeFromTable(t, handlers))
        return {
          ...current,
          [activeFloor]: updater(floorNodes),
        }
      })
    },
    [activeFloor, floorTables, handlers],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<TableNodeData | FacilityNodeData>>[]) => {
      setActiveFloorNodes((current) => applyNodeChanges(changes, current))
      // Only user-initiated removals should mark dirty.
      // React Flow emits 'dimensions' on internal DOM measurement and 'select' on selection - neither should mark dirty!
      if (changes.some((c) => c.type === "remove")) {
        setIsDirty(true)
      }
    },
    [setActiveFloorNodes],
  )

  const handleOpenAddDialog = useCallback(() => {
    setIsLayoutLocked(false)
    setNewTableName(`T${tableCounter}`)
    setNewTableCapacity("4")
    setNewTableLocation(activeFloor)
    setNewTableShape("RECTANGLE")
    setNewTableStatus("AVAILABLE")
    setIsAddDialogOpen(true)
  }, [tableCounter, activeFloor])

  const handleOpenAddFacilityDialog = useCallback(() => {
    setIsLayoutLocked(false)
    setSelectedFacilityType("BAR")
    setFacilityCustomName(facilityDefaults.BAR.name)
    setIsAddFacilityDialogOpen(true)
  }, [])

  const handleSelectFacilityType = useCallback((type: FacilityType) => {
    setSelectedFacilityType(type)
    setFacilityCustomName(facilityDefaults[type].name)
  }, [])

  const handleCreateTable = useCallback(() => {
    takeSnapshot()
    const capacity = Math.max(1, Number(newTableCapacity) || 1)
    const size =
      newTableShape === "CIRCLE"
        ? { width: 40 + capacity * 12, height: 40 + capacity * 12 }
        : newTableShape === "SQUARE"
          ? { width: 40 + capacity * 10, height: 40 + capacity * 10 }
          : { width: DEFAULT_TABLE_WIDTH, height: DEFAULT_TABLE_HEIGHT }

    const newNode: Node<TableNodeData> = {
      id: `new-${crypto.randomUUID()}`,
      type: "table",
      selected: true,
      position: { x: 60 + ((nodes.length * 24) % 300), y: 60 + ((nodes.length * 24) % 200) },
      width: size.width,
      height: size.height,
      data: {
        name: newTableName.trim() || `T${tableCounter}`,
        capacity,
        location: newTableLocation.trim() || undefined,
        status: newTableStatus,
        shape: newTableShape,
        rotation: 0,
        width: size.width,
        height: size.height,
        isLocked: false,
        ...handlers,
      },
    }
    setTableCounter((c) => c + 1)
    setActiveFloorNodes((current) => [...current.map((n) => ({ ...n, selected: false })), newNode])
    setIsDirty(true)
    setIsAddDialogOpen(false)
    toast.success(`Table "${newTableName.trim() || `T${tableCounter}`}" added to ${activeFloor}`)
  }, [
    nodes.length,
    newTableName,
    newTableCapacity,
    newTableLocation,
    newTableShape,
    newTableStatus,
    tableCounter,
    activeFloor,
    handlers,
    setActiveFloorNodes,
    takeSnapshot,
  ])

  const handleCreateFacility = useCallback(() => {
    takeSnapshot()
    const def = facilityDefaults[selectedFacilityType]
    const finalName = facilityCustomName.trim() || def.name
    const newNode: Node<FacilityNodeData> = {
      id: `fac-${crypto.randomUUID()}`,
      type: "facility",
      selected: true,
      position: { x: 60 + ((nodes.length * 28) % 280), y: 60 + ((nodes.length * 28) % 200) },
      width: def.width,
      height: def.height,
      data: {
        name: finalName,
        facilityType: selectedFacilityType,
        rotation: 0,
        width: def.width,
        height: def.height,
        onRotate: handleRotate,
        onDelete: handleDelete,
        onResizeEnd: handleResizeEnd,
      },
    }
    setActiveFloorNodes((current) => [...current.map((n) => ({ ...n, selected: false })), newNode])
    setIsDirty(true)
    setIsAddFacilityDialogOpen(false)
    toast.success(`Facility "${finalName}" added to ${activeFloor}`)
  }, [
    selectedFacilityType,
    facilityCustomName,
    nodes.length,
    activeFloor,
    handleRotate,
    handleDelete,
    handleResizeEnd,
    setActiveFloorNodes,
    takeSnapshot,
  ])

  const handleSave = useCallback(async (options?: { isAuto?: boolean }) => {
    setIsSaving(true)
    try {
      const currentNodes = nodesByFloorRef.current
      const currentFloorTables = floorTablesRef.current
      const currentFloors = floorsRef.current

      const allNodes: { floor: string; node: Node<TableNodeData | FacilityNodeData> }[] = []
      for (const floor of currentFloors) {
        const floorNodes = currentNodes[floor] ?? (currentFloorTables[floor] ?? []).map((t) => nodeFromTable(t, handlersRef.current))
        for (const node of floorNodes) {
          allNodes.push({ floor, node })
        }
      }

      const savePayload = allNodes.map(({ floor, node }) => {
        const isFacility = node.type === "facility"
        const tableData = node.data as Partial<TableNodeData>
        const facilityData = node.data as Partial<FacilityNodeData>
        return {
          name: node.data.name,
          capacity: isFacility ? 0 : (tableData.capacity ?? 4),
          location: isFacility ? `FACILITY:${facilityData.facilityType || "BAR"}` : (tableData.location ?? null),
          floor: floor || DEFAULT_FLOOR_NAME,
          shape: isFacility ? "RECTANGLE" : (tableData.shape ?? "RECTANGLE"),
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
          width: node.width ?? (isFacility ? 120 : DEFAULT_TABLE_WIDTH),
          height: node.height ?? (isFacility ? 60 : DEFAULT_TABLE_HEIGHT),
          rotation: node.data.rotation || 0,
          elementType: (isFacility ? "FACILITY" : "TABLE") as "FACILITY" | "TABLE",
          facilityType: isFacility ? facilityData.facilityType : undefined,
          groupId: isFacility ? null : (tableData.groupId ?? null),
          groupName: isFacility ? null : (tableData.groupName ?? null),
        }
      })

      // Sync to backend
      const serverSynced = await syncFloorPlanToServer(savePayload)

      // Also persist locally
      saveFloorPlanTables(
        allNodes.map(({ floor, node }) => ({
          id: node.id,
          name: node.data.name,
          floor: floor || DEFAULT_FLOOR_NAME,
          capacity: node.type === "facility" ? 0 : (node.data as TableNodeData).capacity,
          elementType: node.type === "facility" ? "FACILITY" : "TABLE",
          facilityType: node.type === "facility" ? (node.data as FacilityNodeData).facilityType : undefined,
          groupId: node.type === "facility" ? null : (node.data as TableNodeData).groupId,
          groupName: node.type === "facility" ? null : (node.data as TableNodeData).groupName,
        })),
      )

      await savePositions(
        allNodes.map(({ floor, node }) => {
          const isFacility = node.type === "facility"
          const tableData = node.data as Partial<TableNodeData>
          const facilityData = node.data as Partial<FacilityNodeData>
          return {
            id: node.id,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
            width: node.width ?? (isFacility ? 120 : DEFAULT_TABLE_WIDTH),
            height: node.height ?? (isFacility ? 60 : DEFAULT_TABLE_HEIGHT),
            shape: isFacility ? "RECTANGLE" : (tableData.shape ?? "RECTANGLE"),
            rotation: node.data.rotation || 0,
            floor: floor || DEFAULT_FLOOR_NAME,
            elementType: isFacility ? "FACILITY" : "TABLE",
            facilityType: isFacility ? facilityData.facilityType : undefined,
            groupId: isFacility ? null : (tableData.groupId ?? null),
            groupName: isFacility ? null : (tableData.groupName ?? null),
          }
        }),
      )

      // Update floorTables state with the newly saved tables
      const updatedByFloor: Record<string, FloorPlanTable[]> = {}
      for (const { floor, node } of allNodes) {
        const isFacility = node.type === "facility"
        const tableData = node.data as Partial<TableNodeData>
        const facilityData = node.data as Partial<FacilityNodeData>
        updatedByFloor[floor] ??= []
        updatedByFloor[floor].push({
          id: node.id,
          name: node.data.name,
          capacity: isFacility ? 0 : (tableData.capacity ?? 4),
          location: isFacility ? undefined : (tableData.location ?? undefined),
          status: (tableData.status as TableStatus) || "AVAILABLE",
          floor: floor || DEFAULT_FLOOR_NAME,
          shape: isFacility ? "RECTANGLE" : (tableData.shape ?? "RECTANGLE"),
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
          width: node.width ?? (isFacility ? 120 : DEFAULT_TABLE_WIDTH),
          height: node.height ?? (isFacility ? 60 : DEFAULT_TABLE_HEIGHT),
          rotation: node.data.rotation || 0,
          elementType: isFacility ? "FACILITY" : "TABLE",
          facilityType: isFacility ? facilityData.facilityType : undefined,
          groupId: isFacility ? null : (tableData.groupId ?? null),
          groupName: isFacility ? null : (tableData.groupName ?? null),
        })
      }
      setFloorTables(updatedByFloor)
      setIsDirty(false)
      setLastSaveResult(serverSynced ? "server" : "local")
      if (!options?.isAuto) {
        toast.success(serverSynced ? "Floor plan saved to server successfully!" : "Floor plan layout saved locally!")
      }
    } catch (err) {
      console.error("[floor-plan] Save error:", err)
      if (!options?.isAuto) {
        toast.error("Failed to save floor plan. Please try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  // Synchronously persist layout locally on every dirty state so page switches never lose edits
  useEffect(() => {
    if (!isDirty || isLoadingPlan) return

    const currentNodes = nodesByFloorRef.current
    const currentFloorTables = floorTablesRef.current
    const currentFloors = floorsRef.current

    const allNodes: { floor: string; node: Node<TableNodeData | FacilityNodeData> }[] = []
    for (const floor of currentFloors) {
      const floorNodes = currentNodes[floor] ?? (currentFloorTables[floor] ?? []).map((t) => nodeFromTable(t, handlersRef.current))
      for (const node of floorNodes) {
        allNodes.push({ floor, node })
      }
    }

    if (allNodes.length > 0) {
      saveFloorPlanTables(
        allNodes.map(({ floor, node }) => ({
          id: node.id,
          name: node.data.name,
          floor: floor || DEFAULT_FLOOR_NAME,
          capacity: node.type === "facility" ? 0 : (node.data as TableNodeData).capacity,
          elementType: node.type === "facility" ? "FACILITY" : "TABLE",
          facilityType: node.type === "facility" ? (node.data as FacilityNodeData).facilityType : undefined,
          groupId: node.type === "facility" ? null : (node.data as TableNodeData).groupId,
          groupName: node.type === "facility" ? null : (node.data as TableNodeData).groupName,
        })),
      )

      void savePositions(
        allNodes.map(({ floor, node }) => {
          const isFacility = node.type === "facility"
          const tableData = node.data as Partial<TableNodeData>
          const facilityData = node.data as Partial<FacilityNodeData>
          return {
            id: node.id,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
            width: node.width ?? (isFacility ? 120 : DEFAULT_TABLE_WIDTH),
            height: node.height ?? (isFacility ? 60 : DEFAULT_TABLE_HEIGHT),
            shape: isFacility ? "RECTANGLE" : (tableData.shape ?? "RECTANGLE"),
            rotation: node.data.rotation || 0,
            floor: floor || DEFAULT_FLOOR_NAME,
            elementType: isFacility ? "FACILITY" : "TABLE",
            facilityType: isFacility ? facilityData.facilityType : undefined,
            groupId: isFacility ? null : (tableData.groupId ?? null),
            groupName: isFacility ? null : (tableData.groupName ?? null),
          }
        }),
      )
    }
  }, [nodesByFloor, isDirty, isLoadingPlan])

  // Debounced Auto-Save to Backend + Unmount Flush on page switch
  useEffect(() => {
    if (!isDirty || isLoadingPlan) return

    const timer = setTimeout(() => {
      void handleSaveRef.current({ isAuto: true })
    }, 500)

    return () => {
      clearTimeout(timer)
      // When navigating away / unmounting while dirty, flush save to server immediately!
      if (isDirtyRef.current) {
        void handleSaveRef.current({ isAuto: true })
      }
    }
  }, [isDirty, isLoadingPlan])

  // Flush on browser tab close / reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        void handleSaveRef.current({ isAuto: true })
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const edges = useMemo(() => [], [])

  // Escape exits the expanded canvas, and the page behind it is locked so it
  // can't scroll under the overlay on touch devices.
  useEffect(() => {
    if (!isFullscreen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    document.addEventListener("keydown", onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isFullscreen])

  const statusCounts = useMemo(() => {
    const counts: Record<TableStatus, number> = { AVAILABLE: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 }
    for (const n of nodes) {
      if (n.type === "table" && (n.data as TableNodeData).status) {
        counts[(n.data as TableNodeData).status]++
      }
    }
    return counts
  }, [nodes])

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        // A CSS overlay rather than the Fullscreen API: iOS Safari doesn't
        // support requestFullscreen() on non-video elements. Wrapping the
        // whole builder keeps the floor tabs and save/reset controls usable
        // while expanded.
        isFullscreen && "bg-background fixed inset-0 z-50 overflow-auto p-4",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.floorPlan.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.floorPlan.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live Auto-Save / Cloud Status Indicator */}
          {isSaving ? (
            <Badge
              variant="outline"
              className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
            >
              <Loader2 className="size-3 animate-spin" />
              <span>Saving changes...</span>
            </Badge>
          ) : isDirty ? (
            <Badge
              variant="outline"
              className="gap-1.5 text-xs text-muted-foreground border-dashed"
            >
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </Badge>
          ) : lastSaveResult ? (
            <Badge
              variant="outline"
              className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            >
              <CheckCircle2 className="size-3" />
              <span>
                {lastSaveResult === "server" ? "Auto-saved to server" : "Auto-saved"}
              </span>
            </Badge>
          ) : null}

          {/* Lock / Unlock Mode Toggle Button */}
          <Button
            type="button"
            variant={isLayoutLocked ? "outline" : "default"}
            size="sm"
            onClick={() => {
              if (isLayoutLocked) {
                setIsLayoutLocked(false)
                toast.info("Floor plan unlocked. You can now drag, resize, and arrange tables.")
              } else {
                setIsLayoutLocked(true)
                if (isDirtyRef.current) {
                  void handleSaveRef.current({ isAuto: false })
                } else {
                  toast.success("Floor plan layout locked. Table positions are protected.")
                }
              }
            }}
            className={cn(
              "gap-1.5 font-semibold transition-all shadow-xs text-xs",
              isLayoutLocked
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white",
            )}
            title={
              isLayoutLocked
                ? "Layout is locked (Safe Mode). Click to unlock and edit tables."
                : "Layout is unlocked for editing. Click to lock and protect table positions."
            }
          >
            {isLayoutLocked ? (
              <>
                <Lock className="size-3.5 shrink-0 text-amber-500" />
                <span>Layout Locked</span>
              </>
            ) : (
              <>
                <Unlock className="size-3.5 shrink-0 animate-pulse" />
                <span>Editing Layout (Lock)</span>
              </>
            )}
          </Button>

          {/* Undo & Redo Controls */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={past.length === 0}
              className="gap-1.5 font-semibold text-xs rounded-xl h-8 px-2.5"
              title="Undo (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="size-3.5" />
              <span>Undo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={future.length === 0}
              className="gap-1.5 font-semibold text-xs rounded-xl h-8 px-2.5"
              title="Redo (Ctrl+Shift+Z / ⌘⇧Z)"
            >
              <Redo2 className="size-3.5" />
              <span>Redo</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen((f) => !f)}
            aria-label={
              isFullscreen ? t("pages.floorPlan.exitFullscreen") : t("pages.floorPlan.enterFullscreen")
            }
            title={
              isFullscreen ? t("pages.floorPlan.exitFullscreen") : t("pages.floorPlan.enterFullscreen")
            }
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <LayoutGrid className="text-muted-foreground mr-1 size-4" />
          {floors.map((floor) => {
            const isActive = floor === activeFloor
            const floorItems = nodesByFloor[floor] ?? floorTables[floor] ?? []
            return (
              <div key={floor} className="group relative inline-flex items-center">
                <Button
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setActiveFloor(floor)}
                  className={cn(
                    "relative transition-all",
                    floors.length > 1 && (isActive ? "pr-7.5" : "hover:pr-7.5"),
                  )}
                >
                  <span>{floor}</span>
                  {floorItems.length > 0 && (
                    <span
                      className={cn(
                        "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {floorItems.length}
                    </span>
                  )}
                </Button>
                {floors.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRequestDeleteFloor(floor)
                    }}
                    className={cn(
                      "absolute right-1.5 size-5 items-center justify-center rounded-full transition-all cursor-pointer",
                      isActive
                        ? "flex text-primary-foreground/80 hover:bg-destructive hover:text-destructive-foreground"
                        : "hidden group-hover:flex text-muted-foreground hover:bg-destructive hover:text-destructive-foreground",
                    )}
                    title={t("pages.floorPlan.deleteFloor")}
                    aria-label={t("pages.floorPlan.deleteFloor")}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )
          })}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleOpenAddFloorDialog}
          >
            <Plus className="size-3.5" />
            {t("pages.floorPlan.addFloor")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (isLayoutLocked) setIsLayoutLocked(false)
              handleOpenAddDialog()
            }}
          >
            <Plus className="size-4" />
            {t("pages.floorPlan.addTable")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (isLayoutLocked) setIsLayoutLocked(false)
              handleOpenAddFacilityDialog()
            }}
            className="border-dashed bg-card/60 hover:bg-accent"
          >
            <Sparkles className="size-4 text-amber-500" />
            {t("pages.floorPlan.addFacility")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.keys(statusLabels) as TableStatus[]).map((status) => (
          <span key={status} className="text-muted-foreground flex items-center gap-1.5">
            <span
              className={
                {
                  AVAILABLE: "size-2.5 rounded-full bg-emerald-500",
                  OCCUPIED: "size-2.5 rounded-full bg-amber-500",
                  RESERVED: "size-2.5 rounded-full bg-blue-500",
                  MAINTENANCE: "size-2.5 rounded-full bg-destructive",
                }[status]
              }
            />
            {statusLabels[status]} ({statusCounts[status]})
          </span>
        ))}
        <span className="text-muted-foreground ml-auto">
          {t("pages.floorPlan.selectHint", { shapes: Object.values(shapeLabels).join(" / ") })}
        </span>
      </div>

      <div
        className={cn(
          "bg-muted/30 relative w-full overflow-hidden border",
          // Fills the remaining overlay height instead of staying at the
          // fixed h-150 used in the normal page flow.
          isFullscreen ? "min-h-0 flex-1 rounded-xl" : "h-150 rounded-xl",
        )}
      >
        {/* Floating Locked Safe-Mode HUD Badge */}
        {isLayoutLocked && !isLoadingPlan && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-background/90 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-md backdrop-blur-md">
            <Lock className="size-3.5 text-amber-500 shrink-0" />
            <span>Layout Locked (Safe Mode)</span>
            <span className="text-muted-foreground font-normal text-[11px] hidden sm:inline">• Positions protected</span>
            <button
              type="button"
              onClick={() => {
                setIsLayoutLocked(false)
                toast.info("Floor plan unlocked for editing.")
              }}
              className="ml-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Unlock
            </button>
          </div>
        )}

        {isLoadingPlan ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t("pages.floorPlan.loadingPlan")}
          </div>
        ) : (
          <ReactFlow
            // Remounting on resize re-runs `fitView`, so the layout is framed to
            // the new canvas size instead of keeping the old viewport. Node
            // positions live in `nodesByFloor`, so nothing unsaved is lost.
            key={`${activeFloor}-${isFullscreen}`}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            colorMode={resolvedTheme}
            selectionMode={SelectionMode.Partial}
            panOnDrag={true}
            selectionOnDrag={false}
            selectionKeyCode={["Shift", "Meta", "Control"]}
            multiSelectionKeyCode={["Shift", "Meta", "Control"]}
            nodesDraggable={!isLayoutLocked}
            elementsSelectable={true}
            zoomOnScroll={true}
            onNodeDragStart={() => {
              takeSnapshot()
            }}
            onNodeDragStop={() => {
              setIsDirty(true)
            }}
            onNodeDoubleClick={(_e, node) => {
              if (node.type === "table") {
                handleOpenEditDialog(node.id)
              }
            }}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              color={resolvedTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
            />
            {/* Custom high-polish controls replacing the buggy [ ] icon */}
            <Controls
              showZoom={true}
              showFitView={false}
              showInteractive={false}
              className="bg-card! border-border/80! shadow-md! rounded-xl! overflow-hidden p-0.5"
            >
              <ControlButton
                onClick={handleFitView}
                title="Fit & Center Floor Plan"
                aria-label="Fit View"
                className="hover:bg-muted! text-foreground! flex items-center justify-center cursor-pointer"
              >
                <Focus className="size-4 text-primary" />
              </ControlButton>
            </Controls>
            {/*
              React Flow's minimap defaults to 200x150, which eats a large
              corner of a phone screen. Scaled down on small viewports (same
              4:3 ratio) and restored at `sm` and up.
            */}
            <MiniMap
              pannable
              zoomable
              className="bg-card! h-22.5! w-30! sm:h-37.5! sm:w-50!"
            />
          </ReactFlow>
        )}

        {/* Floating Multi/Single-Selection Action Bar */}
        {selectedTableNodes.length >= 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-border/80 bg-background/95 p-2 px-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 pr-3 border-r">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  {selectedTableNodes.length === 1
                    ? (selectedTableNodes[0].data as TableNodeData).name
                    : `${selectedTableNodes.length} tables selected`}
                </span>
                <span className="text-muted-foreground ml-1.5 font-medium">({totalSelectedCapacity} seats)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedTableNodes.length === 1 && (
                <Button
                  size="sm"
                  onClick={() => handleOpenEditDialog(selectedTableNodes[0].id)}
                  className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold"
                >
                  <Pencil className="size-3.5" />
                  <span>Edit Table</span>
                </Button>
              )}

              {selectedTableNodes.length >= 2 && (
                <Button
                  size="sm"
                  onClick={handleOpenGroupDialog}
                  className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shadow-xs font-semibold"
                >
                  <Link2 className="size-3.5" />
                  <span>Group Tables</span>
                </Button>
              )}

              {selectedGroupIds.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUngroupSelectedTables}
                  className="gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  <Unlink className="size-3.5" />
                  <span>Ungroup</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeselectAll}
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                title="Clear selection"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Group Selected Tables Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Link2 className="size-5" />
              Group Selected Tables
            </DialogTitle>
            <DialogDescription>
              Combine {selectedTableNodes.length} tables on {activeFloor} into a single bookable group.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleGroupSelectedTables()
            }}
            className="grid gap-4 py-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                placeholder="e.g. Banquet A, Party Group 1"
                autoFocus
              />
            </div>

            <div className="rounded-xl border bg-muted/40 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-foreground border-b pb-1.5">
                <span>Selected Tables</span>
                <span className="text-violet-600 dark:text-violet-400 font-bold">{totalSelectedCapacity} Total Seats</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedTableNodes.map((n) => (
                  <Badge key={n.id} variant="secondary" className="gap-1 text-xs">
                    <span className="font-semibold">{n.data.name}</span>
                    <span className="text-muted-foreground">({n.data.capacity} seats)</span>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Preset Name Suggestions</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  `Banquet (${totalSelectedCapacity}p)`,
                  "Large Party Group",
                  "VIP Combined Lounge",
                  "Long Table Array",
                  `Group ${selectedTableNodes.map((n) => n.data.name).join("+")}`,
                ].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-violet-500/10 hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-xs py-1"
                    onClick={() => setCustomGroupName(suggestion)}
                  >
                    + {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-violet-700 dark:text-violet-300">
                <Link2 className="size-3.5" />
                <span>Linked Group Reservation</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                When a customer or staff selects any table from this group, <strong>all {selectedTableNodes.length} tables</strong> will be automatically reserved together for that booking.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                <Link2 className="size-4" />
                Group Tables Permanently
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pages.floorPlan.addDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("pages.floorPlan.addDialog.description", { floor: activeFloor })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="table-name">{t("pages.floorPlan.addDialog.tableName")}</Label>
                <Input
                  id="table-name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder={t("pages.floorPlan.addDialog.namePlaceholder")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="table-capacity">{t("pages.floorPlan.addDialog.seats")}</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="table-location">{t("pages.floorPlan.addDialog.location")}</Label>
              <Input
                id="table-location"
                value={newTableLocation}
                onChange={(e) => setNewTableLocation(e.target.value)}
                placeholder={t("pages.floorPlan.addDialog.locationPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>{t("pages.floorPlan.addDialog.shape")}</Label>
                <Select value={newTableShape} onValueChange={(v) => setNewTableShape(v as TableShape)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECTANGLE">
                      <RectangleHorizontal className="size-4" /> {t("pages.floorPlan.addDialog.shapeRectangle")}
                    </SelectItem>
                    <SelectItem value="SQUARE">
                      <Square className="size-4" /> {t("pages.floorPlan.addDialog.shapeSquare")}
                    </SelectItem>
                    <SelectItem value="CIRCLE">
                      <Circle className="size-4" /> {t("pages.floorPlan.addDialog.shapeCircle")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("pages.floorPlan.addDialog.status")}</Label>
                <Select
                  value={newTableStatus}
                  onValueChange={(v) => setNewTableStatus(v as TableStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as TableStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("pages.floorPlan.addDialog.cancel")}
            </Button>
            <Button onClick={handleCreateTable} disabled={!newTableName.trim()}>
              <Plus className="size-4" />
              {t("pages.floorPlan.addDialog.addTable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              Edit Table: {editTableName}
            </DialogTitle>
            <DialogDescription>
              Update table details, seats, shape, and status on {activeFloor}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-table-name">Table Name</Label>
                <Input
                  id="edit-table-name"
                  value={editTableName}
                  onChange={(e) => setEditTableName(e.target.value)}
                  placeholder="e.g. T1"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-table-capacity">Seats</Label>
                <Input
                  id="edit-table-capacity"
                  type="number"
                  min={1}
                  max={30}
                  value={editTableCapacity}
                  onChange={(e) => setEditTableCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-table-location">Floor Location / Section</Label>
              <Input
                id="edit-table-location"
                value={editTableLocation}
                onChange={(e) => setEditTableLocation(e.target.value)}
                placeholder="e.g. Main Floor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Shape</Label>
                <Select value={editTableShape} onValueChange={(v) => setEditTableShape(v as TableShape)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECTANGLE">
                      <RectangleHorizontal className="size-4" /> Rectangle
                    </SelectItem>
                    <SelectItem value="SQUARE">
                      <Square className="size-4" /> Square
                    </SelectItem>
                    <SelectItem value="CIRCLE">
                      <Circle className="size-4" /> Circle
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={editTableStatus}
                  onValueChange={(v) => setEditTableStatus(v as TableStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as TableStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-table-width" className="flex items-center justify-between text-xs">
                  <span>Width</span>
                  <span className="text-muted-foreground font-normal">(px)</span>
                </Label>
                <Input
                  id="edit-table-width"
                  type="number"
                  min={40}
                  max={800}
                  value={editTableWidth}
                  onChange={(e) => setEditTableWidth(e.target.value)}
                  placeholder="140"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-table-height" className="flex items-center justify-between text-xs">
                  <span>Height</span>
                  <span className="text-muted-foreground font-normal">(px)</span>
                </Label>
                <Input
                  id="edit-table-height"
                  type="number"
                  min={40}
                  max={800}
                  value={editTableHeight}
                  onChange={(e) => setEditTableHeight(e.target.value)}
                  placeholder="90"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditTable} disabled={!editTableName.trim()}>
              <CheckCircle2 className="size-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Facility Dialog */}
      <Dialog open={isAddFacilityDialogOpen} onOpenChange={setIsAddFacilityDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              {t("pages.floorPlan.addFacilityDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.floorPlan.addFacilityDialog.description", { floor: activeFloor })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("pages.floorPlan.addFacilityDialog.type")}
              </Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 max-h-64 overflow-y-auto pr-1">
                {[
                  {
                    type: "BAR" as FacilityType,
                    icon: Wine,
                    label: "Bar & Counter",
                    desc: "Cocktail bar & stools",
                    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
                  },
                  {
                    type: "RESTROOM" as FacilityType,
                    icon: RestroomIcon,
                    label: "Restrooms",
                    desc: "Guest toilets & WC",
                    color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30",
                  },
                  {
                    type: "ENTRANCE" as FacilityType,
                    icon: DoorOpen,
                    label: "Entrance",
                    desc: "Door swing entryway",
                    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                  },
                  {
                    type: "EXIT" as FacilityType,
                    icon: LogOut,
                    label: "Exit",
                    desc: "Safety emergency exit",
                    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-600/10 border-emerald-600/30",
                  },
                  {
                    type: "KITCHEN" as FacilityType,
                    icon: UtensilsCrossed,
                    label: "Kitchen",
                    desc: "Pass window & staff",
                    color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30",
                  },
                  {
                    type: "HOST_STAND" as FacilityType,
                    icon: UserCheck,
                    label: "Host Stand",
                    desc: "Check-in desk podium",
                    color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
                  },
                  {
                    type: "WALL" as FacilityType,
                    icon: Layers,
                    label: "Divider Wall",
                    desc: "Partition wall segment",
                    color: "text-muted-foreground bg-muted border-border",
                  },
                  {
                    type: "PLANT" as FacilityType,
                    icon: Sprout,
                    label: "Planter",
                    desc: "Decorative indoor plant",
                    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                  },
                ].map((item) => {
                  const isChosen = selectedFacilityType === item.type
                  const Icon = item.icon
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleSelectFacilityType(item.type)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all cursor-pointer",
                        item.color,
                        isChosen
                          ? "ring-2 ring-primary border-primary shadow-sm scale-98"
                          : "hover:border-primary/50 opacity-80 hover:opacity-100",
                      )}
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 leading-none">
                        {item.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="facility-name">
                {t("pages.floorPlan.addFacilityDialog.name")}
              </Label>
              <Input
                id="facility-name"
                value={facilityCustomName}
                onChange={(e) => setFacilityCustomName(e.target.value)}
                placeholder={t("pages.floorPlan.addFacilityDialog.namePlaceholder")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFacilityDialogOpen(false)}>
              {t("pages.floorPlan.addFacilityDialog.cancel")}
            </Button>
            <Button onClick={handleCreateFacility}>
              <Plus className="size-4" />
              {t("pages.floorPlan.addFacilityDialog.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Floor Dialog */}
      <Dialog open={isAddFloorDialogOpen} onOpenChange={setIsAddFloorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              {t("pages.floorPlan.addFloorDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.floorPlan.addFloorDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateFloor()
            }}
            className="grid gap-4 py-2"
          >
            <div className="grid gap-2">
              <Label htmlFor="floor-name">
                {t("pages.floorPlan.addFloorDialog.floorName")}
              </Label>
              <Input
                id="floor-name"
                value={newFloorName}
                onChange={(e) => {
                  setNewFloorName(e.target.value)
                  if (floorNameError) setFloorNameError(null)
                }}
                placeholder={t("pages.floorPlan.addFloorDialog.floorNamePlaceholder")}
                autoFocus
              />
              {floorNameError && (
                <p className="text-xs font-medium text-destructive">{floorNameError}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("pages.floorPlan.addFloorDialog.suggestions")}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Patio / Terrace",
                  "Rooftop Lounge",
                  "Main Dining Room",
                  "Basement Bar",
                  "2nd Floor VIP",
                  "Garden Area",
                  "Outdoor Deck",
                  "Private Room",
                ].map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors text-xs py-1"
                    onClick={() => {
                      setNewFloorName(suggestion)
                      if (floorNameError) setFloorNameError(null)
                    }}
                  >
                    + {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddFloorDialogOpen(false)}
              >
                {t("pages.floorPlan.addFloorDialog.cancel")}
              </Button>
              <Button type="submit" disabled={!newFloorName.trim()}>
                <Plus className="size-4" />
                {t("pages.floorPlan.addFloorDialog.createFloor")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Floor Dialog */}
      <Dialog open={isDeleteFloorDialogOpen} onOpenChange={setIsDeleteFloorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              {t("pages.floorPlan.deleteFloorDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {floorToDelete &&
                ((nodesByFloor[floorToDelete] ?? floorTables[floorToDelete] ?? []).length > 0
                  ? t("pages.floorPlan.deleteFloorDialog.description", {
                      floor: floorToDelete,
                      count: (nodesByFloor[floorToDelete] ?? floorTables[floorToDelete] ?? []).length,
                    })
                  : t("pages.floorPlan.deleteFloorDialog.descriptionEmpty", {
                      floor: floorToDelete,
                    }))}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteFloorDialogOpen(false)}
            >
              {t("pages.floorPlan.deleteFloorDialog.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteFloor}
            >
              <Trash2 className="size-4" />
              {t("pages.floorPlan.deleteFloorDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function FloorPlanBuilder() {
  return (
    <ReactFlowProvider>
      <FloorPlanBuilderInner />
    </ReactFlowProvider>
  )
}
