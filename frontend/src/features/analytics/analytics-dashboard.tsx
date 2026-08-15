import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import {
  fetchSummary,
  fetchDailyReservations,
  fetchStatusBreakdown,
  fetchHourlyDemand,
  fetchTableUtilization,
  fetchWeekdayTraffic,
  type SummaryMetric,
  type DailyReservations,
  type StatusBreakdown,
  type HourlyDemand,
  type TableUtilization,
  type WeekdayTraffic,
} from "@/features/analytics/analytics-api"
import { AnalyticsSummaryCards } from "@/features/analytics/analytics-summary-cards"
import { ReservationsTrendChart } from "@/features/analytics/reservations-trend-chart"
import { StatusBreakdownChart } from "@/features/analytics/status-breakdown-chart"
import { PeakHoursChart } from "@/features/analytics/peak-hours-chart"
import { TableUtilizationChart } from "@/features/analytics/table-utilization-chart"
import { WeekdayTrafficChart } from "@/features/analytics/weekday-traffic-chart"

const RANGE_OPTIONS = [
  { labelKey: "range7", days: 7 },
  { labelKey: "range14", days: 14 },
  { labelKey: "range30", days: 30 },
] as const

export function AnalyticsDashboard() {
  const { t } = useTranslation()
  const [rangeDays, setRangeDays] = useState<number>(14)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<SummaryMetric[]>([])
  const [dailyReservations, setDailyReservations] = useState<DailyReservations[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([])
  const [hourlyDemand, setHourlyDemand] = useState<HourlyDemand[]>([])
  const [tableUtilization, setTableUtilization] = useState<TableUtilization[]>([])
  const [weekdayTraffic, setWeekdayTraffic] = useState<WeekdayTraffic[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [summary, daily, status, hourly, tables, weekday] = await Promise.all([
          fetchSummary(rangeDays),
          fetchDailyReservations(rangeDays),
          fetchStatusBreakdown(),
          fetchHourlyDemand(rangeDays),
          fetchTableUtilization(rangeDays),
          fetchWeekdayTraffic(rangeDays),
        ])
        if (!active) return
        setMetrics(summary)
        setDailyReservations(daily)
        setStatusBreakdown(status)
        setHourlyDemand(hourly)
        setTableUtilization(tables)
        setWeekdayTraffic(weekday)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [rangeDays])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{t("pages.analytics.loading")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.analytics.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.days}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setRangeDays(option.days)}
              className={cn(
                rangeDays === option.days && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {t(`pages.analytics.${option.labelKey}`)}
            </Button>
          ))}
        </div>
      </div>

      <AnalyticsSummaryCards metrics={metrics} />

      <ReservationsTrendChart data={dailyReservations} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusBreakdownChart data={statusBreakdown} />
        <PeakHoursChart data={hourlyDemand} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TableUtilizationChart data={tableUtilization} />
        <WeekdayTrafficChart data={weekdayTraffic} />
      </div>
    </div>
  )
}
