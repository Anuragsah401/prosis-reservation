import { CalendarCheck, UtensilsCrossed, Users, TrendingUp } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const stats = [
  { label: "Today's Reservations", value: "24", icon: CalendarCheck, change: "+12%" },
  { label: "Tables Occupied", value: "8 / 14", icon: UtensilsCrossed, change: "57%" },
  { label: "Total Customers", value: "1,204", icon: Users, change: "+3.2%" },
  { label: "Avg. Turnover", value: "1h 24m", icon: TrendingUp, change: "-4%" },
]

const upcoming = [
  { name: "Alicia Ford", time: "7:00 PM", party: 4, table: "T4", status: "CONFIRMED" },
  { name: "Marcus Lee", time: "7:30 PM", party: 2, table: "T7", status: "PENDING" },
  { name: "Priya Nair", time: "8:00 PM", party: 6, table: "T2", status: "CONFIRMED" },
  { name: "Diego Alvarez", time: "8:15 PM", party: 3, table: "T9", status: "PENDING" },
]

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "secondary",
}

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of today&apos;s activity across your restaurant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">{stat.change} from last week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reservations</CardTitle>
          <CardDescription>Next bookings coming in today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {upcoming.map((r) => (
            <div
              key={`${r.name}-${r.time}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-muted-foreground text-xs">
                  {r.time} &middot; Party of {r.party} &middot; Table {r.table}
                </p>
              </div>
              <Badge variant={statusVariant[r.status] ?? "outline"}>{r.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
