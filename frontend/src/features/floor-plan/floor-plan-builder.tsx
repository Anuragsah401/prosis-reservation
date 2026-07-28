import { useCallback, useMemo, useState } from "react"
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
  CloudOff,
  CheckCircle2,
  Square,
  RectangleHorizontal,
  Circle,
} from "lucide-react"
import {
  initialTables,
  shapeLabels,
  statusLabels,
  DEFAULT_TABLE_WIDTH,
  DEFAULT_TABLE_HEIGHT,
  type FloorPlanTable,
  type TableShape,
  type TableStatus,
} from "@/features/floor-plan/floor-plan-data"
import { loadPositions, savePositions } from "@/features/floor-plan/floor-plan-storage"
import { TableNode, type TableNodeData } from "@/features/floor-plan/table-node"

const nodeTypes: NodeTypes = { table: TableNode }

const shapeCycle: TableShape[] = ["RECTANGLE", "SQUARE", "CIRCLE"]

function nodeFromTable(
  table: FloorPlanTable,
  handlers: {
    onCycleShape: (id: string) => void
    onRotate: (id: string) => void
    onDelete: (id: string) => void
  },
): Node<TableNodeData> {
  const savedPositions = loadPositions()
  const saved = savedPositions[table.id]
  return {
    id: table.id,
    type: "table",
    position: { x: saved?.positionX ?? table.positionX, y: saved?.positionY ?? table.positionY },
    width: saved?.width ?? table.width,
    height: saved?.height ?? table.height,
    data: {
      name: table.name,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
      shape: saved?.shape ?? table.shape,
      rotation: saved?.rotation ?? table.rotation,
      ...handlers,
    },
  }
}

function buildFloorTables(): Record<string, FloorPlanTable[]> {
  const byFloor: Record<string, FloorPlanTable[]> = {}
  for (const table of initialTables) {
    const saved = loadPositions()[table.id]
    const merged: FloorPlanTable = {
      ...table,
      floor: saved?.floor ?? table.floor,
    }
    byFloor[merged.floor] ??= []
    byFloor[merged.floor].push(merged)
  }
  return byFloor
}

export function FloorPlanBuilder() {
  const floorTables = useMemo(() => buildFloorTables(), [])
  const initialFloors = useMemo(() => Object.keys(floorTables), [floorTables])
  const [floors, setFloors] = useState<string[]>(initialFloors)
  const [activeFloor, setActiveFloor] = useState(initialFloors[0] ?? "Main Floor")
  const [nodesByFloor, setNodesByFloor] = useState<Record<string, Node<TableNodeData>[]>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaveResult, setLastSaveResult] = useState<"server" | "local" | null>(null)
  const [tableCounter, setTableCounter] = useState(initialTables.length + 1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [newTableCapacity, setNewTableCapacity] = useState("4")
  const [newTableLocation, setNewTableLocation] = useState("")
  const [newTableShape, setNewTableShape] = useState<TableShape>("RECTANGLE")
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>("AVAILABLE")

  const handleCycleShape = useCallback((id: string) => {
    setNodesByFloor((current) => {
      const next = { ...current }
      for (const floor of Object.keys(next)) {
        next[floor] = next[floor].map((n) => {
          if (n.id !== id) return n
          const idx = shapeCycle.indexOf(n.data.shape)
          const newShape = shapeCycle[(idx + 1) % shapeCycle.length]
          return { ...n, data: { ...n.data, shape: newShape } }
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
          n.id === id ? { ...n, data: { ...n.data, rotation: (n.data.rotation + 15) % 360 } } : n,
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

  const getFloorNodes = useCallback(
    (floor: string): Node<TableNodeData>[] => {
      if (nodesByFloor[floor]) return nodesByFloor[floor]
      return (floorTables[floor] ?? []).map((t) => nodeFromTable(t, handlers))
    },
    [nodesByFloor, floorTables, handlers],
  )

  const nodes = getFloorNodes(activeFloor)

  const setActiveFloorNodes = useCallback(
    (updater: (current: Node<TableNodeData>[]) => Node<TableNodeData>[]) => {
      setNodesByFloor((current) => ({
        ...current,
        [activeFloor]: updater(current[activeFloor] ?? getFloorNodes(activeFloor)),
      }))
    },
    [activeFloor, getFloorNodes],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<TableNodeData>>[]) => {
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
        ...handlers,
      },
    }
    setTableCounter((c) => c + 1)
    setActiveFloorNodes((current) => [...current, newNode])
    setIsDirty(true)
    setIsAddDialogOpen(false)
  }, [
    nodes.length,
    newTableName,
    newTableCapacity,
    newTableLocation,
    newTableShape,
    newTableStatus,
    tableCounter,
    handlers,
    setActiveFloorNodes,
  ])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const allFloorEntries = Object.entries({ ...floorTables, ...nodesByFloor })
      const allNodes: { floor: string; node: Node<TableNodeData> }[] = []
      for (const floor of floors) {
        const floorNodes = floor === activeFloor ? nodes : (nodesByFloor[floor] ?? getFloorNodes(floor))
        for (const node of floorNodes) {
          allNodes.push({ floor, node })
        }
      }
      void allFloorEntries
      const result = await savePositions(
        allNodes.map(({ floor, node }) => ({
          id: node.id,
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
          width: node.width ?? DEFAULT_TABLE_WIDTH,
          height: node.height ?? DEFAULT_TABLE_HEIGHT,
          shape: node.data.shape,
          rotation: node.data.rotation,
          floor,
        })),
      )
      setIsDirty(false)
      setLastSaveResult(result.persisted)
    } finally {
      setIsSaving(false)
    }
  }, [activeFloor, nodes, nodesByFloor, floorTables, floors, getFloorNodes])

  const handleReset = useCallback(() => {
    setNodesByFloor({})
    setIsDirty(false)
  }, [])

  const edges = useMemo(() => [], [])

  const statusCounts = useMemo(() => {
    const counts: Record<TableStatus, number> = { AVAILABLE: 0, OCCUPIED: 0, RESERVED: 0, MAINTENANCE: 0 }
    for (const n of nodes) counts[n.data.status]++
    return counts
  }, [nodes])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Floor Plan Designer</h1>
          <p className="text-muted-foreground text-sm">
            Drag, resize, and reshape tables to design your dining floor layout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaveResult && !isDirty && (
            <Badge variant="outline" className="gap-1 text-xs">
              {lastSaveResult === "server" ? (
                <>
                  <CheckCircle2 className="size-3" /> Saved to server
                </>
              ) : (
                <>
                  <CloudOff className="size-3" /> Saved locally
                </>
              )}
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save layout
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <LayoutGrid className="text-muted-foreground mr-1 size-4" />
          {floors.map((floor) => (
            <Button
              key={floor}
              size="sm"
              variant={floor === activeFloor ? "default" : "ghost"}
              onClick={() => setActiveFloor(floor)}
            >
              {floor}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              const existingNumbers = floors
                .map((f) => /^Floor (\d+)$/.exec(f)?.[1])
                .filter((n): n is string => Boolean(n))
                .map(Number)
              const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
              const name = `Floor ${nextNumber}`
              setNodesByFloor((current) => ({ ...current, [name]: [] }))
              setFloors((current) => [...current, name])
              setActiveFloor(name)
            }}
          >
            <Plus className="size-3.5" />
            Add floor
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleOpenAddDialog}>
            <Plus className="size-4" />
            Add table
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
          Select a table to resize, change shape ({Object.values(shapeLabels).join(" / ")}), rotate, or
          delete.
        </span>
      </div>

      <div className="bg-muted/30 h-150 w-full overflow-hidden rounded-xl border">
        <ReactFlow
          key={activeFloor}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} />
          <Controls />
          <MiniMap pannable zoomable className="bg-card!" />
        </ReactFlow>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a table</DialogTitle>
            <DialogDescription>
              Configure the new table before it's placed on the {activeFloor} canvas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="table-name">Table name</Label>
                <Input
                  id="table-name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. T7"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="table-capacity">Seats</Label>
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
              <Label htmlFor="table-location">Location / section</Label>
              <Input
                id="table-location"
                value={newTableLocation}
                onChange={(e) => setNewTableLocation(e.target.value)}
                placeholder="e.g. Window, Patio, Bar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Shape</Label>
                <Select value={newTableShape} onValueChange={(v) => setNewTableShape(v as TableShape)}>
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
              Cancel
            </Button>
            <Button onClick={handleCreateTable} disabled={!newTableName.trim()}>
              <Plus className="size-4" />
              Add table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
