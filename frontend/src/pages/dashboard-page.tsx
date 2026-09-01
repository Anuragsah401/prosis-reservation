import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  CalendarCheck,
  UtensilsCrossed,
  Users,
  Loader2,
  Clock,
  Plus,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  Flame,
  Phone,
  ChevronRight,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient, ApiError, getCurrentRestaurantId } from "@/lib/api-client"
import { useRealtimeListener } from "@/features/realtime"
import { authClient } from "@/features/auth/auth-client"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { updateReservationStatusOnServer } from "@/features/reservations/reservations-api"
import type { ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ApiTable {
  id: string
  name: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
  capacity: number
  section?: string | null
  floor?: string | null
}

interface ApiCustomer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface ApiReservation {
  id: string
  partySize: number
  reservedFor: string
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  notes?: string | null
  tableId?: string | null
  table?: { id: string; name: string; section?: string | null } | null
  customer?: { id: string; name: string; email?: string | null; phone?: string | null } | null
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getShiftGreeting(hours: number, t: (key: string, fallback?: any) => string): { greeting: string; shift: string } {
  if (hours < 12) {
    return {
      greeting: t("pages.dashboard.greetingMorning", "Good Morning"),
      shift: t("pages.dashboard.shiftBreakfast", "Breakfast & Brunch"),
    }
  }
  if (hours < 16) {
    return {
      greeting: t("pages.dashboard.greetingAfternoon", "Good Afternoon"),
      shift: t("pages.dashboard.shiftLunch", "Lunch Service"),
    }
  }
  return {
    greeting: t("pages.dashboard.greetingEvening", "Good Evening"),
    shift: t("pages.dashboard.shiftDinner", "Dinner Service"),
  }
}

const statusBadgeStyles: Record<string, string> = {
  CONFIRMED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CHECKED_IN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
  NO_SHOW: "bg-destructive/10 text-destructive border-destructive/20",
}

type TabFilter = "all" | "next2h" | "seated" | "confirmed" | "pending"

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = authClient.getUser()
  const { profile } = useRestaurant()

  const [tables, setTables] = useState<ApiTable[]>([])
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [reservations, setReservations] = useState<ApiReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>("all")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every minute
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(clockInterval)
  }, [])

  const loadDashboardData = useCallback(async (showLoading = true, manual = false) => {
    const restaurantId = getCurrentRestaurantId()
    if (!restaurantId) {
      setError(t("pages.dashboard.noRestaurant", "No restaurant associated with your account yet."))
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)
    if (manual) setIsRefreshing(true)
    setError(null)
    const qs = `restaurantId=${encodeURIComponent(restaurantId)}`
    try {
      const [tablesRes, customersRes, reservationsRes] = await Promise.all([
        apiClient.get<ApiTable[]>(`/tables?${qs}`),
        apiClient.get<ApiCustomer[]>(`/customers?${qs}`),
        apiClient.get<ApiReservation[]>(`/reservations?${qs}`),
      ])
      setTables(tablesRes || [])
      setCustomers(customersRes || [])
      setReservations(reservationsRes || [])
      if (manual) {
        toast.success(t("pages.dashboard.dataUpdated", "Dashboard data updated"))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("pages.dashboard.loadError", "Failed to load dashboard data."))
    } finally {
      if (showLoading) setLoading(false)
      if (manual) setIsRefreshing(false)
    }
  }, [t])

  // Real-time live sync listeners
  useRealtimeListener("RESERVATION_CREATED", () => void loadDashboardData(false))
  useRealtimeListener("RESERVATION_UPDATED", () => void loadDashboardData(false))
  useRealtimeListener("RESERVATION_STATUS_CHANGED", () => void loadDashboardData(false))
  useRealtimeListener("RESERVATION_DELETED", () => void loadDashboardData(false))
  useRealtimeListener("TABLE_UPDATED", () => void loadDashboardData(false))

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadDashboardData(true)
    })

    const interval = setInterval(() => {
      if (!cancelled && document.visibilityState === "visible") {
        void loadDashboardData(false)
      }
    }, 20_000)

    const handleFocus = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void loadDashboardData(false)
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
    }
  }, [loadDashboardData])

  // Process today's reservations
  const todaysReservations = useMemo(() => {
    const today = new Date()
    return reservations.filter((r) => isSameDay(new Date(r.reservedFor), today))
  }, [reservations])

  // Total covers booked today
  const totalCoversToday = useMemo(() => {
    return todaysReservations
      .filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW")
      .reduce((sum, r) => sum + (r.partySize || 0), 0)
  }, [todaysReservations])

  // Covers seated or completed
  const seatedCoversToday = useMemo(() => {
    return todaysReservations
      .filter((r) => r.status === "CHECKED_IN" || r.status === "COMPLETED")
      .reduce((sum, r) => sum + (r.partySize || 0), 0)
  }, [todaysReservations])

  // Table status breakdown
  const tableStats = useMemo(() => {
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length
    const reserved = tables.filter((t) => t.status === "RESERVED").length
    const available = tables.filter((t) => t.status === "AVAILABLE").length
    return { occupied, reserved, available, total: tables.length }
  }, [tables])

  // Reservations arriving in next 2 hours
  const arrivingNext2Hours = useMemo(() => {
    const now = currentTime.getTime()
    const twoHoursLater = now + 2 * 60 * 60 * 1000
    return todaysReservations.filter((r) => {
      if (r.status === "CANCELLED" || r.status === "COMPLETED" || r.status === "NO_SHOW") return false
      const time = new Date(r.reservedFor).getTime()
      return time >= now - 15 * 60 * 1000 && time <= twoHoursLater
    })
  }, [todaysReservations, currentTime])

  // Hourly Covers Breakdown for visual timeline
  const hourlyShiftData = useMemo(() => {
    const hoursMap: Record<number, number> = {}
    for (let h = 11; h <= 23; h++) {
      hoursMap[h] = 0
    }
    todaysReservations.forEach((r) => {
      if (r.status === "CANCELLED" || r.status === "NO_SHOW") return
      const h = new Date(r.reservedFor).getHours()
      if (hoursMap[h] !== undefined) {
        hoursMap[h] += r.partySize || 1
      }
    })
    const peakHourEntry = Object.entries(hoursMap).reduce(
      (max, [hour, covers]) => (covers > max.covers ? { hour: Number(hour), covers } : max),
      { hour: 19, covers: 0 },
    )
    return { hoursMap, peakHour: peakHourEntry }
  }, [todaysReservations])

  // Filtered reservations list for run sheet
  const filteredRunSheet = useMemo(() => {
    const sorted = [...todaysReservations].sort(
      (a, b) => new Date(a.reservedFor).getTime() - new Date(b.reservedFor).getTime(),
    )
    if (activeTab === "next2h") {
      const ids = new Set(arrivingNext2Hours.map((r) => r.id))
      return sorted.filter((r) => ids.has(r.id))
    }
    if (activeTab === "seated") {
      return sorted.filter((r) => r.status === "CHECKED_IN")
    }
    if (activeTab === "confirmed") {
      return sorted.filter((r) => r.status === "CONFIRMED")
    }
    if (activeTab === "pending") {
      return sorted.filter((r) => r.status === "PENDING")
    }
    return sorted
  }, [todaysReservations, activeTab, arrivingNext2Hours])

  const handleStatusChange = async (resId: string, newStatus: ReservationStatus) => {
    try {
      await updateReservationStatusOnServer(resId, newStatus)
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, status: newStatus as any } : r)),
      )
      toast.success(`Status: ${newStatus}`)
    } catch {
      toast.error("Failed to update status on server")
    }
  }

  const { greeting, shift } = getShiftGreeting(currentTime.getHours(), t)
  const restaurantDisplayName = profile?.name || user?.restaurant?.name || t("common.appName", "Seat Booking")

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full pb-10">
      {/* ========================================= */}
      {/* 1. Header Cockpit Hero Banner             */}
      {/* ========================================= */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-linear-to-br from-primary/10 via-card to-background p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4 relative z-10">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                {greeting}, {user?.name?.split(" ")[0] || "Team"}
              </h1>
              <Badge variant="outline" className="text-[11px] sm:text-xs font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/20 shrink-0">
                {restaurantDisplayName}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{shift}</span>
              <span>•</span>
              <span>{currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              <span>•</span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          </div>

          {/* Quick Action Suite */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(false, true)}
              disabled={isRefreshing}
              className="rounded-xl text-xs gap-1.5 font-semibold h-9 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span>{t("pages.dashboard.refresh", "Refresh")}</span>
            </Button>
          </div>
        </div>
      </div>

      {loading && !reservations.length ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span>{t("pages.dashboard.loadingOperations", "Loading live restaurant operations…")}</span>
          </div>
        </div>
      ) : error ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadDashboardData(true)} className="mt-3 rounded-xl">
            {t("common.retry", "Retry")}
          </Button>
        </Card>
      ) : (
        <>
          {/* ========================================= */}
          {/* 2. Hero Live Stat Cards (2x2 on Mobile/Tablet, 4 on Desktop) */}
          {/* ========================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Card 1: Today's Covers & Guests */}
            <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {t("pages.dashboard.statTodaysCovers", "Today's Covers")}
                </span>
                <div className="size-6 sm:size-8 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarCheck className="size-3.5 sm:size-4" />
                </div>
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
                    {totalCoversToday}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                    {todaysReservations.length} {t("pages.dashboard.bks", "bks")}
                  </span>
                </div>
                {/* Visual Seated Progress Bar */}
                <div className="space-y-0.5">
                  <div className="w-full h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${totalCoversToday > 0 ? Math.min(100, Math.round((seatedCoversToday / totalCoversToday) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] sm:text-[10.5px] text-muted-foreground">
                    <span>{seatedCoversToday} {t("pages.dashboard.seated", "seated")}</span>
                    <span>{Math.max(0, totalCoversToday - seatedCoversToday)} {t("pages.dashboard.left", "left")}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Table Occupancy */}
            <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {t("pages.dashboard.occupancy", "Occupancy")}
                </span>
                <div className="size-6 sm:size-8 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="size-3.5 sm:size-4" />
                </div>
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
                    {tableStats.occupied} / {tableStats.total || 12}
                  </span>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-500/30">
                    {tableStats.available} {t("pages.dashboard.free", "Free")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[11px] text-muted-foreground truncate">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 sm:size-2 rounded-full bg-amber-500 shrink-0" />
                    <span>{tableStats.occupied} {t("pages.dashboard.seated", "Seated")}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 sm:size-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{tableStats.reserved} {t("pages.dashboard.res", "Res")}</span>
                  </span>
                </div>
              </div>
            </Card>

            {/* Card 3: Arriving Next 2 Hours */}
            <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {t("pages.dashboard.next2Hours", "Next 2 Hours")}
                </span>
                <div className="size-6 sm:size-8 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="size-3.5 sm:size-4" />
                </div>
              </div>
              <div className="space-y-1 mt-1">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
                    {arrivingNext2Hours.length}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                    {arrivingNext2Hours.reduce((sum, r) => sum + r.partySize, 0)} {t("pages.dashboard.guestsCount", "guests")}
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11px] text-muted-foreground truncate">
                  {arrivingNext2Hours.length === 0
                    ? t("pages.dashboard.noArrivalsSoon", "No arrivals expected soon")
                    : `${arrivingNext2Hours[0]?.customer?.name || t("pages.dashboard.guest", "Guest")} ${t("pages.dashboard.nextAt", "next at")} ${new Date(arrivingNext2Hours[0]?.reservedFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            </Card>

            {/* Card 4: Total Customers & Profiles */}
            <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors p-3 sm:p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 gap-1">
                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {t("pages.dashboard.guestProfiles", "Guests")}
                </span>
                <div className="size-6 sm:size-8 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="size-3.5 sm:size-4" />
                </div>
              </div>
              <div className="space-y-1 mt-1">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
                    {customers.length || 42}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/customers")}
                    className="text-[10px] sm:text-xs text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {t("pages.dashboard.directory", "Directory")} →
                  </button>
                </div>
                <p className="text-[9.5px] sm:text-[11px] text-muted-foreground truncate">
                  {t("pages.dashboard.sharedPreferences", "Shared guest preferences")}
                </p>
              </div>
            </Card>
          </div>

          {/* ========================================= */}
          {/* 3. Hourly Service Rush Timeline (Swipeable on Mobile/Tablet) */}
          {/* ========================================= */}
          <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-5 pb-2 sm:pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flame className="size-4 text-amber-500" />
                  <span>{t("pages.dashboard.timelineTitle", "Today's Shift Covers Timeline")}</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t("pages.dashboard.timelineSubtitle", "Hourly expected guest volume distribution for today's service.")}
                </CardDescription>
              </div>
              {hourlyShiftData.peakHour.covers > 0 && (
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold gap-1 self-start sm:self-auto">
                  <Flame className="size-3" />
                  <span>{t("pages.dashboard.peakRush", "Peak Rush")}: {hourlyShiftData.peakHour.hour}:00 ({hourlyShiftData.peakHour.covers} {t("pages.dashboard.covers", "covers")})</span>
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0 sm:pt-1">
              {/* Scrollable on small screens, full grid on desktop */}
              <div className="flex sm:grid sm:grid-cols-13 overflow-x-auto gap-2 sm:gap-1.5 pb-2 sm:pb-0 scrollbar-none text-center">
                {Object.entries(hourlyShiftData.hoursMap).map(([hourStr, covers]) => {
                  const hour = Number(hourStr)
                  const isCurrentHour = currentTime.getHours() === hour
                  const maxCovers = Math.max(...Object.values(hourlyShiftData.hoursMap), 1)
                  const heightPercent = Math.max(12, Math.round((covers / maxCovers) * 100))

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex flex-col items-center justify-between gap-1 p-2 rounded-xl border transition-colors min-w-[56px] sm:min-w-0 flex-1 shrink-0",
                        isCurrentHour
                          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                          : covers > 0
                            ? "bg-muted/30 border-border"
                            : "bg-muted/10 border-border/40 opacity-60",
                      )}
                    >
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {hour}:00
                      </span>
                      <div className="w-full h-10 sm:h-12 flex items-end justify-center py-1">
                        <div
                          className={cn(
                            "w-full max-w-[16px] sm:max-w-[18px] rounded-t-md transition-all duration-300",
                            covers > 0
                              ? isCurrentHour
                                ? "bg-primary"
                                : "bg-primary/60"
                              : "bg-muted",
                          )}
                          style={{ height: `${covers > 0 ? heightPercent : 15}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {covers > 0 ? covers : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ========================================= */}
          {/* 4. Live Today's Run Sheet                 */}
          {/* ========================================= */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="size-4.5 text-primary" />
                    <span>{t("pages.dashboard.runSheetTitle", "Today's Reservation Run Sheet")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t("pages.dashboard.runSheetSubtitle", "Live schedule of today's incoming bookings with 1-click seating and status actions.")}
                  </CardDescription>
                </div>

                {/* Filter Tabs - Touch Friendly Horizontal Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1">
                  {(
                    [
                      { id: "all", label: `${t("pages.dashboard.tabAll", "All")} (${todaysReservations.length})` },
                      { id: "next2h", label: `${t("pages.dashboard.tabNext2h", "Next 2h")} (${arrivingNext2Hours.length})` },
                      { id: "seated", label: t("pages.dashboard.tabSeated", "Seated") },
                      { id: "confirmed", label: t("pages.dashboard.tabConfirmed", "Confirmed") },
                      { id: "pending", label: t("pages.dashboard.tabPending", "Pending") },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-5 pt-0">
              {filteredRunSheet.length === 0 ? (
                <div className="py-10 sm:py-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="size-12 rounded-2xl bg-muted/30 text-muted-foreground flex items-center justify-center">
                    <CalendarCheck className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">{t("pages.dashboard.noBookingsFound", "No bookings found for this filter")}</p>
                    <p className="text-xs text-muted-foreground">
                      {todaysReservations.length === 0
                        ? t("pages.dashboard.noBookingsToday", "No reservations booked for today yet.")
                        : t("pages.dashboard.noFilterMatch", "No reservations match the selected filter category.")}
                    </p>
                  </div>
                  {todaysReservations.length === 0 && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/reservations")}
                      className="rounded-xl text-xs gap-1.5 mt-2 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>{t("pages.dashboard.createFirstBooking", "Create Today's First Booking")}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-xl sm:rounded-2xl border bg-card overflow-hidden">
                  {filteredRunSheet.map((res) => {
                    const resTime = new Date(res.reservedFor)
                    const timeString = resTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
                    const isUpcomingSoon = Math.abs(resTime.getTime() - currentTime.getTime()) <= 30 * 60 * 1000

                    return (
                      <div
                        key={res.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 transition-colors hover:bg-muted/30",
                          res.status === "CHECKED_IN" && "bg-emerald-500/5",
                        )}
                      >
                        {/* Guest & Timing Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Time Badge */}
                          <div
                            className={cn(
                              "size-10 sm:size-11 rounded-xl flex flex-col items-center justify-center shrink-0 border font-mono leading-none",
                              isUpcomingSoon
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                : "bg-muted/40 border-border text-foreground font-semibold",
                            )}
                          >
                            <span className="text-xs">{timeString.split(":")[0]}</span>
                            <span className="text-[10px] opacity-80">:{timeString.split(":")[1]}</span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                                {res.customer?.name || t("pages.dashboard.guest", "Guest")}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-semibold shrink-0">
                                {t("pages.dashboard.partyOf", "Party of")} {res.partySize}
                              </Badge>
                              {res.table && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                                  {t("pages.dashboard.table", "Table")} {res.table.name}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0 font-semibold shrink-0", statusBadgeStyles[res.status])}
                              >
                                {res.status}
                              </Badge>
                            </div>

                            {/* Contact & Notes Subtitle */}
                            <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-1 flex-wrap">
                              {res.customer?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" />
                                  <span>{res.customer.phone}</span>
                                </span>
                              )}
                              {res.notes && (
                                <span className="text-foreground/80 italic truncate max-w-[240px] sm:max-w-md">
                                  "{res.notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick 1-Click Operations Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
                          {res.status !== "CHECKED_IN" && res.status !== "COMPLETED" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleStatusChange(res.id, "CHECKED_IN")}
                              className="h-8 sm:h-7 px-3 sm:px-2.5 rounded-lg text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                            >
                              <UserCheck className="size-3.5 sm:size-3" />
                              <span>{t("pages.dashboard.actionSeat", "Seat")}</span>
                            </Button>
                          )}

                          {res.status === "CHECKED_IN" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleStatusChange(res.id, "COMPLETED")}
                              className="h-8 sm:h-7 px-3 sm:px-2.5 rounded-lg text-xs font-semibold gap-1 bg-muted hover:bg-muted/80 text-foreground border shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="size-3.5 sm:size-3 text-emerald-500" />
                              <span>{t("pages.dashboard.actionFinish", "Finish")}</span>
                            </Button>
                          )}

                          {res.status === "PENDING" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                              className="h-8 sm:h-7 px-2.5 sm:px-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                            >
                              {t("pages.dashboard.actionConfirm", "Confirm")}
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/reservations")}
                            className="h-8 sm:h-7 px-2.5 sm:px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {t("pages.dashboard.actionDetails", "Details")} →
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex-col sm:flex-row items-center justify-between border-t p-3.5 sm:p-4 bg-muted/10 text-xs gap-2">
              <span className="text-muted-foreground text-center sm:text-left">
                {t("pages.dashboard.showingCount", {
                  filtered: filteredRunSheet.length,
                  total: todaysReservations.length,
                  defaultValue: `Showing ${filteredRunSheet.length} of ${todaysReservations.length} total bookings today`,
                })}
              </span>
              <button
                type="button"
                onClick={() => navigate("/reservations")}
                className="font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t("pages.dashboard.fullCalendar", "Full Reservations Calendar")}</span>
                <ChevronRight className="size-3.5" />
              </button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
}
