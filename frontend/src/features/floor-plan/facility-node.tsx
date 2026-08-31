import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react"
import { RotateCw, Trash2 } from "lucide-react"
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
  onResizeStart?: (id: string) => void
  onResizeEnd?: (id: string, params: { width: number; height: number; x?: number; y?: number }) => void
}

export function FacilityNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps & { data: FacilityNodeData; width?: number; height?: number }) {
  const { t } = useTranslation()
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
        style={{ transform: `rotate(${data.rotation}deg)` }}
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

      {selected && !isLocked && (
        <div className="nodrag nopan absolute -top-11 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg z-50">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            title={t("pages.floorPlan.tooltips.rotate", "Rotate 15°")}
            onClick={() => data.onRotate(id)}
          >
            <RotateCw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 size-7"
            title={t("pages.floorPlan.tooltips.deleteFacility", "Delete element")}
            onClick={() => data.onDelete(id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </>
  )
}

