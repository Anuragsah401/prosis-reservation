import { useState } from "react"
import { useTranslation } from "react-i18next"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { usePersistedFormState } from "@/hooks/use-form-persistence"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { createReservationOnServer } from "../reservations-api"
import { useTableOptions } from "../reservations-utils"

interface WalkInDialogProps {
  onCreate: (reservation: CalendarReservation) => void
}

export function WalkInDialog({ onCreate }: WalkInDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const tableOptions = useTableOptions()
  const [draft, setDraft, clearDraft] = usePersistedFormState("walkin-form", {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    tableId: tableOptions[0]?.id ?? "",
    partySize: "2",
  })
  const { customerName, customerPhone, customerEmail, tableId, partySize } = draft
  const setCustomerName = (v: string) => setDraft((d) => ({ ...d, customerName: v }))
  const setCustomerPhone = (v: string) => setDraft((d) => ({ ...d, customerPhone: v }))
  const setCustomerEmail = (v: string) => setDraft((d) => ({ ...d, customerEmail: v }))
  const setTableId = (v: string) => setDraft((d) => ({ ...d, tableId: v }))
  const setPartySize = (v: string) => setDraft((d) => ({ ...d, partySize: v }))
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setDraft({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      tableId: tableOptions[0]?.id ?? "",
      partySize: "2",
    })
    clearDraft()
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerName.trim() || !tableId) {
      setError(t("pages.reservations.walkInDialog.errorRequired"))
      return
    }
    const party = Number(partySize)
    if (!Number.isFinite(party) || party < 1) {
      setError(t("pages.reservations.walkInDialog.errorPartySize"))
      return
    }

    // Persist the walk-in so it survives a refresh and the table flips to
    // Occupied on the floor plan. `status: "CHECKED_IN"` seats the guest
    // immediately, which also skips the confirmation email on the backend.
    // Only close the dialog once the server confirms the booking — a failed
    // save keeps the form open with the error instead of silently losing a
    // guest who's already at the door.
    setIsSubmitting(true)
    setError(null)
    createReservationOnServer({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      partySize: party,
      reservedFor: new Date().toISOString(),
      tableId,
      notes: "Walk-in",
      status: "CHECKED_IN",
    })
      .then((created) => {
        onCreate(created)
        resetForm()
        setOpen(false)
      })
      .catch((err) => {
        console.error("[reservations] Failed to create walk-in:", err)
        setError(err instanceof Error ? err.message : t("pages.reservations.walkInDialog.errorSave"))
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex-1 sm:flex-initial">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">{t("pages.reservations.walkIn")}</span>
          <span className="sm:hidden">{t("pages.reservations.walkInShort")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.walkInDialog.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.walkInDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-name">{t("pages.reservations.walkInDialog.customerName")}</Label>
            <Input
              id="walkin-name"
              placeholder={t("pages.reservations.walkInDialog.namePlaceholder")}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-phone">{t("pages.reservations.walkInDialog.phoneOptional")}</Label>
            <PhoneInput
              id="walkin-phone"
              placeholder="555 123 4567"
              value={customerPhone}
              onChange={(value) => setCustomerPhone(value ?? "")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walkin-email">
              {t("pages.reservations.newDialog.email")}{" "}
              <span className="text-muted-foreground font-normal">{t("pages.reservations.newDialog.optional")}</span>
            </Label>
            <Input
              id="walkin-email"
              type="email"
              placeholder="guest@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="walkin-party">{t("pages.reservations.walkInDialog.partySize")}</Label>
              <Input
                id="walkin-party"
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("pages.reservations.walkInDialog.table")}</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("pages.reservations.walkInDialog.selectTable")} />
                </SelectTrigger>
                <SelectContent>
                  {tableOptions.map((t2) => (
                    <SelectItem key={t2.id} value={t2.id}>
                      {t2.floor} · {t("pages.reservations.colTable")} {t2.name} ({t2.capacity}{" "}
                      {t("pages.reservations.walkInDialog.seats")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("pages.reservations.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("pages.reservations.newDialog.saving")
                : t("pages.reservations.walkInDialog.seat")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
