import { prisma } from "@/db/client"
import type { ReservationStatus } from "@prisma/client"

// How far back to look for "recent" status counts and trend calculations.
const TREND_WINDOW_DAYS = 30

/**
 * Computes analytics metrics for a restaurant directly from its reservations,
 * tables, and customer records. All queries are scoped by `restaurantId` so
 * tenants never see each other's data.
 *
 * The metrics returned here replace the static mock values the frontend used
 * during early development — they're real aggregations over the live database.
 */
export const analyticsService = {
  /** Summary KPI cards: total reservations, total covers, avg party size,
   * no-show rate, plus period-over-period change for the trend arrows. */
  async getSummary(restaurantId: string, days: number) {
    const rangeEnd = new Date()
    const rangeStart = new Date(rangeEnd.getTime() - days * 24 * 60 * 60 * 1000)
    const prevStart = new Date(rangeStart.getTime() - days * 24 * 60 * 60 * 1000)

    const [current, previous] = await Promise.all([
      prisma.reservation.findMany({
        where: { restaurantId, reservedFor: { gte: rangeStart, lte: rangeEnd } },
        select: { partySize: true, status: true },
      }),
      prisma.reservation.findMany({
        where: { restaurantId, reservedFor: { gte: prevStart, lte: rangeStart } },
        select: { partySize: true, status: true },
      }),
    ])

    const sumCovers = (rows: { partySize: number; status: ReservationStatus }[]) =>
      rows.reduce((acc, r) => acc + r.partySize, 0)

    const totalReservations = current.length
    const totalCovers = sumCovers(current)
    const avgPartySize = totalReservations ? totalCovers / totalReservations : 0
    const noShows = current.filter((r) => r.status === "NO_SHOW").length
    const noShowRate = totalReservations ? (noShows / totalReservations) * 100 : 0

    // Percentage change vs. the previous equal-length window.
    const pct = (now: number, before: number) =>
      before === 0 ? (now > 0 ? 100 : 0) : ((now - before) / before) * 100

    const resChange = pct(totalReservations, previous.length)
    const coversChange = pct(totalCovers, sumCovers(previous))
    const prevAvg = previous.length ? sumCovers(previous) / previous.length : 0
    const partyChange = prevAvg === 0 ? (avgPartySize > 0 ? 100 : 0) : ((avgPartySize - prevAvg) / prevAvg) * 100
    const prevNoShow = previous.length ? (previous.filter((r) => r.status === "NO_SHOW").length / previous.length) * 100 : 0
    const noShowChange = prevNoShow === 0 ? 0 : noShowRate - prevNoShow

    return {
      totalReservations,
      totalCovers,
      avgPartySize: Math.round(avgPartySize * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      changes: {
        totalReservations: Math.round(resChange * 10) / 10,
        totalCovers: Math.round(coversChange * 10) / 10,
        avgPartySize: Math.round(partyChange * 10) / 10,
        noShowRate: Math.round(noShowChange * 10) / 10,
      },
    }
  },

  /** Reservations & covers per day for the trend line chart. */
  async getDailyReservations(restaurantId: string, days: number) {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const rows = await prisma.reservation.findMany({
      where: { restaurantId, reservedFor: { gte: start, lte: end } },
      select: { reservedFor: true, partySize: true },
      orderBy: { reservedFor: "asc" },
    })

    const byDate = new Map<string, { reservations: number; covers: number }>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      byDate.set(key, { reservations: 0, covers: 0 })
    }

    for (const r of rows) {
      const key = r.reservedFor.toISOString().slice(0, 10)
      const bucket = byDate.get(key)
      if (bucket) {
        bucket.reservations += 1
        bucket.covers += r.partySize
      }
    }

    return Array.from(byDate.entries()).map(([key, val]) => ({
      date: new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      reservations: val.reservations,
      covers: val.covers,
    }))
  },

  /** Count of reservations grouped by current status. */
  async getStatusBreakdown(restaurantId: string) {
    const rows = await prisma.reservation.groupBy({
      by: ["status"],
      where: { restaurantId },
      _count: { _all: true },
    })
    return rows.map((r) => ({ status: r.status, count: r._count._all }))
  },

  /** Reservations per hour-of-day for the peak-hours chart. */
  async getHourlyDemand(restaurantId: string, days: number) {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const rows = await prisma.reservation.findMany({
      where: { restaurantId, reservedFor: { gte: start, lte: end } },
      select: { reservedFor: true },
    })

    const buckets = new Array(24).fill(0)
    for (const r of rows) {
      buckets[r.reservedFor.getHours()] += 1
    }

    return buckets.map((count, hour) => ({
      hour: new Date(2000, 0, 1, hour).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      reservations: count,
    }))
  },

  /** Per-table share of reservations over the trend window (utilization proxy). */
  async getTableUtilization(restaurantId: string, days: number) {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const [tables, reservations] = await Promise.all([
      prisma.table.findMany({
        where: { restaurantId },
        select: { id: true, number: true },
        orderBy: { number: "asc" },
      }),
      prisma.reservation.findMany({
        where: {
          restaurantId,
          tableId: { not: null },
          reservedFor: { gte: start, lte: end },
        },
        select: { tableId: true },
      }),
    ])

    const total = reservations.length || 1
    return tables.map((t) => {
      const used = reservations.filter((r) => r.tableId === t.id).length
      return {
        table: t.number,
        utilization: Math.round((used / total) * 100),
      }
    })
  },

  /** Reservations per weekday for the weekday-traffic chart. */
  async getWeekdayTraffic(restaurantId: string, days: number) {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const rows = await prisma.reservation.findMany({
      where: { restaurantId, reservedFor: { gte: start, lte: end } },
      select: { reservedFor: true },
    })

    const days_ = new Array(7).fill(0)
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for (const r of rows) {
      days_[r.reservedFor.getDay()] += 1
    }

    return labels.map((day, idx) => ({ day, reservations: days_[idx] }))
  },
}
