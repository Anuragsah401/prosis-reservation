import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyNodeChanges,
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
  Save,
  RotateCcw,
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
  Layers,
  Sparkles,
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
  },
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
        onRotate: handlers.onRotate,
        onDelete: handlers.onDelete,
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
    }
    byFloor[floorName] ??= []
    byFloor[floorName].push(merged)
  }
  return byFloor
}

export function FloorPlanBuilder() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
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

  useEffect(() => {
    saveFloorNames(floors)
  }, [floors])

  const handleCycleShape = useCallback((id: string) => {
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
  }, [])

  const handleRotate = useCallback((id: string) => {
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
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].filter((n) => n.id !== id)
      }
      return next
    })
    setIsDirty(true)
  }, [])

  const handlers = useMemo(
    () => ({ onCycleShape: handleCycleShape, onRotate: handleRotate, onDelete: handleDelete }),
    [handleCycleShape, handleRotate, handleDelete],
  )

  // Pull the authoritative plan from the database.
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
            next[f] = tbls.map((t) => nodeFromTable(t, handlers))
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
          })),
        )
      }
      setIsLoadingPlan(false)
    })
    return () => {
      cancelled = true
    }
  }, [handlers])

  const [isDirty, setIsDirty] = useState(false)
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
  }, [floorToDelete, floors, activeFloor])


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
      if (changes.some((c) => c.type === "position" || c.type === "dimensions")) {
        setIsDirty(true)
      }
    },
    [setActiveFloorNodes],
  )

  const handleOpenAddDialog = useCallback(() => {
    setNewTableName(`T${tableCounter}`)
    setNewTableCapacity("4")
    setNewTableLocation(activeFloor)
    setNewTableShape("RECTANGLE")
    setNewTableStatus("AVAILABLE")
    setIsAddDialogOpen(true)
  }, [tableCounter, activeFloor])

  const handleOpenAddFacilityDialog = useCallback(() => {
    setSelectedFacilityType("BAR")
    setFacilityCustomName(facilityDefaults.BAR.name)
    setIsAddFacilityDialogOpen(true)
  }, [])

  const handleSelectFacilityType = useCallback((type: FacilityType) => {
    setSelectedFacilityType(type)
    setFacilityCustomName(facilityDefaults[type].name)
  }, [])

  const handleCreateTable = useCallback(() => {
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
        ...handlers,
      },
    }
    setTableCounter((c) => c + 1)
    setActiveFloorNodes((current) => [...current, newNode])
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
  ])

  const handleCreateFacility = useCallback(() => {
    const def = facilityDefaults[selectedFacilityType]
    const finalName = facilityCustomName.trim() || def.name
    const newNode: Node<FacilityNodeData> = {
      id: `fac-${crypto.randomUUID()}`,
      type: "facility",
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
      },
    }
    setActiveFloorNodes((current) => [...current, newNode])
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
    setActiveFloorNodes,
  ])

  const handleSave = useCallback(async (options?: { isAuto?: boolean }) => {
    setIsSaving(true)
    try {
      const allNodes: { floor: string; node: Node<TableNodeData | FacilityNodeData> }[] = []
      for (const floor of floors) {
        const floorNodes = nodesByFloor[floor] ?? (floorTables[floor] ?? []).map((t) => nodeFromTable(t, handlers))
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
        }
      })

      // Sync to backend first
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
  }, [floors, nodesByFloor, floorTables, handlers])

  // Debounced Auto-Save
  useEffect(() => {
    if (!isDirty || isLoadingPlan) return

    const timer = setTimeout(() => {
      void handleSave({ isAuto: true })
    }, 1500)

    return () => clearTimeout(timer)
  }, [isDirty, isLoadingPlan, handleSave])

  const handleReset = useCallback(() => {
    setNodesByFloor({})
    setIsDirty(false)
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

          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="size-4" />
            {t("pages.floorPlan.reset")}
          </Button>
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
          <Button onClick={() => void handleSave({ isAuto: false })} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("pages.floorPlan.saveLayout")}
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
          <Button size="sm" variant="secondary" onClick={handleOpenAddDialog}>
            <Plus className="size-4" />
            {t("pages.floorPlan.addTable")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenAddFacilityDialog}
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
          "bg-muted/30 w-full overflow-hidden border",
          // Fills the remaining overlay height instead of staying at the
          // fixed h-150 used in the normal page flow.
          isFullscreen ? "min-h-0 flex-1 rounded-xl" : "h-150 rounded-xl",
        )}
      >
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
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              color={resolvedTheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
            />
            <Controls className="bg-card border-border shadow-md" />
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
      </div>

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
