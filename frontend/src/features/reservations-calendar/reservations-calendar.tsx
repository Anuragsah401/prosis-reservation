import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  CloudOff,
  CheckCircle2,
  CalendarClock,
  Search,
  AlertTriangle,
} from "lucide-react"
import {
  statusLabels,
  type CalendarReservation,
  type ReservationStatus,
} from "@/features/reservations-calendar/calendar-data"
import { loadOverrides, saveReservationChange } from "@/features/reservations-calendar/calendar-storage"
import { fetchReservations } from "@/features/reservations/reservations-api"
import { CalendarGridView } from "@/features/reservations-calendar/calendar-grid-view"
import { BookingDiagramView, type TimeFilter } from "@/features/reservations-calendar/booking-diagram-view"
import { MiniMonthCalendar } from "@/features/reservations-calendar/mini-month-calendar"
import { BookingSidebarList } from "@/features/reservations-calendar/booking-sidebar-list"
import { ReservationDetailsDialog } from "@/features/reservations-calendar/reservation-details-dialog"

type CalendarViewMode = "diagram" | "day" | "week"

/**
 * Re-applies locally persisted drag/resize edits on top of the server rows so
 * an unsaved reschedule survives a refresh.
 */
function applyOverrides(reservations: CalendarReservation[]): CalendarReservation[] {
  const overrides = loadOverrides()
  return reservations.map((r) => {
    const o = overrides[r.id]
    if (!o) return r
    return { ...r, start: o.start, durationMinutes: o.durationMinutes, tableId: o.tableId }
  })
}

function formatRangeLabel(mode: CalendarViewMode, date: Date) {
  if (mode === "week") {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
  }
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

export function ReservationsCalendar() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("diagram")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<CalendarReservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<CalendarReservation | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "server" | "local">("idle")
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  useEffect(() => {
    // Deferred to a microtask so the fetch isn't dispatched synchronously
    // from the effect body.
    let cancelled = false
    void Promise.resolve().then(async () => {
      try {
        const rows = await fetchReservations()
        if (!cancelled) setReservations(applyOverrides(rows))
      } catch (err) {
        console.error("[calendar] Failed to load reservations:", err)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persistChange = useCallback(
    async (id: string, changes: { start?: string; durationMinutes?: number; tableId?: string }) => {
      const target = reservations.find((r) => r.id === id)
      if (!target) return
      const merged = { ...target, ...changes }

      // Prevent two reservations from occupying the same table at overlapping
      // times — a table can only serve one party at once.
      const mergedStart = new Date(merged.start).getTime()
      const mergedEnd = mergedStart + merged.durationMinutes * 60_000
      const hasConflict = reservations.some((r) => {
        if (r.id === id || r.tableId !== merged.tableId || r.status === "CANCELLED") return false
        const rStart = new Date(r.start).getTime()
        const rEnd = rStart + r.durationMinutes * 60_000
        return mergedStart < rEnd && rStart < mergedEnd
      })

      if (hasConflict) {
        setConflictMessage("That table already has a reservation at this time. Choose a different table or time.")
        return
      }
      setConflictMessage(null)

      setReservations((current) =>
        current.map((r) => (r.id === id ? { ...r, ...changes } : r)),
      )
      setSaveState("saving")
      const result = await saveReservationChange({
        id,
        start: merged.start,
        durationMinutes: merged.durationMinutes,
        tableId: merged.tableId,
      })
      setSaveState(result.persisted)
    },
    [reservations],
  )

  const handleNavigate = useCallback(
    (direction: -1 | 0 | 1) => {
      if (direction === 0) {
        setCurrentDate(new Date())
        return
      }
      setCurrentDate((current) => {
        const next = new Date(current)
        const step = viewMode === "week" ? 7 : 1
        next.setDate(next.getDate() + direction * step)
        return next
      })
    },
    [viewMode],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<ReservationStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    }
    for (const r of reservations) counts[r.status]++
    return counts
  }, [reservations])

  const bookedDates = useMemo(() => {
    const set = new Set<string>()
    for (const r of reservations) {
      const d = new Date(r.start)
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
    return set
  }, [reservations])

  const dayReservations = useMemo(
    () =>
      reservations.filter((r) => {
        const d = new Date(r.start)
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth() &&
          d.getDate() === currentDate.getDate()
        )
      }),
    [reservations, currentDate],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost" className="size-8" onClick={() => handleNavigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleNavigate(0)}>
            Today
          </Button>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => handleNavigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 text-sm font-medium">{formatRangeLabel(viewMode, currentDate)}</span>
        </div>

        <div className="flex items-center gap-2">
          {saveState !== "idle" && (
            <Badge variant="outline" className="gap-1 text-xs">
              {saveState === "saving" ? (
                <>
                  <CalendarClock className="size-3 animate-pulse" /> Saving…
                </>
              ) : saveState === "server" ? (
                <>
                  <CheckCircle2 className="size-3" /> Saved to server
                </>
              ) : (
                <>
                  <CloudOff className="size-3" /> Saved locally
                </>
              )}
            </Badge>
          )}
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            <Button
              size="sm"
              variant={viewMode === "diagram" ? "default" : "ghost"}
              className="h-7 px-2"
              onClick={() => setViewMode("diagram")}
            >
              <LayoutGrid className="size-3.5" />
              Timeline
            </Button>
            <Button
              size="sm"
              variant={viewMode === "day" ? "default" : "ghost"}
              className="h-7 px-2"
              onClick={() => setViewMode("day")}
            >
              <CalendarDays className="size-3.5" />
              Day
            </Button>
            <Button
              size="sm"
              variant={viewMode === "week" ? "default" : "ghost"}
              className="h-7 px-2"
              onClick={() => setViewMode("week")}
            >
              <CalendarRange className="size-3.5" />
              Week
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(Object.keys(statusLabels) as ReservationStatus[]).map((status) => (
          <span key={status} className="text-muted-foreground">
            {statusLabels[status]} ({statusCounts[status]})
          </span>
        ))}
        <span className="text-muted-foreground ml-auto">
          Drag a reservation to change its time
          {viewMode === "day" || viewMode === "week" ? " or duration (resize)" : ""}
          {viewMode === "diagram" ? " or drop onto another table row" : ""}.
          Click a reservation to edit details.
        </span>
      </div>

      {conflictMessage && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <AlertTriangle className="size-3.5 shrink-0" />
          {conflictMessage}
        </div>
      )}

      {viewMode === "diagram" ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border bg-card p-2">
              <MiniMonthCalendar
                selectedDate={currentDate}
                onSelect={setCurrentDate}
                highlightedDates={bookedDates}
              />
            </div>

            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input placeholder="Find customer…" className="h-8 pl-8 text-xs" />
            </div>

            <div className="flex items-center gap-1 rounded-md border p-0.5">
              {(["all", "morning", "lunch", "evening"] as TimeFilter[]).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={timeFilter === filter ? "default" : "ghost"}
                  className="h-6 flex-1 px-1.5 text-[11px] capitalize"
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              <BookingSidebarList
                reservations={dayReservations}
                onSelect={setSelectedReservation}
                selectedId={selectedReservation?.id}
              />
            </div>
          </div>

          <BookingDiagramView
            reservations={reservations}
            currentDate={currentDate}
            timeFilter={timeFilter}
            onReservationClick={setSelectedReservation}
            onReservationChange={persistChange}
          />
        </div>
      ) : (
        <CalendarGridView
          view={viewMode}
          reservations={reservations}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onReservationClick={setSelectedReservation}
          onReservationChange={persistChange}
        />
      )}

      <ReservationDetailsDialog
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        onSave={(id, changes) => {
          persistChange(id, changes)
          setSelectedReservation(null)
        }}
      />
    </div>
  )
}

