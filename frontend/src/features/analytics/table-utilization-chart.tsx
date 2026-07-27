import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { TableUtilization } from "@/features/analytics/analytics-data"

interface TableUtilizationChartProps {
  data: TableUtilization[]
}

function colorForUtilization(value: number) {
  if (value >= 80) return "oklch(0.6 0.22 25)" // hot / near-max
  if (value >= 60) return "oklch(0.75 0.15 85)" // moderate
  return "var(--primary)"
}

export function TableUtilizationChart({ data }: TableUtilizationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Utilization</CardTitle>
        <CardDescription>Percentage of service hours each table was occupied</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis type="category" dataKey="table" tickLine={false} axisLine={false} fontSize={12} width={32} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(value) => [`${value}%`, "Utilization"]}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.table} fill={colorForUtilization(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
