import { Plus, Search, Phone, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient, ApiError, getCurrentRestaurantId } from "@/lib/api-client"

interface ApiCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  tags: string[]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function CustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let active = true
    const restaurantId = getCurrentRestaurantId()
    if (!restaurantId) {
      Promise.resolve().then(() => {
        if (active) {
          setError(t("pages.customers.noRestaurant"))
          setLoading(false)
        }
      })
      return () => {
        active = false
      }
    }

    apiClient
      .get<ApiCustomer[]>(`/customers?restaurantId=${encodeURIComponent(restaurantId)}`)
      .then((data) => {
        if (active) setCustomers(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : t("pages.customers.loadError"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [t])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    )
  }, [customers, search])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.customers.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.customers.subtitle")}
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          {t("pages.customers.addCustomer")}
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder={t("pages.customers.searchPlaceholder")}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("pages.customers.loading")}
        </div>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-6 text-sm">
            {customers.length === 0
              ? t("pages.customers.empty")
              : t("pages.customers.noMatch")}
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.email && <p className="text-muted-foreground truncate text-xs">{c.email}</p>}
                  {c.phone && (
                    <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                      <Phone className="size-3" />
                      {c.phone}
                    </p>
                  )}
                  {c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {c.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}