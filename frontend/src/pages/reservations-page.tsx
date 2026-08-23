import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { ReservationsCalendar } from "@/features/reservations-calendar/reservations-calendar"
import { MiniMonthCalendar } from "@/features/reservations-calendar/mini-month-calendar"
import {
  statusLabels,
  type CalendarReservation,
  type ReservationStatus,
} from "@/features/reservations-calendar/calendar-data"
import { ReservationsToolbar } from "@/features/reservations/components/reservations-toolbar"
import { ReservationsTable } from "@/features/reservations/components/reservations-table"
import { statusSortOrder } from "@/features/reservations/reservations-constants"
import { isSameDay } from "@/features/reservations/reservations-utils"
import { fetchReservations, updateReservationStatusOnServer } from "@/features/reservations/reservations-api"

export function ReservationsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState("")
  const [allReservations, setAllReservations] = useState<CalendarReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadReservations = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setAllReservations(await fetchReservations())
    } catch (err) {
      console.error("[reservations] Failed to load reservations:", err)
      setLoadError(t("pages.reservations.loadError"))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    // Kicked off in a microtask so the initial fetch isn't dispatched
    // synchronously during the effect body.
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadReservations()
    })
    return () => {
      cancelled = true
    }
  }, [loadReservations])

  async function handleStatusChange(id: string, status: ReservationStatus) {
    const previous = allReservations
    const target = allReservations.find((r) => r.id === id)
    // Applied optimistically so the table responds immediately, then rolled
    // back if the server rejects the transition.
    setAllReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    try {
      await updateReservationStatusOnServer(id, status)
      toast.success(
        t("pages.reservations.toasts.statusUpdated", "Reservation status updated to {{status}}", {
          status: statusLabels[status] ?? status,
        }),
        {
          description: target?.customerName,
        }
      )
    } catch (err) {
      console.error("[reservations] Failed to update status:", err)
      setAllReservations(previous)
      toast.error(t("pages.reservations.toasts.statusError", "Failed to update reservation status"))
    }
  }

  function handleCreateReservation(reservation: CalendarReservation) {
    setAllReservations((prev) => [...prev, reservation])
    setSelectedDate(new Date(reservation.start))
  }

  function handleUpdateReservation(updated: CalendarReservation) {
    setAllReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  function handleDeleteReservation(id: string) {
    setAllReservations((prev) => prev.filter((r) => r.id !== id))
  }

  const bookedDates = useMemo(() => {
    const set = new Set<string>()
    for (const r of allReservations) {
      const d = new Date(r.start)
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
    return set
  }, [allReservations])

  const filteredReservations = useMemo(() => {
    return allReservations
      .filter((r) => isSameDay(new Date(r.start), selectedDate))
      .filter((r) => r.customerName.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => {
        const statusDiff = statusSortOrder[a.status] - statusSortOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.start.localeCompare(b.start)
      })
  }, [allReservations, selectedDate, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.reservations.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("pages.reservations.subtitle")}</p>
        </div>
        <ReservationsToolbar
          tab={tab}
          onTabChange={setTab}
          defaultDate={selectedDate}
          onCreate={handleCreateReservation}
        />
      </div>

      {tab === "calendar" ? (
        <ReservationsCalendar />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div className="bg-card rounded-lg border p-2">
            <MiniMonthCalendar
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              highlightedDates={bookedDates}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder={t("pages.reservations.searchPlaceholder")}
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {t("pages.reservations.resultCount", { count: filteredReservations.length })}
              </p>
            </div>

            {loadError ? (
              <div className="border-destructive/50 bg-destructive/5 text-destructive flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => void loadReservations()}
                  className="font-medium underline underline-offset-4"
                >
                  {t("pages.reservations.retry")}
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
                {t("pages.reservations.loading")}
              </div>
            ) : (
              <ReservationsTable
                reservations={filteredReservations}
                onStatusChange={handleStatusChange}
                onUpdateReservation={handleUpdateReservation}
                onDeleteReservation={handleDeleteReservation}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
