import { useTranslation } from "react-i18next"
import { Users, CheckCircle2, AlertCircle, UtensilsCrossed } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CalendarReservation, ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { normalizeStatus } from "../reservations-utils"

interface ReservationsStatsProps {
  reservations: CalendarReservation[]
  activeStatus?: "all" | ReservationStatus
  onSelectStatus?: (status: "all" | ReservationStatus) => void
}

export function ReservationsStats({
  reservations,
  activeStatus,
  onSelectStatus,
}: ReservationsStatsProps) {
  const { t } = useTranslation()

  const totalBookings = reservations.length
  const activeReservations = reservations.filter((r) => {
    const s = normalizeStatus(r.status)
    return s !== "CANCELLED" && s !== "NO_SHOW"
  })
  const totalCovers = reservations.reduce((sum, r) => sum + (r.partySize || 0), 0)
  const confirmedCount = reservations.filter((r) => normalizeStatus(r.status) === "CONFIRMED").length
  const seatedCount = reservations.filter((r) => normalizeStatus(r.status) === "CHECKED_IN").length
  const completedCount = reservations.filter((r) => normalizeStatus(r.status) === "COMPLETED").length
  const pendingCount = reservations.filter((r) => normalizeStatus(r.status) === "PENDING").length
  const activeBookings = activeReservations.length

  const arrivalRate =
    activeBookings > 0
      ? Math.round(((seatedCount + completedCount) / activeBookings) * 100)
      : 0

  const uniqueTables = new Set(
    activeReservations
      .filter((r) => r.tableName || r.tableId)
      .map((r) => r.tableName || r.tableId),
  ).size

  const unassignedCount = activeReservations.filter((r) => !r.tableName && !r.tableId).length

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
      {/* 1. Total Covers & Bookings */}
      <Card
        onClick={() => onSelectStatus?.("all")}
        className={cn(
          "min-w-0 border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm",
          onSelectStatus && "cursor-pointer",
          activeStatus === "all" && onSelectStatus && "ring-1.5 ring-primary/40 border-primary/50",
        )}
      >
        <CardContent className="px-2.5 py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.totalBookings", "Total Guests")}
            </span>
            <div className="flex size-6 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground">
              {totalCovers}
            </span>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.totalCovers", "{{count}} covers", { count: totalCovers })}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px] truncate">
            {t("pages.reservations.resultCount", { count: totalBookings })}
          </p>
        </CardContent>
      </Card>

      {/* 2. Confirmed & Seated (Arrivals) */}
      <Card
        onClick={() => {
          if (!onSelectStatus) return
          if (activeStatus === "CONFIRMED") {
            onSelectStatus("CHECKED_IN")
          } else if (activeStatus === "CHECKED_IN") {
            onSelectStatus("all")
          } else {
            onSelectStatus("CONFIRMED")
          }
        }}
        className={cn(
          "min-w-0 border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm",
          onSelectStatus && "cursor-pointer",
          (activeStatus === "CONFIRMED" || activeStatus === "CHECKED_IN") &&
            onSelectStatus &&
            "ring-1.5 ring-emerald-500/40 border-emerald-500/50",
        )}
      >
        <CardContent className="px-2.5 py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.confirmed", "Confirmed / Seated")}
            </span>
            <div className="flex size-6 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground">
              {confirmedCount + seatedCount}
            </span>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              ({seatedCount} {t("pages.reservations.stats.seated", "seated")})
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px] truncate">
            {arrivalRate}% {t("pages.reservations.stats.arrivalRate", "arrival rate")}
          </p>
        </CardContent>
      </Card>

      {/* 3. Pending Action Required */}
      <Card
        onClick={() => {
          if (!onSelectStatus) return
          onSelectStatus(activeStatus === "PENDING" ? "all" : "PENDING")
        }}
        className={cn(
          "min-w-0 border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm",
          onSelectStatus && "cursor-pointer",
          activeStatus === "PENDING" && onSelectStatus && "ring-1.5 ring-amber-500/40 border-amber-500/50",
        )}
      >
        <CardContent className="px-2.5 py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.pending", "Pending Action")}
            </span>
            <div className="flex size-6 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex size-1.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px] truncate">
            {pendingCount > 0
              ? t("pages.reservations.stats.actionRequired", "Needs review")
              : t("pages.reservations.stats.allReviewed", "All reviewed")}
          </p>
        </CardContent>
      </Card>

      {/* 4. Tables Assigned */}
      <Card className="min-w-0 border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm">
        <CardContent className="px-2.5 py-2 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.tablesBooked", "Tables Booked")}
            </span>
            <div className="flex size-6 sm:size-6.5 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UtensilsCrossed className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground">
              {uniqueTables}
            </span>
            <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.tables", "tables")}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-[11px] truncate">
            {unassignedCount > 0
              ? `${unassignedCount} ${t("pages.reservations.unassigned", "unassigned")}`
              : t("pages.reservations.stats.allAssigned", "All assigned")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
