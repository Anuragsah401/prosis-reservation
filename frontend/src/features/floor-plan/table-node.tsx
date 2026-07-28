import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react"
import { RotateCw, Square, RectangleHorizontal, Circle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TableShape, TableStatus } from "@/features/floor-plan/floor-plan-data"

export interface TableNodeData extends Record<string, unknown> {
  name: string
  capacity: number
  location?: string
  status: TableStatus
  shape: TableShape
  rotation: number
  onCycleShape: (id: string) => void
  onRotate: (id: string) => void
  onDelete: (id: string) => void
}

const statusStyles: Record<TableStatus, string> = {
  AVAILABLE: "border-emerald-500/60 bg-emerald-500/10",
  OCCUPIED: "border-amber-500/60 bg-amber-500/10",
  RESERVED: "border-blue-500/60 bg-blue-500/10",
  MAINTENANCE: "border-destructive/60 bg-destructive/10",
}

const badgeVariant: Record<TableStatus, "default" | "secondary" | "outline" | "destructive"> = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  RESERVED: "outline",
  MAINTENANCE: "destructive",
}

const shapeClass: Record<TableShape, string> = {
  RECTANGLE: "rounded-lg",
  SQUARE: "rounded-lg",
  CIRCLE: "rounded-full",
}

export function TableNode({ id, data, selected }: NodeProps & { data: TableNodeData }) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        keepAspectRatio={data.shape === "CIRCLE" || data.shape === "SQUARE"}
        lineClassName="!border-primary"
        handleClassName="!size-2.5 !rounded-full !border-2 !border-primary !bg-background"
      />
      <div
        className={cn(
          "flex size-full cursor-grab flex-col items-center justify-center gap-1 border-2 bg-card p-2 text-center shadow-sm transition-shadow active:cursor-grabbing",
          shapeClass[data.shape],
          statusStyles[data.status],
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
        style={{ transform: `rotate(${data.rotation}deg)` }}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-semibold leading-none">{data.name}</span>
        </div>
        <Badge variant={badgeVariant[data.status]} className="text-[9px] leading-none">
          {data.status}
        </Badge>
        <p className="text-muted-foreground text-[11px] leading-none">
          Seats {data.capacity}
          {data.location ? ` · ${data.location}` : ""}
        </p>
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>

      {selected && (
        <div className="nodrag nopan absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border bg-popover p-1 shadow-md">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Cycle shape"
            onClick={() => data.onCycleShape(id)}
          >
            {data.shape === "RECTANGLE" && <RectangleHorizontal className="size-3.5" />}
            {data.shape === "SQUARE" && <Square className="size-3.5" />}
            {data.shape === "CIRCLE" && <Circle className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            title="Rotate 15°"
            onClick={() => data.onRotate(id)}
          >
            <RotateCw className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive size-6"
            title="Delete table"
            onClick={() => data.onDelete(id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </>
  )
}

