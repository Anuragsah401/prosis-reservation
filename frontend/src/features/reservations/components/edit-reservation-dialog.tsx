import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { LET_CUSTOMER_CHOOSE } from "./new-reservation-dialog"
import { toDateInputValue, useTableOptions } from "../reservations-utils"
import {
  updateCustomerOnServer,
  updateReservationOnServer,
  type UpdateReservationChanges,
} from "../reservations-api"

interface EditReservationDialogProps {
  reservation: CalendarReservation
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updated: CalendarReservation) => void
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/**
 * Edits the staff-editable fields of an existing reservation (guest contact
 * details, date/time, party size, table, notes). Guest contact info is
 * persisted to the shared customer record, so it stays consistent across all
 * of that guest's reservations.
 *
 * The dialog performs its own save and only calls `onSave` once the server
 * confirms the change, so a failed save keeps the dialog open with an error
 * instead of silently dropping the edit.
 */
export function EditReservationDialog({ reservation, open, onOpenChange, onSave }: EditReservationDialogProps) {
  const { t } = useTranslation()
  const tableOptions = useTableOptions()
  // The dialog is mounted fresh each time it opens (the parent renders it only
  // while a reservation is being edited), so lazy initialization from the
  // reservation gives a clean form per edit without an effect.
  const [date, setDate] = useState(() => toDateInputValue(new Date(reservation.start)))
  const [time, setTime] = useState(() => toTimeInputValue(reservation.start))
  const [partySize, setPartySize] = useState(() => String(reservation.partySize))
  const [tableId, setTableId] = useState<string>(() => reservation.tableId || LET_CUSTOMER_CHOOSE)
  const [notes, setNotes] = useState(() => reservation.notes ?? "")
  const [customerName, setCustomerName] = useState(() => reservation.customerName)
  const [customerEmail, setCustomerEmail] = useState(() => reservation.customerEmail ?? "")
  const [customerPhone, setCustomerPhone] = useState(() => reservation.customerPhone)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // The reservation's currently assigned table, shown even when it isn't in
  // the floor-plan list (e.g. it was created from another browser, so the
  // name comes from the reservation itself rather than localStorage).
  const currentTable = useMemo(() => {
    if (!reservation.tableId) return null
    return {
      id: reservation.tableId,
      name: reservation.tableName ?? "Table",
      floor: "",
      capacity: reservation.partySize,
    }
  }, [reservation.tableId, reservation.tableName, reservation.partySize])

  // "Let the customer choose" is only offered while the reservation is still
  // unassigned — the backend's update endpoint can't unassign a table, so an
  // already-seated reservation can be moved to another table but not back to
  // "no table".
  const canChooseLater = !reservation.tableId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!date || !time) {
      setError(t("pages.reservations.editDialog.errorRequired"))
      return
    }
    const party = Number(partySize)
    if (!Number.isFinite(party) || party < 1) {
      setError(t("pages.reservations.newDialog.errorPartySize"))
      return
    }
    const trimmedName = customerName.trim()
    if (!trimmedName) {
      setError(t("pages.reservations.editDialog.errorCustomerName"))
      return
    }

    const [hour, minute] = time.split(":").map(Number)
    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)

    // Guest contact edits live on the shared customer record. Write them
    // first so a failure leaves nothing half-applied; if the reservation
    // write then fails, the dialog stays open and the next reload resyncs
    // from the server.
    if (reservation.customerId) {
      const customerChanges: { name?: string; email?: string | null; phone?: string | null } = {}
      const email = customerEmail.trim().toLowerCase() || null
      const phone = customerPhone.trim() || null
      if (trimmedName !== reservation.customerName) customerChanges.name = trimmedName
      if (email !== (reservation.customerEmail?.toLowerCase() ?? null)) customerChanges.email = email
      if (phone !== (reservation.customerPhone?.trim() || null)) customerChanges.phone = phone

      if (Object.keys(customerChanges).length > 0) {
        setIsSaving(true)
        setError(null)
        try {
          await updateCustomerOnServer(reservation.customerId, customerChanges)
        } catch (err) {
          console.error("[reservations] Failed to update customer:", err)
          setError(err instanceof Error ? err.message : t("pages.reservations.editDialog.errorSave"))
          return
        } finally {
          setIsSaving(false)
        }
      }
    }

    const changes: UpdateReservationChanges = {
      start: start.toISOString(),
      partySize: party,
      notes: notes.trim() || undefined,
    }
    let nextTableName: string | undefined
    if (tableId !== LET_CUSTOMER_CHOOSE) {
      nextTableName =
        tableOptions.find((t) => t.id === tableId)?.name ?? currentTable?.name ?? reservation.tableName
      // Only reassign when a different table was picked, so an untouched
      // assignment keeps the current table.
      if (tableId !== reservation.tableId) changes.tableId = tableId
    }

    setIsSaving(true)
    setError(null)
    try {
      await updateReservationOnServer(reservation.id, changes)
    } catch (err) {
      console.error("[reservations] Failed to update reservation:", err)
      setError(err instanceof Error ? err.message : t("pages.reservations.editDialog.errorSave"))
      return
    } finally {
      setIsSaving(false)
    }

    onSave({
      ...reservation,
      customerName: trimmedName,
      customerEmail: customerEmail.trim().toLowerCase() || undefined,
      customerPhone: customerPhone.trim() || "",
      start: start.toISOString(),
      partySize: party,
      tableId: tableId === LET_CUSTOMER_CHOOSE ? "" : tableId,
      tableName: nextTableName,
      notes: notes.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.editDialog.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.editDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-res-customer-name">{t("pages.reservations.newDialog.customerName")}</Label>
              <Input
                id="edit-res-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-customer-email">{t("pages.reservations.newDialog.email")}</Label>
                <Input
                  id="edit-res-customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-customer-phone">{t("pages.reservations.newDialog.phone")}</Label>
                <PhoneInput
                  id="edit-res-customer-phone"
                  value={customerPhone}
                  onChange={(value) => setCustomerPhone(value ?? "")}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-res-date">{t("pages.reservations.newDialog.date")}</Label>
              <Input id="edit-res-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-res-time">{t("pages.reservations.newDialog.time")}</Label>
              <Input id="edit-res-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-res-party">{t("pages.reservations.newDialog.partySize")}</Label>
            <Input
              id="edit-res-party"
              type="number"
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-res-table">{t("pages.reservations.newDialog.table")}</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger id="edit-res-table" className="w-full">
                <SelectValue placeholder={t("pages.reservations.newDialog.selectTable")} />
              </SelectTrigger>
              <SelectContent>
                {canChooseLater && (
                  <SelectItem value={LET_CUSTOMER_CHOOSE}>
                    {t("pages.reservations.newDialog.letCustomerChoose")}
                  </SelectItem>
                )}
                {tableOptions.map((t2) => (
                  <SelectItem key={t2.id} value={t2.id}>
                    {t2.floor} · {t("pages.reservations.colTable")} {t2.name} ({t2.capacity}{" "}
                    {t("pages.reservations.newDialog.seats")})
                  </SelectItem>
                ))}
                {currentTable && !tableOptions.some((t2) => t2.id === currentTable.id) && (
                  <SelectItem value={currentTable.id}>
                    {t("pages.reservations.colTable")} {currentTable.name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-res-notes">
              {t("pages.reservations.editDialog.notes")}{" "}
              <span className="text-muted-foreground font-normal">{t("pages.reservations.newDialog.optional")}</span>
            </Label>
            <Textarea
              id="edit-res-notes"
              rows={2}
              placeholder={t("pages.reservations.editDialog.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("pages.reservations.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("pages.reservations.newDialog.saving") : t("pages.reservations.editDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
