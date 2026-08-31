import { useTranslation } from "react-i18next"
import { Users, CheckCircle2, AlertCircle, UtensilsCrossed } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"

interface ReservationsStatsProps {
  reservations: CalendarReservation[]
}

export function ReservationsStats({ reservations }: ReservationsStatsProps) {
  const { t } = useTranslation()

  const totalBookings = reservations.length
  const totalCovers = reservations.reduce((sum, r) => sum + (r.partySize || 0), 0)
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length
  const seatedCount = reservations.filter((r) => r.status === "CHECKED_IN").length
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length
  const activeBookings = reservations.filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW").length
  const arrivalRate =
    activeBookings > 0
      ? Math.round(
          ((seatedCount + reservations.filter((r) => r.status === "COMPLETED").length) / activeBookings) *
            100,
        )
      : 0
  const uniqueTables = new Set(
    reservations
      .filter((r) => r.tableName && r.status !== "CANCELLED" && r.status !== "NO_SHOW")
      .map((r) => r.tableName),
  ).size
  const unassignedCount = reservations.filter((r) => !r.tableName && r.status !== "CANCELLED").length

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      {/* 1. Total Covers & Bookings */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-2.5 sm:p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.totalBookings", "Total Guests")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {totalCovers}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.totalCovers", "{{count}} covers", { count: totalCovers })}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-xs truncate">
            {t("pages.reservations.resultCount", { count: totalBookings })}
          </p>
        </CardContent>
      </Card>

      {/* 2. Confirmed & Seated (Arrivals) */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-2.5 sm:p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.confirmed", "Confirmed / Seated")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {confirmedCount + seatedCount}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              ({seatedCount} {t("pages.reservations.stats.seated", "seated")})
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-xs truncate">
            {arrivalRate}% {t("pages.reservations.stats.arrivalRate", "arrival rate")}
          </p>
        </CardContent>
      </Card>

      {/* 3. Pending Action Required */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-2.5 sm:p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.pending", "Pending Action")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex size-1.5 sm:size-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-xs truncate">
            {pendingCount > 0
              ? t("pages.reservations.stats.actionRequired", "Needs review")
              : t("pages.reservations.stats.allReviewed", "All reviewed")}
          </p>
        </CardContent>
      </Card>

      {/* 4. Tables Assigned */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-2.5 sm:p-3.5 md:p-4">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.tablesBooked", "Tables Booked")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UtensilsCrossed className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {uniqueTables}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.tables", "tables")}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[10px] sm:text-xs truncate">
            {unassignedCount > 0
              ? `${unassignedCount} ${t("pages.reservations.unassigned", "unassigned")}`
              : t("pages.reservations.stats.allAssigned", "All assigned")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
