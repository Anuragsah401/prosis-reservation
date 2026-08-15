import { apiClient } from "@/lib/api-client"

export interface SummaryMetric {
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

export interface SummaryResponse {
  totalReservations: number
  totalCovers: number
  avgPartySize: number
  noShowRate: number
  changes: {
    totalReservations: number
    totalCovers: number
    avgPartySize: number
    noShowRate: number
  }
}

export interface DailyReservations {
  date: string
  reservations: number
  covers: number
}

export interface StatusBreakdown {
  status: string
  count: number
}

export interface HourlyDemand {
  hour: string
  reservations: number
}

export interface TableUtilization {
  table: string
  utilization: number
}

export interface WeekdayTraffic {
  day: string
  reservations: number
}

async function fetchAnalytics<T>(endpoint: string, params: URLSearchParams = new URLSearchParams()): Promise<T> {
  const query = params.toString()
  const suffix = query ? `?${query}` : ""
  return apiClient.get<T>(`/analytics${endpoint}${suffix}`)
}

export async function fetchSummary(days: number): Promise<SummaryMetric[]> {
  const data = await fetchAnalytics<SummaryResponse>("/summary", new URLSearchParams({ days: String(days) }))
  return [
    {
      label: "Total Reservations",
      value: String(data.totalReservations),
      change: `${data.changes.totalReservations >= 0 ? "+" : ""}${data.changes.totalReservations.toFixed(1)}%`,
      trend: data.changes.totalReservations >= 0 ? "up" : "down",
    },
    {
      label: "Total Covers",
      value: data.totalCovers.toLocaleString(),
      change: `${data.changes.totalCovers >= 0 ? "+" : ""}${data.changes.totalCovers.toFixed(1)}%`,
      trend: data.changes.totalCovers >= 0 ? "up" : "down",
    },
    {
      label: "Avg. Party Size",
      value: data.avgPartySize.toFixed(1),
      change: `${data.changes.avgPartySize >= 0 ? "+" : ""}${data.changes.avgPartySize.toFixed(1)}%`,
      trend: data.changes.avgPartySize >= 0 ? "up" : "down",
    },
    {
      label: "No-show Rate",
      value: `${data.noShowRate.toFixed(1)}%`,
      change: `${data.changes.noShowRate >= 0 ? "+" : ""}${data.changes.noShowRate.toFixed(1)}%`,
      // For no-show rate, "down" is good (fewer no-shows)
      trend: data.changes.noShowRate <= 0 ? "up" : "down",
    },
  ]
}

export async function fetchDailyReservations(days: number): Promise<DailyReservations[]> {
  return fetchAnalytics<DailyReservations[]>("/daily-reservations", new URLSearchParams({ days: String(days) }))
}

export async function fetchStatusBreakdown(): Promise<StatusBreakdown[]> {
  return fetchAnalytics<StatusBreakdown[]>("/status-breakdown")
}

export async function fetchHourlyDemand(days: number): Promise<HourlyDemand[]> {
  return fetchAnalytics<HourlyDemand[]>("/hourly-demand", new URLSearchParams({ days: String(days) }))
}

export async function fetchTableUtilization(days: number): Promise<TableUtilization[]> {
  return fetchAnalytics<TableUtilization[]>("/table-utilization", new URLSearchParams({ days: String(days) }))
}

export async function fetchWeekdayTraffic(days: number): Promise<WeekdayTraffic[]> {
  return fetchAnalytics<WeekdayTraffic[]>("/weekday-traffic", new URLSearchParams({ days: String(days) }))
}