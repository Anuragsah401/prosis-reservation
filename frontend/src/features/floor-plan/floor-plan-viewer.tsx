import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableGraphic } from "@/features/floor-plan/table-graphic"
import { FacilityGraphic } from "@/features/floor-plan/facility-graphic"
import type { FacilityType } from "@/features/floor-plan/floor-plan-data"

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
  elementType?: "TABLE" | "FACILITY"
  facilityType?: FacilityType
}

interface FloorPlanViewerProps {
  tables: FloorPlanViewerTable[]
  selectedTableId: string | null
  /** The guest's currently assigned table (always selectable even if "occupied" by itself). */
  currentTableId?: string | null
  onSelect: (tableId: string | null) => void
  seatsLabel: string
  /** Fired when the maximize overlay opens or closes, so a wrapping dialog can
   *  react — e.g. swallow Escape so it only exits fullscreen instead of also
   *  closing the dialog. */
  onFullscreenChange?: (fullscreen: boolean) => void
  /** Hide the maximize control. Used where the viewer already fills its
   *  container (e.g. the table picker dialog), making fullscreen pointless. */
  showFullscreen?: boolean
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
  onFullscreenChange,
  showFullscreen = true,
}: FloorPlanViewerProps) {
  const floors = useMemo(
    () => [...new Set(tables.map((t) => t.floor).filter((f): f is string => Boolean(f)))],
    [tables],
  )
  const [activeFloor, setActiveFloor] = useState(floors[0] ?? "Main Floor")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [pinching, setPinching] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const dragStartPos = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })
  const hasDragged = useRef(false)
  const isPointerActive = useRef(false)
  const pointerDownTableId = useRef<string | null>(null)
  // Active pointers, so two fingers can be distinguished from one for pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null)

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

  // Escape closes the overlay, and the page behind it is locked so it can't
  // scroll under the fullscreen map on touch devices.
  useEffect(() => {
    if (!fullscreen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false)
        onFullscreenChange?.(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [fullscreen, onFullscreenChange])

  // A CSS overlay rather than the Fullscreen API: iOS Safari doesn't support
  // requestFullscreen() on non-video elements, which is exactly the mobile
  // case this matters most for. Wrapping the whole component (not just the
  // canvas) keeps the floor tabs reachable while expanded. The overlay is
  // portaled to <body> so it can't be trapped by an ancestor that creates a
  // containing block (a dialog's transform) or clips it (a dialog's
  // overflow) — otherwise "fullscreen" would just squash the viewer into the
  // dialog's box instead of covering the whole screen.
  const viewer = (
    <div
      className={cn(
        "flex flex-col gap-2",
        fullscreen && "bg-background fixed inset-0 z-[60] p-3",
      )}
    >
      {/* Always shown so the current floor is visible even with a single
          floor — without this, one-floor plans gave no indication which
          floor's tables were on display. */}
      {floors.length > 0 && (
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
                setPinching(false)
                pointers.current.clear()
                pinchStart.current = null
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

      <div
        className={cn(
          "bg-muted/30 relative overflow-hidden border",
          // Fills the remaining overlay height so the canvas grows with the
          // screen instead of staying at its fixed inline height.
          fullscreen ? "min-h-0 flex-1 rounded-md" : "rounded-lg",
        )}
      >
        <div
          className="absolute top-2 right-2 z-10 flex flex-col gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => zoomBy(0.2)}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="size-4 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.2)}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="size-4 text-foreground" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
            aria-label="Reset view"
            title="Reset view"
          >
            <RotateCcw className="size-4 text-foreground" />
          </button>
          {showFullscreen !== false && (
            <button
              type="button"
              onClick={() => {
                const next = !fullscreen
                setFullscreen(next)
                onFullscreenChange?.(next)
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
              aria-label={fullscreen ? "Exit full screen" : "View full screen"}
              title={fullscreen ? "Exit full screen" : "View full screen"}
            >
              {fullscreen ? <Minimize className="size-4 text-foreground" /> : <Maximize className="size-4 text-foreground" />}
            </button>
          )}
        </div>

        <div
          className={cn(
            "w-full touch-none select-none",
            fullscreen ? "h-full" : "h-85 sm:h-100",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
          onWheel={(e) => {
            e.preventDefault()
            const delta = -e.deltaY * 0.0015
            zoomBy(delta)
          }}
          onPointerDown={(e) => {
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

            // A second finger starts a pinch, which supersedes any pan.
            if (pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()]
              pinchStart.current = {
                distance: Math.hypot(a.x - b.x, a.y - b.y),
                zoom,
              }
              setPinching(true)
              setDragging(false)
              hasDragged.current = true
              isPointerActive.current = false
              return
            }

            const targetEl = (e.target as HTMLElement).closest<HTMLElement>("[data-table-id]")
            pointerDownTableId.current = targetEl?.dataset.tableId ?? null
            hasDragged.current = false
            isPointerActive.current = true
            dragStartPos.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
          }}
          onPointerMove={(e) => {
            if (pointers.current.has(e.pointerId)) {
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
            }

            if (pinchStart.current && pointers.current.size === 2) {
              const [a, b] = [...pointers.current.values()]
              const distance = Math.hypot(a.x - b.x, a.y - b.y)
              const ratio = distance / pinchStart.current.distance
              setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.current.zoom * ratio)))
              return
            }

            if (!isPointerActive.current) return
            const dx = e.clientX - dragStartPos.current.clientX
            const dy = e.clientY - dragStartPos.current.clientY
            if (Math.hypot(dx, dy) > 4) {
              if (!hasDragged.current) {
                hasDragged.current = true
                setDragging(true)
                try {
                  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                } catch {
                  // ignore pointer capture errors on older browsers
                }
              }
              setPan({ x: dragStartPos.current.panX + dx, y: dragStartPos.current.panY + dy })
            }
          }}
          onPointerUp={(e) => {
            if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
              try {
                ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
              } catch {
                // ignore
              }
            }

            pointers.current.delete(e.pointerId)
            isPointerActive.current = false
            pointerDownTableId.current = null
            setDragging(false)
            if (pointers.current.size < 2) {
              pinchStart.current = null
              setPinching(false)
            }

            // Reset hasDragged on next tick so the click event on the button (which fires immediately after pointerup) can inspect it
            setTimeout(() => {
              hasDragged.current = false
            }, 50)
          }}
          onPointerCancel={(e) => {
            if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
              try {
                ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
              } catch {
                // ignore
              }
            }
            pointers.current.delete(e.pointerId)
            isPointerActive.current = false
            pointerDownTableId.current = null
            setDragging(false)
            if (pointers.current.size < 2) {
              pinchStart.current = null
              setPinching(false)
            }
          }}
        >
          <div
            className={cn(
              "relative origin-top-left",
              // Only animate discrete zoom-button/reset changes. Animating
              // during a drag/pinch keeps the element permanently mid-transition,
              // which pins it to a cached GPU layer that never re-rasterises
              // at the current scale — that's what looks blurry on mobile.
              !dragging && !pinching && "transition-transform duration-75",
            )}
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
              const isFacility =
                tb.elementType === "FACILITY" ||
                Boolean(tb.facilityType) ||
                tb.section?.startsWith("FACILITY:")
              
              const facilityType = (
                tb.facilityType ||
                (tb.section?.startsWith("FACILITY:") ? tb.section.replace("FACILITY:", "") : undefined) ||
                (tb.name.toLowerCase().includes("bar") ? "BAR" :
                 tb.name.toLowerCase().includes("restroom") || tb.name.toLowerCase().includes("toilet") || tb.name.toLowerCase().includes("wc") ? "RESTROOM" :
                 tb.name.toLowerCase().includes("entrance") || tb.name.toLowerCase().includes("entry") ? "ENTRANCE" :
                 tb.name.toLowerCase().includes("exit") ? "EXIT" :
                 tb.name.toLowerCase().includes("kitchen") ? "KITCHEN" :
                 tb.name.toLowerCase().includes("host") ? "HOST_STAND" :
                 tb.name.toLowerCase().includes("wall") || tb.name.toLowerCase().includes("divider") ? "WALL" :
                 tb.name.toLowerCase().includes("plant") ? "PLANT" : "BAR")
              ) as FacilityType

              const w = tb.width || (tb.shape === "CIRCLE" || tb.shape === "SQUARE" ? 100 : 140)
              const h = tb.height || (tb.shape === "CIRCLE" || tb.shape === "SQUARE" ? 100 : 90)

              if (isFacility) {
                return (
                  <div
                    key={tb.id}
                    className="absolute pointer-events-none select-none z-5"
                    style={{
                      left: tb.positionX!,
                      top: tb.positionY!,
                      width: w,
                      height: h,
                      transform: `rotate(${tb.rotation || 0}deg)`,
                    }}
                  >
                    <FacilityGraphic
                      type={facilityType}
                      name={tb.name}
                      width={w}
                      height={h}
                    />
                  </div>
                )
              }

              const isSelected = selectedTableId === tb.id
              const isCurrent = currentTableId === tb.id
              const selectable = tb.available || isCurrent

              return (
                <button
                  key={tb.id}
                  type="button"
                  data-table
                  data-table-id={tb.id}
                  aria-disabled={!selectable}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (hasDragged.current) return
                    if (selectable) {
                      onSelect(isSelected ? null : tb.id)
                    }
                  }}
                  className={cn(
                    "absolute p-0 border-0 bg-transparent text-left focus:outline-hidden z-10",
                    selectable ? "cursor-pointer" : "cursor-not-allowed",
                  )}
                  style={{
                    left: tb.positionX!,
                    top: tb.positionY!,
                    width: w,
                    height: h,
                    transform: `rotate(${tb.rotation || 0}deg)`,
                  }}
                >
                  <TableGraphic
                    name={tb.name}
                    capacity={tb.capacity}
                    shape={tb.shape}
                    status={selectable ? "AVAILABLE" : "MAINTENANCE"}
                    width={w}
                    height={h}
                    location={tb.section || undefined}
                    seatsLabel={seatsLabel}
                    isSelected={isSelected}
                    isSelectable={selectable}
                  />
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

  return fullscreen ? createPortal(viewer, document.body) : viewer
}
