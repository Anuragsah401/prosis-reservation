import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getDailyReservations,
  statusBreakdown,
  hourlyDemand,
  tableUtilization,
  weekdayTraffic,
  summaryMetrics,
} from "@/features/analytics/analytics-data"
import { AnalyticsSummaryCards } from "@/features/analytics/analytics-summary-cards"
import { ReservationsTrendChart } from "@/features/analytics/reservations-trend-chart"
import { StatusBreakdownChart } from "@/features/analytics/status-breakdown-chart"
import { PeakHoursChart } from "@/features/analytics/peak-hours-chart"
import { TableUtilizationChart } from "@/features/analytics/table-utilization-chart"
import { WeekdayTrafficChart } from "@/features/analytics/weekday-traffic-chart"

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const

export function AnalyticsDashboard() {
  const [rangeDays, setRangeDays] = useState<number>(14)
  const dailyReservations = useMemo(() => getDailyReservations(rangeDays), [rangeDays])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics &amp; Statistics</h1>
          <p className="text-muted-foreground text-sm">
            Insights into reservations, table utilization, and customer traffic.
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
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <AnalyticsSummaryCards metrics={summaryMetrics} />

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
