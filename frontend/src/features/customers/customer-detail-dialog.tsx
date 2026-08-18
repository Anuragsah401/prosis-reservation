import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Phone, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { statusLabels, statusColors, type ReservationStatus } from "@/features/reservations-calendar/calendar-data"
import { fetchCustomerReservations, type ApiCustomer, type ApiCustomerReservation } from "./customers-api"

interface CustomerDetailDialogProps {
  customer: ApiCustomer
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (customer: ApiCustomer) => void
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatReservedFor(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
}

/**
 * Shows a customer's full profile plus their recent reservation history
 * (most recent first). History is fetched lazily when the dialog opens so the
 * grid stays snappy and we never pay for a list we aren't viewing.
 */
export function CustomerDetailDialog({ customer, open, onOpenChange, onEdit }: CustomerDetailDialogProps) {
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<ApiCustomerReservation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReservations(null)
    try {
      setReservations(await fetchCustomerReservations(customer.id))
    } catch (err) {
      console.error("[customers] Failed to load history:", err)
      setError(t("pages.customers.detail.historyError"))
    } finally {
      setLoading(false)
    }
  }, [customer.id, t])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadHistory()
    })
    return () => {
      cancelled = true
    }
  }, [open, loadHistory])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(customer.name)}</AvatarFallback>
            </Avatar>
            <span>{customer.name}</span>
          </DialogTitle>
          <DialogDescription>
            <div className="mt-1 flex flex-col gap-1">
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customer.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {customer.notes && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="text-muted-foreground mb-1 text-xs font-medium">{t("pages.customers.dialog.notes")}</p>
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium">{t("pages.customers.detail.history")}</h3>
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t("pages.customers.detail.loadingHistory")}
            </div>
          )}
          {!loading && error && <p className="text-destructive py-2 text-sm">{error}</p>}
          {!loading && !error && reservations && reservations.length === 0 && (
            <p className="text-muted-foreground py-2 text-sm">{t("pages.customers.detail.noHistory")}</p>
          )}
          {!loading && !error && reservations && reservations.length > 0 && (
            <ul className="flex flex-col gap-2">
              {reservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatReservedFor(r.reservedFor)}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("pages.customers.detail.partyOf", { count: r.partySize })}
                      {r.table ? ` · ${r.table.name}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: statusColors[r.status as ReservationStatus]?.border,
                      color: statusColors[r.status as ReservationStatus]?.text,
                    }}
                  >
                    {statusLabels[r.status as ReservationStatus]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("pages.customers.cancel")}
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => onEdit(customer)}>
            {t("pages.customers.detail.edit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
