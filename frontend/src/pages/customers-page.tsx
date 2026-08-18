import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Search, Phone, Loader2, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { CustomerDialog } from "@/features/customers/customer-dialog"
import { DeleteCustomerDialog } from "@/features/customers/delete-customer-dialog"
import { CustomerDetailDialog } from "@/features/customers/customer-detail-dialog"
import {
  fetchCustomers,
  type ApiCustomer,
} from "@/features/customers/customers-api"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * The customer relationship database. Lists the restaurant's customers, with
 * search plus add/edit/delete and a detail view that shows reservation
 * history. All mutations go through the shared dialogs, which own the server
 * call and report back once the change has persisted.
 */
export function CustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<ApiCustomer | null>(null)
  const [viewing, setViewing] = useState<ApiCustomer | null>(null)
  const [deleting, setDeleting] = useState<ApiCustomer | null>(null)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCustomers(await fetchCustomers())
    } catch (err) {
      console.error("[customers] Failed to load customers:", err)
      setError(t("pages.customers.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadCustomers()
    })
    return () => {
      cancelled = true
    }
  }, [loadCustomers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        c.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [customers, search])

  function handleSaved(saved: ApiCustomer) {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx === -1) return [saved, ...prev]
      const next = [...prev]
      next[idx] = saved
      return next
    })
    setViewing((cur) => (cur && cur.id === saved.id ? saved : cur))
    setEditing(null)
  }

  function handleDeleted(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("pages.customers.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.customers.subtitle")}
          </p>
        </div>
        <Button onClick={() => setEditing({} as ApiCustomer)}>
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
          <CardContent className="text-muted-foreground flex items-center justify-between gap-3 py-6 text-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadCustomers()}
              className="font-medium underline underline-offset-4"
            >
              {t("pages.customers.retry")}
            </button>
          </CardContent>
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
              <CardContent className="flex flex-col gap-3">
                <button
                  type="button"
                  className="flex min-w-0 items-start gap-3 text-left"
                  onClick={() => setViewing(c)}
                >
                  <Avatar>
                    <AvatarFallback>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{c.name}</p>
                      {c.tags.length > 0 && (
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          {c.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {c.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{c.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {c.email && <p className="text-muted-foreground truncate text-xs">{c.email}</p>}
                    {c.phone && (
                      <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                        <Phone className="size-3" />
                        {c.phone}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewing(c)}
                    }
                    aria-label={t("pages.customers.viewHistory")}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-green-600 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditing(c)}
                    }
                    aria-label={t("pages.customers.editAction")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleting(c)}
                    }
                    aria-label={t("pages.customers.deleteAction")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing !== null && (
        <CustomerDialog
          customer={editing.id ? editing : null}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {viewing !== null && (
        <CustomerDetailDialog
          customer={viewing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setViewing(null)
          }}
          onEdit={(c) => {
            setViewing(null)
            setEditing(c)
          }}
        />
      )}

      {deleting !== null && (
        <DeleteCustomerDialog
          customer={deleting}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
