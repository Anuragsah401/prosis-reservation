import React from "react"
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react"
import { RotateCw, Square, RectangleHorizontal, Circle, Trash2, Unlink, Link2, Pencil } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { TableShape, TableStatus } from "@/features/floor-plan/floor-plan-data"
import { TableGraphic } from "@/features/floor-plan/table-graphic"

export interface TableNodeData extends Record<string, unknown> {
  name: string
  capacity: number
  location?: string
  status: TableStatus
  shape: TableShape
  rotation: number
  width?: number
  height?: number
  isLocked?: boolean
  groupId?: string | null
  groupName?: string | null
  onCycleShape: (id: string) => void
  onRotate: (id: string) => void
  onDelete: (id: string) => void
  onUngroup?: (id: string) => void
  onSelectGroup?: (groupId: string) => void
  onEdit?: (id: string) => void
  onResizeStart?: (id: string) => void
  onResizeEnd?: (id: string, params: { width: number; height: number; x?: number; y?: number }) => void
}

interface TableToolbarProps {
  id: string
  shape: TableShape
  groupId?: string | null
  groupName?: string | null
  onEdit?: (id: string) => void
  onCycleShape: (id: string) => void
  onRotate: (id: string) => void
  onDelete: (id: string) => void
  onUngroup?: (id: string) => void
  onSelectGroup?: (groupId: string) => void
}

/**
 * Floating toolbar rendered ONLY when the table is selected,
 * avoiding i18n hook executions and button DOM trees on unselected tables.
 */
const TableFloatingToolbar = React.memo(function TableFloatingToolbar({
  id,
  shape,
  groupId,
  groupName,
  onEdit,
  onCycleShape,
  onRotate,
  onDelete,
  onUngroup,
  onSelectGroup,
}: TableToolbarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="nodrag nopan absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover/95 p-1 shadow-xl z-50 pointer-events-auto backdrop-blur-sm ring-1 ring-border"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-primary hover:bg-primary/10 cursor-pointer"
          title={t("pages.floorPlan.tooltips.editTable", "Edit Table (Name, Seats, Shape, Status)")}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(id)
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 hover:bg-accent text-foreground cursor-pointer"
        title={t("pages.floorPlan.tooltips.cycleShape", "Cycle shape")}
        onClick={(e) => {
          e.stopPropagation()
          onCycleShape(id)
        }}
      >
        {shape === "RECTANGLE" && <RectangleHorizontal className="size-4" />}
        {shape === "SQUARE" && <Square className="size-4" />}
        {shape === "CIRCLE" && <Circle className="size-4" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 hover:bg-accent text-foreground cursor-pointer"
        title={t("pages.floorPlan.tooltips.rotate", "Rotate 15°")}
        onClick={(e) => {
          e.stopPropagation()
          onRotate(id)
        }}
      >
        <RotateCw className="size-4" />
      </Button>
      {groupId && onSelectGroup && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 size-7 cursor-pointer"
          title={t("pages.floorPlan.tooltips.selectGroup", { name: groupName || "group" })}
          onClick={(e) => {
            e.stopPropagation()
            onSelectGroup(groupId)
          }}
        >
          <Link2 className="size-4" />
        </Button>
      )}
      {groupId && onUngroup && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 size-7 cursor-pointer"
          title={t("pages.floorPlan.tooltips.ungroupTable", "Remove from group")}
          onClick={(e) => {
            e.stopPropagation()
            onUngroup(id)
          }}
        >
          <Unlink className="size-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 size-7 cursor-pointer"
        title={t("pages.floorPlan.tooltips.deleteTable", "Delete table")}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
})

function areTableNodePropsEqual(
  prevProps: NodeProps & { data: TableNodeData; width?: number; height?: number },
  nextProps: NodeProps & { data: TableNodeData; width?: number; height?: number },
): boolean {
  if (prevProps.id !== nextProps.id) return false
  if (prevProps.selected !== nextProps.selected) return false
  if (prevProps.dragging !== nextProps.dragging) return false
  if (prevProps.width !== nextProps.width) return false
  if (prevProps.height !== nextProps.height) return false

  const pData = prevProps.data
  const nData = nextProps.data

  return (
    pData.name === nData.name &&
    pData.capacity === nData.capacity &&
    pData.status === nData.status &&
    pData.shape === nData.shape &&
    pData.rotation === nData.rotation &&
    pData.width === nData.width &&
    pData.height === nData.height &&
    pData.isLocked === nData.isLocked &&
    pData.groupId === nData.groupId &&
    pData.groupName === nData.groupName &&
    pData.location === nData.location
  )
}

export const TableNode = React.memo(function TableNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps & { data: TableNodeData; width?: number; height?: number }) {
  const nodeW = width || (data.width as number) || (data.shape === "CIRCLE" || data.shape === "SQUARE" ? 100 : 140)
  const nodeH = height || (data.height as number) || (data.shape === "CIRCLE" || data.shape === "SQUARE" ? 100 : 90)
  const isLocked = Boolean(data.isLocked)

  return (
    <>
      <NodeResizer
        isVisible={selected && !isLocked}
        minWidth={60}
        minHeight={60}
        handleClassName="!size-2.5 !rounded-full !border-2 !border-primary !bg-background"
        onResizeStart={() => {
          data.onResizeStart?.(id)
        }}
        onResizeEnd={(_event, params) => {
          data.onResizeEnd?.(id, params)
        }}
      />
      <div
        className={isLocked ? "cursor-pointer size-full select-none" : "cursor-grab active:cursor-grabbing size-full select-none"}
        style={{ transform: `rotate(${data.rotation}deg)` }}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <TableGraphic
          name={data.name}
          capacity={data.capacity}
          shape={data.shape}
          status={data.status}
          width={nodeW}
          height={nodeH}
          location={data.location}
          showStatusBadge
          isSelected={selected}
          groupId={data.groupId}
          groupName={data.groupName}
        />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>

      {selected && (
        <TableFloatingToolbar
          id={id}
          shape={data.shape}
          groupId={data.groupId}
          groupName={data.groupName}
          onEdit={data.onEdit}
          onCycleShape={data.onCycleShape}
          onRotate={data.onRotate}
          onDelete={data.onDelete}
          onUngroup={data.onUngroup}
          onSelectGroup={data.onSelectGroup}
        />
      )}
    </>
  )
}, areTableNodePropsEqual)
