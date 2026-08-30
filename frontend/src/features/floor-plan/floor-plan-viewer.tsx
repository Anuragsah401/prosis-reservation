import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize, Minimize, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableGraphic } from "@/features/floor-plan/table-graphic"
import { FacilityGraphic } from "@/features/floor-plan/facility-graphic"
import type { FacilityType, TableStatus } from "@/features/floor-plan/floor-plan-data"

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
  status?: TableStatus
  elementType?: "TABLE" | "FACILITY"
  facilityType?: FacilityType
  groupId?: string | null
  groupName?: string | null
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

const PADDING = 20
const DEFAULT_W = 140
const DEFAULT_H = 90
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3.0

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
    if (floorTables.length === 0) return { minX: 0, minY: 0, width: 400, height: 200 }
    const minX = Math.min(...floorTables.map((t) => t.positionX ?? 0))
    const minY = Math.min(...floorTables.map((t) => t.positionY ?? 0))
    const maxX = Math.max(...floorTables.map((t) => (t.positionX ?? 0) + (t.width || DEFAULT_W)))
    const maxY = Math.max(...floorTables.map((t) => (t.positionY ?? 0) + (t.height || DEFAULT_H)))
    const width = Math.max(100, maxX - minX + PADDING * 2)
    const height = Math.max(100, maxY - minY + PADDING * 2)
    return { minX, minY, maxX, maxY, width, height }
  }, [floorTables])

  const containerRef = useRef<HTMLDivElement>(null)

  const fitToContainer = useCallback(() => {
    if (!containerRef.current || floorTables.length === 0) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      return
    }
    const { clientWidth, clientHeight } = containerRef.current
    if (clientWidth <= 0 || clientHeight <= 0) return

    const pad = clientWidth < 640 ? 10 : 20
    const availableWidth = clientWidth - pad * 2
    const availableHeight = clientHeight - pad * 2

    const scaleX = availableWidth / bounds.width
    const scaleY = availableHeight / bounds.height
    const initialScale = Math.min(1.0, Math.max(0.1, Math.min(scaleX, scaleY)))

    const centeredX = (clientWidth - bounds.width * initialScale) / 2 - (bounds.minX - PADDING) * initialScale
    const centeredY = (clientHeight - bounds.height * initialScale) / 2 - (bounds.minY - PADDING) * initialScale

    setZoom(initialScale)
    setPan({ x: Math.round(centeredX), y: Math.round(centeredY) })
  }, [floorTables.length, bounds])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      fitToContainer()
    })
    return () => cancelAnimationFrame(frame)
  }, [fitToContainer, displayedFloor, fullscreen])

  useEffect(() => {
    const handleResize = () => {
      fitToContainer()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [fitToContainer])

  const zoomBy = (delta: number) => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)))
  }

  const handleToggleFullscreen = useCallback(() => {
    pointers.current.clear()
    isPointerActive.current = false
    hasDragged.current = false
    setDragging(false)
    setPinching(false)
    pinchStart.current = null
    const next = !fullscreen
    setFullscreen(next)
    onFullscreenChange?.(next)
  }, [fullscreen, onFullscreenChange])

  // Escape closes the overlay, and the page behind it is locked so it can't
  // scroll under the fullscreen map on touch devices.
  useEffect(() => {
    if (!fullscreen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleToggleFullscreen()
      }
    }
    document.addEventListener("keydown", onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [fullscreen, handleToggleFullscreen])

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
      data-radix-portal=""
      className={cn(
        "flex flex-col gap-2 w-full h-full min-h-0",
        fullscreen && "bg-background fixed inset-0 z-[9999] p-3 sm:p-4 pointer-events-auto",
      )}
      style={fullscreen ? { pointerEvents: "auto" } : undefined}
    >
      {/* Always shown so the current floor is visible even with a single
          floor — without this, one-floor plans gave no indication which
          floor's tables were on display. */}
      {floors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 rounded-md border p-0.5 self-start shrink-0">
          {floors.map((floor) => (
            <button
              key={floor}
              type="button"
              onClick={() => {
                setActiveFloor(floor)
                setDragging(false)
                setPinching(false)
                pointers.current.clear()
                pinchStart.current = null
              }}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
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
          "bg-muted/30 relative overflow-hidden border w-full flex-1 min-h-0",
          fullscreen ? "min-h-0 flex-1 rounded-md" : "rounded-lg min-h-[300px] sm:min-h-[360px]",
        )}
      >
        <div
          className="absolute top-2 right-2 z-20 flex flex-col gap-1.5"
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
            onClick={() => fitToContainer()}
            className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
            aria-label="Fit view"
            title="Fit view"
          >
            <RotateCcw className="size-4 text-foreground" />
          </button>
          {showFullscreen !== false && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="bg-card hover:bg-accent text-foreground hover:text-accent-foreground border-border flex size-8 cursor-pointer items-center justify-center rounded-md border shadow-md transition-colors"
              aria-label={fullscreen ? "Exit full screen" : "View full screen"}
              title={fullscreen ? "Exit full screen" : "View full screen"}
            >
              {fullscreen ? <Minimize className="size-4 text-foreground" /> : <Maximize className="size-4 text-foreground" />}
            </button>
          )}
        </div>

        <div
          ref={containerRef}
          className={cn(
            "w-full h-full touch-none select-none overflow-hidden",
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
                  disabled={!selectable}
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
                    selectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
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
                    status={tb.status ?? (selectable ? "AVAILABLE" : "RESERVED")}
                    width={w}
                    height={h}
                    location={tb.section || undefined}
                    seatsLabel={seatsLabel}
                    isSelected={isSelected}
                    isSelectable={selectable}
                    showStatusBadge={!selectable}
                    groupId={tb.groupId}
                    groupName={tb.groupName}
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
