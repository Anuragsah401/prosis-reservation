import { useCallback, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventDropArg, EventClickArg } from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"

import {
  getCalendarTables,
  statusColors,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { minutesToHour } from "@/features/restaurant/restaurant-api"

export interface CalendarGridViewProps {
  view: "day" | "week"
  reservations: CalendarReservation[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onReservationClick: (reservation: CalendarReservation) => void
  onReservationChange: (id: string, changes: { start?: string; durationMinutes?: number }) => void
}

function formatSlotTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00:00`
}

export function CalendarGridView({
  view,
  reservations,
  currentDate,
  onDateChange,
  onReservationClick,
  onReservationChange,
}: CalendarGridViewProps) {
  const { profile } = useRestaurant()

  // Use restaurant opening/closing hours if available, otherwise defaults
  const openingHour = profile ? minutesToHour(profile.openingTime) : 10
  const closingHour = profile ? Math.ceil(profile.closingTime / 60) : 24

  const tableNameById = useMemo(
    () => new Map(getCalendarTables().map((t) => [t.id, t.name])),
    [],
  )

  const events = useMemo(
    () =>
      reservations.map((r) => {
        const start = new Date(r.start)
        const end = new Date(start.getTime() + r.durationMinutes * 60_000)
        const colors = statusColors[r.status]
        return {
          id: r.id,
          title: `${r.customerName} · ${r.tableName ?? tableNameById.get(r.tableId) ?? "—"} · ${r.partySize}p`,
          start,
          end,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
        }
      }),
    [reservations, tableNameById],
  )

  const handleEventDrop = useCallback(
    (arg: EventDropArg) => {
      const newStart = arg.event.start
      if (!newStart) return
      onReservationChange(arg.event.id, { start: newStart.toISOString() })
    },
    [onReservationChange],
  )

  const handleEventResize = useCallback(
    (arg: EventResizeDoneArg) => {
      const start = arg.event.start
      const end = arg.event.end
      if (!start || !end) return
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000)
      onReservationChange(arg.event.id, { durationMinutes })
    },
    [onReservationChange],
  )

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const reservation = reservations.find((r) => r.id === arg.event.id)
      if (reservation) onReservationClick(reservation)
    },
    [reservations, onReservationClick],
  )

  return (
    <div className="reservation-calendar rounded-xl border p-2">
      <FullCalendar
        key={view}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view === "day" ? "timeGridDay" : "timeGridWeek"}
        initialDate={currentDate}
        headerToolbar={false}
        height="auto"
        allDaySlot={false}
        slotMinTime={formatSlotTime(openingHour)}
        slotMaxTime={formatSlotTime(closingHour)}
        slotDuration="00:15:00"
        nowIndicator
        editable
        eventStartEditable
        eventDurationEditable
        eventResizableFromStart={false}
        events={events}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
        datesSet={(arg) => onDateChange(arg.view.currentStart)}
      />
    </div>
  )
}
