import { useCallback, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  calendarTables,
  statusColors,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"

export interface TimelineViewProps {
  reservations: CalendarReservation[]
  currentDate: Date
  onReservationClick: (reservation: CalendarReservation) => void
  onReservationChange: (id: string, changes: { start?: string; tableId?: string }) => void
}

const START_HOUR = 10
const END_HOUR = 24
const PX_PER_MINUTE = 2
const ROW_HEIGHT = 64

function minutesSinceStart(date: Date) {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes()
}

export function TimelineView({
  reservations,
  currentDate,
  onReservationClick,
  onReservationChange,
}: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<{
    id: string
    startX: number
    originalMinutes: number
  } | null>(null)

  const dayReservations = useMemo(() => {
    return reservations.filter((r) => {
      const d = new Date(r.start)
      return (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === currentDate.getDate()
      )
    })
  }, [reservations, currentDate])

  const hours = useMemo(() => {
    const arr: number[] = []
    for (let h = START_HOUR; h <= END_HOUR; h++) arr.push(h)
    return arr
  }, [])

  const totalWidth = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE

  const handlePointerDown = useCallback((e: React.PointerEvent, reservation: CalendarReservation) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      id: reservation.id,
      startX: e.clientX,
      originalMinutes: minutesSinceStart(new Date(reservation.start)),
    })
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return
      const deltaX = e.clientX - dragState.startX
      const deltaMinutes = Math.round(deltaX / PX_PER_MINUTE / 5) * 5
      const el = document.getElementById(`timeline-event-${dragState.id}`)
      if (el) {
        el.style.left = `${Math.max(0, (dragState.originalMinutes + deltaMinutes) * PX_PER_MINUTE)}px`
      }
    },
    [dragState],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return
      const deltaX = e.clientX - dragState.startX
      const deltaMinutes = Math.round(deltaX / PX_PER_MINUTE / 5) * 5
      if (deltaMinutes !== 0) {
        const reservation = dayReservations.find((r) => r.id === dragState.id)
        if (reservation) {
          const newStart = new Date(reservation.start)
          newStart.setMinutes(newStart.getMinutes() + deltaMinutes)
          onReservationChange(reservation.id, { start: newStart.toISOString() })
        }
      }
      setDragState(null)
    },
    [dragState, dayReservations, onReservationChange],
  )

  const handleDropOnTable = useCallback(
    (id: string, tableId: string) => {
      onReservationChange(id, { tableId })
    },
    [onReservationChange],
  )

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div style={{ minWidth: totalWidth + 140 }}>
        {/* Hour header */}
        <div className="bg-muted/50 sticky top-0 z-10 flex border-b">
          <div className="text-muted-foreground w-35 shrink-0 border-r px-3 py-2 text-xs font-medium">
            Table
          </div>
          <div className="relative flex-1" style={{ width: totalWidth }}>
            <div className="flex">
              {hours.map((h) => (
                <div
                  key={h}
                  className="text-muted-foreground shrink-0 border-r px-1.5 py-2 text-xs"
                  style={{ width: 60 * PX_PER_MINUTE }}
                >
                  {h % 24 === 0 ? "12 AM" : h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table rows */}
        {calendarTables.map((table) => (
          <div
            key={table.id}
            className="flex border-b last:border-b-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData("text/reservation-id")
              if (id) handleDropOnTable(id, table.id)
            }}
          >
            <div className="bg-card flex w-35 shrink-0 flex-col justify-center border-r px-3 py-2">
              <span className="text-sm font-medium">{table.name}</span>
              <span className="text-muted-foreground text-xs">Seats {table.capacity}</span>
            </div>
            <div
              className="relative shrink-0"
              style={{ width: totalWidth, height: ROW_HEIGHT }}
              ref={containerRef}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-border/50 absolute top-0 h-full border-r"
                  style={{ left: (h - START_HOUR) * 60 * PX_PER_MINUTE }}
                />
              ))}
              {dayReservations
                .filter((r) => r.tableId === table.id)
                .map((r) => {
                  const start = new Date(r.start)
                  const left = Math.max(0, minutesSinceStart(start) * PX_PER_MINUTE)
                  const width = r.durationMinutes * PX_PER_MINUTE
                  const colors = statusColors[r.status]
                  return (
                    <div
                      key={r.id}
                      id={`timeline-event-${r.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/reservation-id", r.id)
                      }}
                      onPointerDown={(e) => handlePointerDown(e, r)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onClick={() => onReservationClick(r)}
                      className={cn(
                        "absolute top-2 flex h-12 cursor-grab flex-col justify-center overflow-hidden rounded-md border px-2 text-xs shadow-sm select-none active:cursor-grabbing",
                      )}
                      style={{
                        left,
                        width: Math.max(width, 40),
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                      title={`${r.customerName} · ${r.partySize} guests · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                    >
                      <span className="truncate font-medium">{r.customerName}</span>
                      <span className="truncate opacity-80">{r.partySize} guests</span>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
