import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useTranslation } from "react-i18next"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { StatusBreakdown } from "@/features/analytics/analytics-data"

interface StatusBreakdownChartProps {
  data: StatusBreakdown[]
}

const COLORS: Record<string, string> = {
  CONFIRMED: "oklch(0.55 0.18 260)",
  COMPLETED: "oklch(0.65 0.15 165)",
  PENDING: "oklch(0.75 0.15 85)",
  CANCELLED: "oklch(0.6 0.22 25)",
  NO_SHOW: "oklch(0.5 0.02 0)",
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.analytics.statusBreakdown")}</CardTitle>
        <CardDescription>{t("pages.analytics.statusBreakdownDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={COLORS[entry.status] ?? "var(--muted-foreground)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => value.replace("_", " ")}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
