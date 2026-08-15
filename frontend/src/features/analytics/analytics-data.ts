// Shared type definitions for analytics data shapes.
// Real data is fetched from the backend via `@/features/analytics/analytics-api`.

export interface DailyReservations {
  date: string // "MMM d"
  reservations: number
  covers: number
}

export interface StatusBreakdown {
  status: string
  count: number
}

export interface HourlyDemand {
  hour: string // "6 PM"
  reservations: number
}

export interface TableUtilization {
  table: string
  utilization: number // percentage 0-100
}

export interface WeekdayTraffic {
  day: string
  reservations: number
}

export interface SummaryMetric {
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

