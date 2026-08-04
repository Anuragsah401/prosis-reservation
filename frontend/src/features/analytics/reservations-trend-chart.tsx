import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { DailyReservations } from "@/features/analytics/analytics-data"

interface ReservationsTrendChartProps {
  data: DailyReservations[]
}

export function ReservationsTrendChart({ data }: ReservationsTrendChartProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.analytics.reservationsTrend")}</CardTitle>
        <CardDescription>{t("pages.analytics.reservationsTrendDesc", { count: data.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fillReservations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillCovers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.708 0.19 260)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="oklch(0.708 0.19 260)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="covers"
              stroke="oklch(0.708 0.19 260)"
              fill="url(#fillCovers)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="reservations"
              stroke="var(--primary)"
              fill="url(#fillReservations)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
