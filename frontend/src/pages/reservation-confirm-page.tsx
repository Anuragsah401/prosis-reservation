import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CalendarCheck, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { FloorPlanViewer, type FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"
import { API_URL } from "@/lib/config"

interface ConfirmationDetails {
  reservation: {
    id: string
    customerName: string
    restaurantName: string
    reservedFor: string
    partySize: number
    status: string
    confirmedAt: string | null
    table: { id: string; name: string; floor: string } | null
  }
  tables: FloorPlanViewerTable[]
}

async function fetchDetails(token: string): Promise<ConfirmationDetails> {
  const res = await fetch(`${API_URL}/reservations/confirmation?token=${encodeURIComponent(token)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Something went wrong")
  return data as ConfirmationDetails
}

async function confirmReservation(token: string, tableId?: string) {
  const res = await fetch(`${API_URL}/reservations/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, tableId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Something went wrong")
  return data
}

export function ReservationConfirmPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [details, setDetails] = useState<ConfirmationDetails | null>(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [loadError, setLoadError] = useState<string | null>(
    token ? null : t("reservationConfirm.errorMissingToken"),
  )
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchDetails(token)
      .then((d) => {
        setDetails(d)
        setSelectedTableId(d.reservation.table?.id ?? null)
        if (d.reservation.confirmedAt) setConfirmed(true)
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : t("reservationConfirm.errorGeneric"))
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function handleConfirm() {
    setSubmitError(null)
    setSubmitting(true)
    confirmReservation(token, selectedTableId ?? undefined)
      .then(() => setConfirmed(true))
      .catch((err: unknown) => {
        setSubmitError(err instanceof Error ? err.message : t("reservationConfirm.errorGeneric"))
      })
      .finally(() => setSubmitting(false))
  }

  const reservation = details?.reservation

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
              PT
            </span>
            <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-muted-foreground text-sm">{t("reservationConfirm.loading")}</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <h1 className="text-xl font-semibold tracking-tight">
                  {t("reservationConfirm.errorTitle")}
                </h1>
                <p className="text-destructive text-sm">{loadError}</p>
              </div>
            ) : confirmed ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
                  <CalendarCheck className="size-6" />
                </span>
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {t("reservationConfirm.confirmedTitle")}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {t("reservationConfirm.confirmedSubtitle", {
                      restaurant: reservation?.restaurantName,
                    })}
                  </p>
                </div>
              </div>
            ) : reservation ? (
              <>
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {t("reservationConfirm.title", { name: reservation.customerName })}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {t("reservationConfirm.subtitle", { restaurant: reservation.restaurantName })}
                  </p>
                </div>

                <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("reservationConfirm.dateTime")}</span>
                    <span className="font-medium">
                      {new Date(reservation.reservedFor).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("reservationConfirm.partySize")}</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="size-3.5" />
                      {reservation.partySize}
                    </span>
                  </div>
                </div>

                {details && details.tables.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <h2 className="text-sm font-medium">{t("reservationConfirm.chooseTable")}</h2>
                      <p className="text-muted-foreground text-xs">
                        {t("reservationConfirm.chooseTableHint")}
                      </p>
                    </div>
                    <FloorPlanViewer
                      tables={details.tables}
                      selectedTableId={selectedTableId}
                      currentTableId={reservation.table?.id ?? null}
                      onSelect={setSelectedTableId}
                      seatsLabel={t("reservationConfirm.seats")}
                    />
                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-card inline-block size-3 rounded-sm border-2 border-emerald-500/60" />
                        {t("reservationConfirm.legendAvailable")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="bg-muted inline-block size-3 rounded-sm border-2 opacity-40" />
                        {t("reservationConfirm.legendUnavailable")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="border-primary bg-primary/10 inline-block size-3 rounded-sm border-2" />
                        {t("reservationConfirm.legendSelected")}
                      </span>
                    </div>
                    {selectedTableId === null && (
                      <Badge variant="secondary" className="self-start">
                        {t("reservationConfirm.noTableSelected")}
                      </Badge>
                    )}
                  </div>
                )}

                {submitError && <p className="text-destructive text-sm">{submitError}</p>}

                <Button className="w-full" onClick={handleConfirm} disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {t("reservationConfirm.confirm")}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
