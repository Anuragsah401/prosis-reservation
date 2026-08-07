import { useCallback, useMemo, useState } from "react"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCalendarTables,
  type CalendarTable,
  statusColors,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"

export type TimeFilter = "all" | "morning" | "lunch" | "evening"

export interface BookingDiagramViewProps {
  reservations: CalendarReservation[]
  currentDate: Date
  timeFilter: TimeFilter
  onReservationClick: (reservation: CalendarReservation) => void
  onReservationChange: (id: string, changes: { start?: string; tableId?: string }) => void
}

const HOUR_RANGES: Record<TimeFilter, [number, number]> = {
  all: [10, 24],
  morning: [10, 12],
  lunch: [12, 16],
  evening: [16, 24],
}

const PX_PER_MINUTE = 2.4
const ROW_HEIGHT = 44

function minutesSince(startHour: number, date: Date) {
  return (date.getHours() - startHour) * 60 + date.getMinutes()
}

function formatHourLabel(h: number) {
  const hour = h % 24
  if (hour === 0) return "12 AM"
  if (hour === 12) return "12 PM"
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

export function BookingDiagramView({
  reservations,
  currentDate,
  timeFilter,
  onReservationClick,
  onReservationChange,
}: BookingDiagramViewProps) {
  const [startHour, endHour] = HOUR_RANGES[timeFilter]
  const [dragState, setDragState] = useState<{ id: string; startX: number; originalMinutes: number } | null>(
    null,
  )

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

  const calendarTables = useMemo(() => getCalendarTables(), [])

  const floors = useMemo(() => {
    const seen = new Map<string, CalendarTable[]>()
    for (const table of calendarTables) {
      const list = seen.get(table.floor) ?? []
      list.push(table)
      seen.set(table.floor, list)
    }
    return Array.from(seen.entries())
  }, [calendarTables])

  const hours = useMemo(() => {
    const arr: number[] = []
    for (let h = startHour; h <= endHour; h++) arr.push(h)
    return arr
  }, [startHour, endHour])

  const totalWidth = (endHour - startHour) * 60 * PX_PER_MINUTE

  const now = new Date()
  const isToday =
    now.getFullYear() === currentDate.getFullYear() &&
    now.getMonth() === currentDate.getMonth() &&
    now.getDate() === currentDate.getDate()
  const nowOffset = minutesSince(startHour, now) * PX_PER_MINUTE
  const showNowLine = isToday && nowOffset >= 0 && nowOffset <= totalWidth

  const handlePointerDown = useCallback((e: React.PointerEvent, reservation: CalendarReservation) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    setDragState({
      id: reservation.id,
      startX: e.clientX,
      originalMinutes: minutesSince(startHour, new Date(reservation.start)),
    })
  }, [startHour])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return
      const deltaX = e.clientX - dragState.startX
      const deltaMinutes = Math.round(deltaX / PX_PER_MINUTE / 5) * 5
      const el = document.getElementById(`diagram-event-${dragState.id}`)
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

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div style={{ minWidth: totalWidth + 96 }}>
        <div className="bg-muted/40 sticky top-0 z-10 flex border-b">
          <div className="w-24 shrink-0 border-r" />
          <div className="relative flex" style={{ width: totalWidth }}>
            {hours.map((h) => (
              <div
                key={h}
                className="text-muted-foreground shrink-0 border-r px-1.5 py-1.5 text-[11px]"
                style={{ width: 60 * PX_PER_MINUTE }}
              >
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          {showNowLine && (
            <div
              className="absolute top-0 bottom-0 z-20 w-px bg-blue-500"
              style={{ left: 96 + nowOffset }}
            >
              <div className="absolute -top-1 -left-0.75 size-2 rounded-full bg-blue-500" />
            </div>
          )}

          {floors.map(([floorName, tables]) => (
            <div key={floorName}>
              <div className="bg-muted/60 text-muted-foreground border-b px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                {floorName}
              </div>
              {tables.map((table) => {
                const tableReservations = dayReservations.filter((r) => r.tableId === table.id)
                return (
                  <div
                    key={table.id}
                    className="flex border-b last:border-b-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const id = e.dataTransfer.getData("text/reservation-id")
                      if (id) onReservationChange(id, { tableId: table.id })
                    }}
                  >
                    <div className="bg-card flex w-24 shrink-0 items-center gap-1.5 border-r px-2.5">
                      <span className="text-sm font-medium">{table.name}</span>
                      <span className="text-muted-foreground text-[10px]">({tableReservations.length})</span>
                    </div>
                    <div className="relative shrink-0" style={{ width: totalWidth, height: ROW_HEIGHT }}>
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="border-border/50 absolute top-0 h-full border-r"
                          style={{ left: (h - startHour) * 60 * PX_PER_MINUTE }}
                        />
                      ))}
                      {tableReservations.map((r) => {
                        const start = new Date(r.start)
                        const left = Math.max(0, minutesSince(startHour, start) * PX_PER_MINUTE)
                        const width = Math.max(r.durationMinutes * PX_PER_MINUTE, 56)
                        const colors = statusColors[r.status]
                        return (
                          <div
                            key={r.id}
                            id={`diagram-event-${r.id}`}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/reservation-id", r.id)}
                            onPointerDown={(e) => handlePointerDown(e, r)}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onClick={() => onReservationClick(r)}
                            className={cn(
                              "absolute top-1.5 flex h-8 cursor-grab items-center gap-1.5 overflow-hidden rounded-md border px-2 text-[11px] font-medium shadow-sm select-none active:cursor-grabbing",
                            )}
                            style={{
                              left,
                              width,
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                              color: colors.text,
                            }}
                            title={`${r.customerName} · ${r.partySize} guests · ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                          >
                            <span className="truncate">{r.customerName}</span>
                            <span className="ml-auto flex shrink-0 items-center gap-0.5 opacity-80">
                              <Users className="size-3" />
                              {r.partySize}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
