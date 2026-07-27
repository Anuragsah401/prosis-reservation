import { useCallback, useMemo, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Save, RotateCcw, Loader2 } from "lucide-react"
import { initialTables } from "@/features/floor-plan/floor-plan-data"
import { loadPositions, savePositions } from "@/features/floor-plan/floor-plan-storage"
import { TableNode, type TableNodeData } from "@/features/floor-plan/table-node"

const nodeTypes: NodeTypes = { table: TableNode }

function buildInitialNodes(): Node<TableNodeData>[] {
  const savedPositions = loadPositions()
  return initialTables.map((table) => {
    const saved = savedPositions[table.id]
    return {
      id: table.id,
      type: "table",
      position: { x: saved?.positionX ?? table.positionX, y: saved?.positionY ?? table.positionY },
      data: {
        name: table.name,
        capacity: table.capacity,
        location: table.location,
        status: table.status,
      },
    }
  })
}

export function FloorPlanBuilder() {
  const [nodes, setNodes] = useState<Node<TableNodeData>[]>(buildInitialNodes)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const onNodesChange = useCallback((changes: NodeChange<Node<TableNodeData>>[]) => {
    setNodes((current) => applyNodeChanges(changes, current))
    if (changes.some((c) => c.type === "position")) {
      setIsDirty(true)
    }
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await savePositions(
        nodes.map((node) => ({
          id: node.id,
          positionX: Math.round(node.position.x),
          positionY: Math.round(node.position.y),
        })),
      )
      setIsDirty(false)
      setLastSavedAt(new Date())
    } finally {
      setIsSaving(false)
    }
  }, [nodes])

  const handleReset = useCallback(() => {
    setNodes(buildInitialNodes())
    setIsDirty(false)
  }, [])

  const edges = useMemo(() => [], [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Floor Plan</h1>
          <p className="text-muted-foreground text-sm">
            Drag tables to arrange your restaurant layout, then save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSavedAt && !isDirty && (
            <span className="text-muted-foreground text-xs">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save positions
          </Button>
        </div>
      </div>

      <div className="h-[600px] w-full overflow-hidden rounded-xl border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls />
          <MiniMap pannable zoomable className="!bg-card" />
        </ReactFlow>
      </div>
    </div>
  )
}
