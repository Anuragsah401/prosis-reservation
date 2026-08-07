import { useMemo, useRef, useState } from "react"
import { Check, Maximize, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FloorPlanViewerTable {
  id: string
  name: string
  capacity: number
  floor: string
  section?: string | null
  shape: "RECTANGLE" | "SQUARE" | "CIRCLE"
  positionX: number | null
  positionY: number | null
  width: number
  height: number
  rotation: number
  available: boolean
}

interface FloorPlanViewerProps {
  tables: FloorPlanViewerTable[]
  selectedTableId: string | null
  /** The guest's currently assigned table (always selectable even if "occupied" by itself). */
  currentTableId?: string | null
  onSelect: (tableId: string | null) => void
  seatsLabel: string
}

const PADDING = 24
const DEFAULT_W = 140
const DEFAULT_H = 90
const MIN_ZOOM = 0.4
const MAX_ZOOM = 2.5

/**
 * Read-only, scaled-to-fit rendering of the restaurant's planned floor
 * layout for guest-facing pages (e.g. reservation confirmation). Tables are
 * positioned exactly as staff arranged them in the Floor Plan builder;
 * unavailable tables are dimmed and not clickable. Tables without saved
 * positions are auto-arranged in a grid as a fallback.
 */
export function FloorPlanViewer({
  tables,
  selectedTableId,
  currentTableId,
  onSelect,
  seatsLabel,
}: FloorPlanViewerProps) {
  const floors = useMemo(() => [...new Set(tables.map((t) => t.floor))], [tables])
  const [activeFloor, setActiveFloor] = useState(floors[0] ?? "Main Floor")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const displayedFloor = floors.includes(activeFloor)
    ? activeFloor
    : (floors[0] ?? "Main Floor")

  const floorTables = useMemo(() => {
  const onFloor = tables.filter((t) => t.floor === displayedFloor)
    // Fall back to a simple grid layout for tables that were never placed
    // on the floor plan, so they're still visible/selectable.
    const unplaced = onFloor.filter((t) => t.positionX == null || t.positionY == null)
    return onFloor.map((t) => {
      if (t.positionX == null || t.positionY == null) {
        const i = unplaced.indexOf(t)
        const col = i % 4
        const row = Math.floor(i / 4)
        return { ...t, positionX: 40 + col * 200, positionY: 40 + row * 150 }
      }
      return t as typeof t & { positionX: number; positionY: number }
    })
  }, [tables, displayedFloor])

  const bounds = useMemo(() => {
    if (floorTables.length === 0) return { width: 400, height: 200 }
    const maxX = Math.max(...floorTables.map((t) => t.positionX! + (t.width || DEFAULT_W)))
    const maxY = Math.max(...floorTables.map((t) => t.positionY! + (t.height || DEFAULT_H)))
    return { width: maxX + PADDING, height: maxY + PADDING }
  }, [floorTables])

  const zoomBy = (delta: number) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)))
  }

  return (
    <div className="flex flex-col gap-2">
      {floors.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 rounded-md border p-0.5 self-start">
          {floors.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => {
                setActiveFloor(floor)
                setZoom(1)
                setPan({ x: 0, y: 0 })
                setDragging(false)
              }}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                displayedFloor === floor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {floor}
            </button>
          ))}
        </div>
      )}

      <div className="bg-muted/30 relative overflow-hidden rounded-lg border">
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => zoomBy(0.2)}
            className="bg-card hover:bg-accent flex size-7 items-center justify-center rounded-md border shadow-sm"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.2)}
            className="bg-card hover:bg-accent flex size-7 items-center justify-center rounded-md border shadow-sm"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="bg-card hover:bg-accent flex size-7 items-center justify-center rounded-md border shadow-sm"
            aria-label="Reset view"
          >
            <Maximize className="size-3.5" />
          </button>
        </div>

        <div
          className={cn("h-85 w-full touch-none select-none sm:h-100", dragging ? "cursor-grabbing" : "cursor-grab")}
          onWheel={(e) => {
            e.preventDefault()
            const delta = -e.deltaY * 0.0015
            zoomBy(delta)
          }}
          onPointerDown={(e) => {
            // Only start panning from the background, not from a table.
            if ((e.target as HTMLElement).closest("[data-table]")) return
            setDragging(true)
            dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (!dragging) return
            setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
          }}
          onPointerUp={(e) => {
            if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
              ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
            }
            setDragging(false)
          }}
          onPointerCancel={(e) => {
            if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
              ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
            }
            setDragging(false)
          }}
        >
          <div
            className="relative origin-top-left transition-transform duration-75"
            style={{
              width: bounds.width,
              height: bounds.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              backgroundImage:
                "radial-gradient(circle, color-mix(in oklab, var(--color-foreground) 12%, transparent) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {floorTables.map((tb) => {
              const isSelected = selectedTableId === tb.id
              const isCurrent = currentTableId === tb.id
              const selectable = tb.available || isCurrent
              return (
                <button
                  key={tb.id}
                  type="button"
                  data-table
                  disabled={!selectable}
                  onClick={() => onSelect(isSelected ? null : tb.id)}
                  className={cn(
                    "absolute flex flex-col items-center justify-center gap-0.5 border-2 p-1 text-center shadow-sm transition-all",
                    tb.shape === "CIRCLE" ? "rounded-full" : "rounded-lg",
                    selectable
                      ? "bg-card cursor-pointer border-emerald-500/60 hover:border-emerald-500"
                      : "bg-muted cursor-not-allowed border-border opacity-40",
                    isSelected && "border-primary ring-primary/40 bg-primary/10 ring-2",
                  )}
                  style={{
                    left: tb.positionX!,
                    top: tb.positionY!,
                    width: tb.width || DEFAULT_W,
                    height: tb.height || DEFAULT_H,
                    transform: `rotate(${tb.rotation || 0}deg)`,
                  }}
                >
                  {isSelected && (
                    <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full">
                      <Check className="size-3" />
                    </span>
                  )}
                  <span className="text-xs leading-none font-semibold">{tb.name}</span>
                  <span className="text-muted-foreground text-[10px] leading-none">
                    {tb.capacity} {seatsLabel}
                  </span>
                </button>
              )
            })}
            {floorTables.length === 0 && (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                —
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
