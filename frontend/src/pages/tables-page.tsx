import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { apiClient, ApiError, getCurrentRestaurantId } from "@/lib/api-client"

interface ApiTable {
  id: string
  name: string
  capacity: number
  location: string | null
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
}

const statusStyles: Record<ApiTable["status"], "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "default",
  OCCUPIED: "secondary",
  RESERVED: "outline",
  MAINTENANCE: "destructive",
}

export function TablesPage() {
  const { t } = useTranslation()
  const [tables, setTables] = useState<ApiTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const restaurantId = getCurrentRestaurantId()
    if (!restaurantId) {
      Promise.resolve().then(() => {
        if (active) {
          setError(t("pages.tables.noRestaurant"))
          setLoading(false)
        }
      })
      return () => {
        active = false
      }
    }

    apiClient
      .get<ApiTable[]>(`/tables?restaurantId=${encodeURIComponent(restaurantId)}`)
      .then((data) => {
        if (active) setTables(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : t("pages.tables.loadError"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [t])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.tables.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.tables.subtitle")}
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          {t("pages.tables.addTable")}
        </Button>
      </div>

      {loading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("pages.tables.loading")}
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && tables.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">
            {t("pages.tables.empty")}
          </CardContent>
        </Card>
      )}

      {!loading && !error && tables.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>{table.name}</CardTitle>
                  <CardDescription>{table.location ?? t("pages.tables.unassigned")}</CardDescription>
                </div>
                <Badge variant={statusStyles[table.status] ?? "outline"}>{table.status}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t("pages.tables.capacity")} <span className="text-foreground font-medium">{table.capacity}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
