import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ReservationsCalendar } from "@/features/reservations-calendar/reservations-calendar"
import { MiniMonthCalendar } from "@/features/reservations-calendar/mini-month-calendar"
import {
  statusLabels,
  type CalendarReservation,
  type ReservationStatus,
} from "@/features/reservations-calendar/calendar-data"
import { ReservationsToolbar } from "@/features/reservations/components/reservations-toolbar"
import { ReservationsTable } from "@/features/reservations/components/reservations-table"
import { ReservationsStats } from "@/features/reservations/components/reservations-stats"
import { ReservationsDateNav } from "@/features/reservations/components/reservations-date-nav"
import { statusSortOrder } from "@/features/reservations/reservations-constants"
import { isSameDay, exportReservationsToCSV, printDailyRunSheet, toDateInputValue } from "@/features/reservations/reservations-utils"
import { fetchReservations, updateReservationStatusOnServer } from "@/features/reservations/reservations-api"
import { useRealtimeListener } from "@/features/realtime"
import { useRestaurant } from "@/features/restaurant/restaurant-context"

type StatusFilterOption = "all" | ReservationStatus

export function ReservationsPage() {
  const { t, i18n } = useTranslation()
  const { profile } = useRestaurant()
  const [tab, setTab] = useState<"list" | "calendar">("list")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all")
  const [allReservations, setAllReservations] = useState<CalendarReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadReservations = useCallback(async (showLoading = true, isManual = false) => {
    if (showLoading) setIsLoading(true)
    if (isManual) setIsRefreshing(true)
    setLoadError(null)
    try {
      const data = await fetchReservations()
      setAllReservations(data)
      if (isManual) {
        toast.success(t("pages.reservations.toasts.refreshed", "Reservations updated"))
      }
    } catch (err) {
      console.error("[reservations] Failed to load reservations:", err)
      setLoadError(t("pages.reservations.loadError", "Could not load reservations. Please try again."))
    } finally {
      if (showLoading) setIsLoading(false)
      if (isManual) setIsRefreshing(false)
    }
  }, [t])

  // Real-time live sync for reservations
  useRealtimeListener("RESERVATION_CREATED", () => {
    void loadReservations(false)
  })

  useRealtimeListener("RESERVATION_UPDATED", () => {
    void loadReservations(false)
  })

  useRealtimeListener("RESERVATION_STATUS_CHANGED", () => {
    void loadReservations(false)
  })

  useRealtimeListener("RESERVATION_DELETED", () => {
    void loadReservations(false)
  })

  useEffect(() => {
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
    // Optimistic update
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

  async function handleBulkStatusChange(ids: string[], status: ReservationStatus) {
    const previous = allReservations
    setAllReservations((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status } : r)))
    try {
      await Promise.all(ids.map((id) => updateReservationStatusOnServer(id, status)))
      toast.success(
        t("pages.reservations.toasts.bulkStatusUpdated", "Updated {{count}} reservations to {{status}}", {
          count: ids.length,
          status: statusLabels[status] ?? status,
        })
      )
    } catch (err) {
      console.error("[reservations] Failed bulk status update:", err)
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

  // All reservations for the active day (for stats and counts)
  const dayReservations = useMemo(() => {
    return allReservations.filter((r) => isSameDay(new Date(r.start), selectedDate))
  }, [allReservations, selectedDate])

  // Status counts for the selected day
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilterOption, number> = {
      all: dayReservations.length,
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    }
    for (const r of dayReservations) {
      if (counts[r.status] !== undefined) {
        counts[r.status]++
      }
    }
    return counts
  }, [dayReservations])

  // Filtered reservations applying status filter and text search
  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return dayReservations
      .filter((r) => {
        if (statusFilter === "all") return true
        return r.status === statusFilter
      })
      .filter((r) => {
        if (!query) return true
        const matchCustomer = r.customerName.toLowerCase().includes(query)
        const matchPhone = (r.customerPhone || "").toLowerCase().includes(query)
        const matchEmail = (r.customerEmail || "").toLowerCase().includes(query)
        const matchTable = (r.tableName || "").toLowerCase().includes(query)
        const matchNotes = (r.notes || "").toLowerCase().includes(query)
        const matchSpecial = (r.specialRequests || "").toLowerCase().includes(query)
        const matchEvent = (r.eventType || "").toLowerCase().includes(query)
        return matchCustomer || matchPhone || matchEmail || matchTable || matchNotes || matchSpecial || matchEvent
      })
      .sort((a, b) => {
        const statusDiff = statusSortOrder[a.status] - statusSortOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.start.localeCompare(b.start)
      })
  }, [dayReservations, statusFilter, search])

  const handlePrint = () => {
    const formattedDate = selectedDate.toLocaleDateString(i18n.language || undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    printDailyRunSheet(filteredReservations, formattedDate, profile?.name || "Restaurant")
  }

  const handleExport = () => {
    exportReservationsToCSV(filteredReservations, toDateInputValue(selectedDate))
  }

  const statusFilterTabs: { id: StatusFilterOption; label: string; count: number }[] = [
    { id: "all", label: t("pages.reservations.filters.all", "All"), count: statusCounts.all },
    { id: "CONFIRMED", label: t("pages.reservations.filters.confirmed", "Confirmed"), count: statusCounts.CONFIRMED },
    { id: "CHECKED_IN", label: t("pages.reservations.filters.seated", "Seated"), count: statusCounts.CHECKED_IN },
    { id: "PENDING", label: t("pages.reservations.filters.pending", "Pending"), count: statusCounts.PENDING },
    { id: "COMPLETED", label: t("pages.reservations.filters.completed", "Completed"), count: statusCounts.COMPLETED },
    { id: "CANCELLED", label: t("pages.reservations.filters.cancelled", "Cancelled"), count: statusCounts.CANCELLED },
    { id: "NO_SHOW", label: t("pages.reservations.filters.noShow", "No-show"), count: statusCounts.NO_SHOW },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("pages.reservations.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("pages.reservations.subtitle")}</p>
        </div>
        <ReservationsToolbar
          tab={tab}
          onTabChange={setTab}
          defaultDate={selectedDate}
          onCreate={handleCreateReservation}
          onRefresh={() => void loadReservations(false, true)}
          isRefreshing={isRefreshing}
          onExportCSV={handleExport}
          onPrintRunSheet={handlePrint}
        />
      </div>

      {/* Daily KPI Stats Summary Cards */}
      <ReservationsStats reservations={dayReservations} />

      {/* Date Quick Navigator Bar */}
      <ReservationsDateNav
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        totalCount={filteredReservations.length}
      />

      {tab === "calendar" ? (
        <ReservationsCalendar />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          {/* Left Mini Calendar: Displayed in sidebar on desktop (>= lg) */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="bg-card rounded-xl border border-border/80 p-2 shadow-xs sticky top-4">
              <MiniMonthCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                highlightedDates={bookedDates}
              />
            </div>
          </div>

          {/* Right Main Table & Filters Area */}
          <div className="flex flex-col gap-3 min-w-0">
            {/* Status Filter Tabs & Search Bar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Status Chips: Swipeable on mobile, wrapping on larger screens */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0 flex-nowrap sm:flex-wrap">
                {statusFilterTabs.map((tabItem) => {
                  const isActive = statusFilter === tabItem.id
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      onClick={() => setStatusFilter(tabItem.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 sm:border-transparent",
                      )}
                    >
                      <span>{tabItem.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tabItem.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Search Bar with Clear Button */}
              <div className="relative w-full sm:w-60 shrink-0">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder={t("pages.reservations.searchPlaceholder", "Search reservations...")}
                  className="h-8 pl-8 pr-8 text-xs bg-card"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Error or Loading or Table */}
            {loadError ? (
              <div className="border-destructive/50 bg-destructive/5 text-destructive flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => void loadReservations()}
                  className="font-medium underline underline-offset-4 cursor-pointer"
                >
                  {t("pages.reservations.retry", "Retry")}
                </button>
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>{t("pages.reservations.loading", "Loading reservations...")}</span>
                </div>
              </div>
            ) : (
              <ReservationsTable
                reservations={filteredReservations}
                onStatusChange={handleStatusChange}
                onBulkStatusChange={handleBulkStatusChange}
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
