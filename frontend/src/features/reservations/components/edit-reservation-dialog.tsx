import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, LayoutGrid } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { FOOD_CATEGORY_VALUES, EVENT_TYPES } from "../reservations-constants"
import {
  capitalize,
  toDateInputValue,
  useTableOptions,
  parseReservationNotes,
  buildReservationNotes,
  type TableOption,
} from "../reservations-utils"
import {
  updateCustomerOnServer,
  updateReservationOnServer,
  type UpdateReservationChanges,
} from "../reservations-api"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { minutesToTimeString } from "@/features/restaurant/restaurant-api"
import { TablePickerDialog } from "./table-picker-dialog"

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
 * Multi-step wizard dialog for editing an existing reservation.
 * Mirrors the steps, fields, and styling of NewReservationDialog.
 */
export function EditReservationDialog({ reservation, open, onOpenChange, onSave }: EditReservationDialogProps) {
  const { t } = useTranslation()
  const tableOptions = useTableOptions()
  const [step, setStep] = useState(0)

  const parsed = useMemo(() => parseReservationNotes(reservation.notes), [reservation.notes])

  const [date, setDate] = useState(() => toDateInputValue(new Date(reservation.start)))
  const [time, setTime] = useState(() => toTimeInputValue(reservation.start))
  const [partySize, setPartySize] = useState(() => String(reservation.partySize))
  const [durationMinutes, setDurationMinutes] = useState(() =>
    reservation.durationMinutes ? String(reservation.durationMinutes) : "unspecified",
  )
  const [eventType, setEventType] = useState<string>(() => reservation.eventType || parsed.eventType || "unspecified")
  const [foodCategories, setFoodCategories] = useState<string[]>(
    () => reservation.foodCategories || parsed.foodCategories || [],
  )
  const [tableId, setTableId] = useState<string>(() => reservation.tableId || "")
  const [notes, setNotes] = useState(() => parsed.specialRequests || "")
  const [customerName, setCustomerName] = useState(() => reservation.customerName)
  const [customerEmail, setCustomerEmail] = useState(() => reservation.customerEmail ?? "")
  const [customerPhone, setCustomerPhone] = useState(() => reservation.customerPhone)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedTable, setPickedTable] = useState<TableOption | null>(null)

  const toggleFoodCategory = (value: string) =>
    setFoodCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )

  // Currently assigned table
  const currentTable = useMemo(() => {
    if (!reservation.tableId) return null
    return {
      id: reservation.tableId,
      name: reservation.tableName ?? "Table",
      floor: "",
      capacity: reservation.partySize,
    }
  }, [reservation.tableId, reservation.tableName, reservation.partySize])

  const selectedFloorTable =
    tableId
      ? tableOptions.find((t) => t.id === tableId) ?? (pickedTable?.id === tableId ? pickedTable : undefined) ?? currentTable
      : undefined

  const reservedForIso = useMemo(() => {
    try {
      const [hour, minute] = (time || "19:00").split(":").map(Number)
      const start = new Date(date || new Date().toISOString().slice(0, 10))
      start.setHours(hour, minute, 0, 0)
      return start.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }, [date, time])

  const { profile } = useRestaurant()
  const openMinutes = profile?.openingTime ?? 660 // default 11:00 (660 min)
  const closeMinutes = profile?.closingTime ?? 1380 // default 23:00 (1380 min)
  const openTimeStr = useMemo(() => minutesToTimeString(openMinutes), [openMinutes])
  const closeTimeStr = useMemo(() => minutesToTimeString(closeMinutes), [closeMinutes])

  const todayStr = useMemo(() => toDateInputValue(new Date()), [])
  const currentTimeStr = useMemo(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  }, [])

  const effectiveMinTime = useMemo(() => {
    if (date === todayStr) {
      return currentTimeStr > openTimeStr ? currentTimeStr : openTimeStr
    }
    return openTimeStr
  }, [date, todayStr, currentTimeStr, openTimeStr])

  const steps = [
    t("pages.reservations.newDialog.stepGuest"),
    t("pages.reservations.newDialog.stepBooking"),
    t("pages.reservations.newDialog.stepTable"),
  ]

  function validateStep(current: number): boolean {
    if (current === 0) {
      if (!customerName.trim() || !customerPhone.trim()) {
        setError(t("pages.reservations.newDialog.errorRequired"))
        return false
      }
      return true
    }
    if (current === 1) {
      if (!date || !time) {
        setError(t("pages.reservations.newDialog.errorRequired"))
        return false
      }
      const party = Number(partySize)
      if (!Number.isFinite(party) || party < 1) {
        setError(t("pages.reservations.newDialog.errorPartySize"))
        return false
      }
      const [hour, minute] = time.split(":").map(Number)
      const selectedMinutes = hour * 60 + minute
      if (selectedMinutes < openMinutes || selectedMinutes > closeMinutes) {
        setError(
          t(
            "pages.reservations.newDialog.errorOperatingHours",
            "Time must be within opening hours ({{open}} - {{close}}).",
            { open: openTimeStr, close: closeTimeStr },
          ),
        )
        return false
      }
      const start = new Date(date)
      start.setHours(hour, minute, 0, 0)
      if (start.getTime() < Date.now() - 60_000) {
        setError(t("pages.reservations.newDialog.errorPastTime", "Cannot select a date or time in the past."))
        return false
      }
      return true
    }
    return true
  }

  async function handleSubmit() {
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
    const selectedMinutes = hour * 60 + minute
    if (selectedMinutes < openMinutes || selectedMinutes > closeMinutes) {
      setError(
        t(
          "pages.reservations.newDialog.errorOperatingHours",
          "Time must be within opening hours ({{open}} - {{close}}).",
          { open: openTimeStr, close: closeTimeStr },
        ),
      )
      return
    }

    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)
    if (start.getTime() < Date.now() - 60_000) {
      setError(t("pages.reservations.newDialog.errorPastTime", "Cannot select a date or time in the past."))
      return
    }

    const duration = durationMinutes === "unspecified" ? 90 : Number(durationMinutes)

    const finalNotes = buildReservationNotes({
      eventType,
      foodCategories,
      specialRequests: notes,
    })

    // Guest contact edits live on the shared customer record.
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
      notes: finalNotes,
    }
    let nextTableName: string | undefined
    if (tableId) {
      nextTableName =
        tableOptions.find((t) => t.id === tableId)?.name ?? (pickedTable?.id === tableId ? pickedTable.name : undefined) ?? currentTable?.name ?? reservation.tableName
      if (tableId !== reservation.tableId) changes.tableId = tableId
    } else {
      if (reservation.tableId) changes.tableId = null
      nextTableName = undefined
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
      durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 90,
      tableId: tableId || "",
      tableName: nextTableName,
      notes: finalNotes,
      specialRequests: notes.trim() || undefined,
      eventType: eventType === "unspecified" ? undefined : eventType,
      foodCategories: foodCategories.length > 0 ? foodCategories : undefined,
    })
    toast.success(t("pages.reservations.toasts.updated", "Reservation updated successfully"), {
      description: `${trimmedName} · ${party} ${party === 1 ? "guest" : "guests"}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) setStep(0)
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.editDialog.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.editDialog.description")}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  i < step && "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary text-primary",
                  i > step && "border-border bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
          className="flex flex-col gap-4"
        >
          {step === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-name">{t("pages.reservations.newDialog.customerName")}</Label>
                <Input
                  id="edit-res-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-phone">{t("pages.reservations.newDialog.phone")}</Label>
                <PhoneInput
                  id="edit-res-phone"
                  value={customerPhone}
                  onChange={(value) => setCustomerPhone(value ?? "")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-email">
                  {t("pages.reservations.newDialog.email")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("pages.reservations.newDialog.optional")}
                  </span>
                </Label>
                <Input
                  id="edit-res-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-res-date">{t("pages.reservations.newDialog.date")}</Label>
                  <Input
                    id="edit-res-date"
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      setError(null)
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-res-time">{t("pages.reservations.newDialog.time")}</Label>
                    <span className="text-muted-foreground text-xs font-normal">
                      {openTimeStr} - {closeTimeStr}
                    </span>
                  </div>
                  <Input
                    id="edit-res-time"
                    type="time"
                    min={effectiveMinTime}
                    max={closeTimeStr}
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value)
                      setError(null)
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="edit-res-duration">{t("pages.reservations.newDialog.duration")}</Label>
                  <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                    <SelectTrigger id="edit-res-duration" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">
                        {t("pages.reservations.newDialog.durationUnspecified")}
                      </SelectItem>
                      <SelectItem value="30">30 {t("pages.reservations.newDialog.durationMin")}</SelectItem>
                      <SelectItem value="45">45 {t("pages.reservations.newDialog.durationMin")}</SelectItem>
                      <SelectItem value="60">1 {t("pages.reservations.newDialog.durationHour")}</SelectItem>
                      <SelectItem value="90">1.5 {t("pages.reservations.newDialog.durationHours")}</SelectItem>
                      <SelectItem value="120">2 {t("pages.reservations.newDialog.durationHours")}</SelectItem>
                      <SelectItem value="150">2.5 {t("pages.reservations.newDialog.durationHours")}</SelectItem>
                      <SelectItem value="180">3 {t("pages.reservations.newDialog.durationHours")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-event">{t("pages.reservations.newDialog.eventType")}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="edit-res-event" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`pages.reservations.newDialog.event${capitalize(value)}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>{t("pages.reservations.newDialog.table")}</Label>
                <button
                  type="button"
                  aria-pressed={Boolean(tableId)}
                  onClick={() => setPickerOpen(true)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    tableId
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-accent/50",
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <LayoutGrid className="text-muted-foreground size-4" />
                      {tableId && selectedFloorTable
                        ? `${t("pages.reservations.colTable")} ${selectedFloorTable.name}`
                        : t("pages.reservations.newDialog.chooseFromFloorPlan")}
                    </span>
                    {tableId && <Check className="text-primary size-4" />}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {tableId && selectedFloorTable
                      ? selectedFloorTable.floor
                        ? `${selectedFloorTable.floor} · ${selectedFloorTable.capacity ?? ""} seats`
                        : `${selectedFloorTable.capacity ?? ""} seats`
                      : t("pages.reservations.newDialog.chooseFromFloorPlanHint")}
                  </span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-food-category">
                  {t("pages.reservations.newDialog.foodCategory")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("pages.reservations.newDialog.optional")}
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-res-food-category"
                      type="button"
                      variant="outline"
                      className="h-auto min-h-9 w-full justify-start px-3 py-2 font-normal"
                    >
                      {foodCategories.length === 0 ? (
                        <span className="text-muted-foreground">
                          {t("pages.reservations.newDialog.selectFoodCategory")}
                        </span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {foodCategories.map((value) => (
                            <Badge key={value} variant="secondary">
                              {t(`pages.reservations.newDialog.foodCategory${capitalize(value)}`)}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1" align="start">
                    {FOOD_CATEGORY_VALUES.map((value) => {
                      const checked = foodCategories.includes(value)
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleFoodCategory(value)}
                          className="hover:bg-accent flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm"
                        >
                          <span>{t(`pages.reservations.newDialog.foodCategory${capitalize(value)}`)}</span>
                          {checked && <Check className="text-primary size-4" />}
                        </button>
                      )
                    })}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-res-notes">
                  {t("pages.reservations.newDialog.specialRequests", "Special Request")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("pages.reservations.newDialog.optional")}
                  </span>
                </Label>
                <Textarea
                  id="edit-res-notes"
                  rows={2}
                  placeholder={t(
                    "pages.reservations.newDialog.specialRequestsPlaceholder",
                    "e.g. Birthday cake, window seat, high chair, allergies...",
                  )}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null)
                    setStep(step - 1)
                  }}
                >
                  {t("pages.reservations.newDialog.back")}
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {t("pages.reservations.cancel")}
                  </Button>
                </DialogClose>
              )}
            </div>
            {step < 2 ? (
              <Button
                type="button"
                onClick={() => {
                  setError(null)
                  if (validateStep(step)) setStep(step + 1)
                }}
              >
                {t("pages.reservations.newDialog.next")}
              </Button>
            ) : (
              <Button type="button" disabled={isSaving} onClick={() => void handleSubmit()}>
                {isSaving ? t("pages.reservations.newDialog.saving") : t("pages.reservations.editDialog.save")}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      {/* Nested TablePickerDialog: displays interactive Floor Plan layout */}
      <TablePickerDialog
        key={pickerOpen ? "picker-open" : "picker-closed"}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedTableId={tableId || null}
        partySize={Number(partySize) || 1}
        reservedFor={reservedForIso}
        onConfirm={(chosenId, chosenTable) => {
          setTableId(chosenId)
          if (chosenTable) setPickedTable(chosenTable)
        }}
      />
    </Dialog>
  )
}
