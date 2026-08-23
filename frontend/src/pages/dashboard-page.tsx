import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CalendarCheck, UtensilsCrossed, Users, Loader2 } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient, ApiError, getCurrentRestaurantId } from "@/lib/api-client"

interface ApiTable {
  id: string
  name: string
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
}

interface ApiCustomer {
  id: string
}

interface ApiReservation {
  id: string
  partySize: number
  reservedFor: string
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  table?: { name: string } | null
  customer?: { name: string } | null
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  CONFIRMED: "default",
  PENDING: "secondary",
  CHECKED_IN: "outline",
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [tables, setTables] = useState<ApiTable[]>([])
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [reservations, setReservations] = useState<ApiReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const restaurantId = getCurrentRestaurantId()
    if (!restaurantId) {
      Promise.resolve().then(() => {
        if (active) {
          setError(t("pages.dashboard.noRestaurant"))
          setLoading(false)
        }
      })
      return () => {
        active = false
      }
    }

    const qs = `restaurantId=${encodeURIComponent(restaurantId)}`
    Promise.all([
      apiClient.get<ApiTable[]>(`/tables?${qs}`),
      apiClient.get<ApiCustomer[]>(`/customers?${qs}`),
      apiClient.get<ApiReservation[]>(`/reservations?${qs}`),
    ])
      .then(([tablesRes, customersRes, reservationsRes]) => {
        if (!active) return
        setTables(tablesRes)
        setCustomers(customersRes)
        setReservations(reservationsRes)
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : t("pages.dashboard.loadError"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [t])

  const todaysReservations = useMemo(() => {
    const today = new Date()
    return reservations.filter((r) => isSameDay(new Date(r.reservedFor), today))
  }, [reservations])

  const occupiedTables = useMemo(() => tables.filter((t) => t.status === "OCCUPIED").length, [tables])

  const upcoming = useMemo(() => {
    return [...todaysReservations]
      .sort((a, b) => new Date(a.reservedFor).getTime() - new Date(b.reservedFor).getTime())
      .slice(0, 6)
  }, [todaysReservations])

  const stats = [
    { label: t("pages.dashboard.statTodaysReservations"), value: String(todaysReservations.length), icon: CalendarCheck },
    { label: t("pages.dashboard.statTablesOccupied"), value: `${occupiedTables} / ${tables.length}`, icon: UtensilsCrossed },
    { label: t("pages.dashboard.statTotalCustomers"), value: String(customers.length), icon: Users },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pages.dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("pages.dashboard.subtitle")}</p>
      </div>

      {loading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("pages.dashboard.loading")}
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("pages.dashboard.upcomingTitle")}</CardTitle>
              <CardDescription>{t("pages.dashboard.upcomingSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcoming.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("pages.dashboard.noUpcoming")}</p>
              )}
              {upcoming.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{r.customer?.name ?? t("pages.dashboard.guest")}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(r.reservedFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      {" \u00b7 "}{t("pages.dashboard.partyOf")} {r.partySize}
                      {r.table ? ` \u00b7 ${t("pages.dashboard.table")} ${r.table.name}` : ""}
                    </p>
                  </div>
                  <Badge variant={statusVariant[r.status] ?? "outline"}>{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
