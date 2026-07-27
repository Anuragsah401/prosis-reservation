import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { TableStatus } from "@/features/floor-plan/floor-plan-data"

export interface TableNodeData extends Record<string, unknown> {
  name: string
  capacity: number
  location?: string
  status: TableStatus
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

export function TableNode({ data }: NodeProps & { data: TableNodeData }) {
  return (
    <div
      className={cn(
        "flex w-36 cursor-grab flex-col gap-1 rounded-lg border-2 bg-card p-3 shadow-sm active:cursor-grabbing",
        statusStyles[data.status],
      )}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{data.name}</span>
        <Badge variant={badgeVariant[data.status]} className="text-[10px]">
          {data.status}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">
        Seats {data.capacity}
        {data.location ? ` · ${data.location}` : ""}
      </p>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}
