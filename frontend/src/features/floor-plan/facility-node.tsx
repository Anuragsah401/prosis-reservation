import React from "react"
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react"
import { Pencil, RotateCw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { FacilityType } from "@/features/floor-plan/floor-plan-data"
import { FacilityGraphic } from "@/features/floor-plan/facility-graphic"

export interface FacilityNodeData extends Record<string, unknown> {
  name: string
  facilityType: FacilityType
  rotation: number
  width?: number
  height?: number
  isLocked?: boolean
  onRotate: (id: string) => void
  onDelete: (id: string) => void
  onEdit?: (id: string) => void
  onResizeStart?: (id: string) => void
  onResizeEnd?: (id: string, params: { width: number; height: number; x?: number; y?: number }) => void
}

interface FacilityToolbarProps {
  id: string
  onEdit?: (id: string) => void
  onRotate: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Floating toolbar rendered ONLY when the facility is selected,
 * avoiding i18n hook executions and button DOM trees on unselected facilities.
 */
const FacilityFloatingToolbar = React.memo(function FacilityFloatingToolbar({
  id,
  onEdit,
  onRotate,
  onDelete,
}: FacilityToolbarProps) {
  const { t } = useTranslation()

  return (
    <div
      className="nodrag nopan absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover p-1 shadow-xl z-50 pointer-events-auto ring-1 ring-border"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-primary hover:bg-primary/10 cursor-pointer"
          title={t("pages.floorPlan.tooltips.editFacility", "Edit element")}
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
        title={t("pages.floorPlan.tooltips.rotate", "Rotate 15°")}
        onClick={(e) => {
          e.stopPropagation()
          onRotate(id)
        }}
      >
        <RotateCw className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 size-7 cursor-pointer"
        title={t("pages.floorPlan.tooltips.deleteFacility", "Delete element")}
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

function areFacilityNodePropsEqual(
  prevProps: NodeProps & { data: FacilityNodeData; width?: number; height?: number },
  nextProps: NodeProps & { data: FacilityNodeData; width?: number; height?: number },
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
    pData.facilityType === nData.facilityType &&
    pData.rotation === nData.rotation &&
    pData.width === nData.width &&
    pData.height === nData.height &&
    pData.isLocked === nData.isLocked
  )
}

export const FacilityNode = React.memo(function FacilityNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps & { data: FacilityNodeData; width?: number; height?: number }) {
  const nodeW = width || (data.width as number) || 120
  const nodeH = height || (data.height as number) || 60
  const isLocked = Boolean(data.isLocked)

  return (
    <>
      <NodeResizer
        isVisible={selected && !isLocked}
        minWidth={40}
        minHeight={20}
        keepAspectRatio={data.facilityType === "PLANT"}
        lineClassName="!border-primary"
        handleClassName="!size-2.5 !rounded-full !border-2 !border-primary !bg-background"
        onResizeStart={() => {
          data.onResizeStart?.(id)
        }}
        onResizeEnd={(_event, params) => {
          data.onResizeEnd?.(id, params)
        }}
      />
      <div
        className={isLocked ? "cursor-default size-full select-none" : "cursor-grab active:cursor-grabbing size-full select-none"}
        style={{ transform: `rotate(${data.rotation}deg)`, willChange: "transform" }}
      >
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <FacilityGraphic
          type={data.facilityType}
          name={data.name}
          width={nodeW}
          height={nodeH}
          isSelected={selected}
        />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>

      {selected && (
        <FacilityFloatingToolbar
          id={id}
          onEdit={data.onEdit}
          onRotate={data.onRotate}
          onDelete={data.onDelete}
        />
      )}
    </>
  )
}, areFacilityNodePropsEqual)
