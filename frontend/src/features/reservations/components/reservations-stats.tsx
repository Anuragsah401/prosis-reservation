import { useTranslation } from "react-i18next"
import { Users, CheckCircle2, AlertCircle, UtensilsCrossed } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:gap-3">
      {/* 1. Total Guests & Bookings */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-primary/[0.03] transition-all hover:border-primary/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.totalBookings", "Total Guests")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {totalCovers}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.totalCovers", "{{count}} covers", { count: totalCovers })}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
            <span className="truncate">{t("pages.reservations.resultCount", { count: totalBookings })}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Confirmed & Seated (Arrivals) */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-emerald-500/[0.03] transition-all hover:border-emerald-500/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.confirmed", "Confirmed / Seated")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {confirmedCount + seatedCount}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              ({seatedCount} {t("pages.reservations.stats.seated", "seated")})
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {arrivalRate}% {t("pages.reservations.stats.arrivalRate", "arrival rate")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Pending Action Required */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-amber-500/[0.03] transition-all hover:border-amber-500/40 hover:shadow-xs">
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", pendingCount > 0 ? "bg-amber-500" : "bg-border")} />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.pending", "Pending Action")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                {t("pages.reservations.stats.actionRequired", "Needs review")}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {pendingCount === 0 && t("pages.reservations.stats.allReviewed", "All reviewed")}
          </div>
        </CardContent>
      </Card>

      {/* 4. Tables Assigned */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-purple-500/[0.03] transition-all hover:border-purple-500/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.reservations.stats.tablesBooked", "Tables Booked")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UtensilsCrossed className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {uniqueTables}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.reservations.stats.tables", "tables")}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {unassignedCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {unassignedCount} {t("pages.reservations.unassigned", "unassigned")}
              </span>
            ) : (
              <span>{t("pages.reservations.stats.allAssigned", "All assigned")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
