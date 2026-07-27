// Mock analytics data — stand-in for future aggregate endpoints such as
// `GET /api/analytics/reservations?range=30d`. Once those exist, swap the
// functions below for real fetches without changing consumer shapes.

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

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function getDailyReservations(days = 14): DailyReservations[] {
  const result: DailyReservations[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const seed = d.getDate() + d.getMonth() * 31
    const reservations = Math.round(10 + seededRandom(seed) * 25)
    result.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reservations,
      covers: Math.round(reservations * (2.2 + seededRandom(seed + 1) * 1.4)),
    })
  }
  return result
}

export const statusBreakdown: StatusBreakdown[] = [
  { status: "CONFIRMED", count: 142 },
  { status: "COMPLETED", count: 268 },
  { status: "PENDING", count: 34 },
  { status: "CANCELLED", count: 21 },
  { status: "NO_SHOW", count: 9 },
]

export const hourlyDemand: HourlyDemand[] = [
  { hour: "11 AM", reservations: 4 },
  { hour: "12 PM", reservations: 12 },
  { hour: "1 PM", reservations: 18 },
  { hour: "2 PM", reservations: 9 },
  { hour: "3 PM", reservations: 3 },
  { hour: "4 PM", reservations: 2 },
  { hour: "5 PM", reservations: 6 },
  { hour: "6 PM", reservations: 22 },
  { hour: "7 PM", reservations: 34 },
  { hour: "8 PM", reservations: 29 },
  { hour: "9 PM", reservations: 15 },
  { hour: "10 PM", reservations: 5 },
]

export const tableUtilization: TableUtilization[] = [
  { table: "T1", utilization: 82 },
  { table: "T2", utilization: 64 },
  { table: "T3", utilization: 91 },
  { table: "T4", utilization: 47 },
  { table: "T5", utilization: 73 },
  { table: "T6", utilization: 38 },
]

export const weekdayTraffic: WeekdayTraffic[] = [
  { day: "Mon", reservations: 18 },
  { day: "Tue", reservations: 22 },
  { day: "Wed", reservations: 25 },
  { day: "Thu", reservations: 31 },
  { day: "Fri", reservations: 52 },
  { day: "Sat", reservations: 61 },
  { day: "Sun", reservations: 44 },
]

export interface SummaryMetric {
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

export const summaryMetrics: SummaryMetric[] = [
  { label: "Total Reservations", value: "474", change: "+8.2%", trend: "up" },
  { label: "Total Covers", value: "1,312", change: "+5.6%", trend: "up" },
  { label: "Avg. Party Size", value: "2.8", change: "+0.3", trend: "up" },
  { label: "No-show Rate", value: "1.9%", change: "-0.4%", trend: "down" },
]
