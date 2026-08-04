import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { HourlyDemand } from "@/features/analytics/analytics-data"

interface PeakHoursChartProps {
  data: HourlyDemand[]
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.analytics.peakHours")}</CardTitle>
        <CardDescription>{t("pages.analytics.peakHoursDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={11} interval={1} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="reservations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
