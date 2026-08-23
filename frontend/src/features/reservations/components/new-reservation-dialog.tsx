import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, LayoutGrid, Plus, UserRound } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PhoneInput } from "@/components/ui/phone-input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { usePersistedFormState } from "@/hooks/use-form-persistence"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { FOOD_CATEGORY_VALUES } from "../reservations-constants"
import { capitalize, toDateInputValue, useTableOptions, type TableOption } from "../reservations-utils"
import { createReservationOnServer } from "../reservations-api"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { minutesToTimeString } from "@/features/restaurant/restaurant-api"
import { TablePickerDialog } from "./table-picker-dialog"

/**
 * Sentinel `tableId` meaning "don't assign a table now — let the guest pick
 * one from the floor plan on the confirmation page". Kept distinct from an
 * empty string so it survives the persisted form draft and is never confused
 * with "nothing selected yet".
 */
export const LET_CUSTOMER_CHOOSE = "__customer_choice__"

/** Event types staff can tag a reservation with. Stored in the notes field. */
const EVENT_TYPES = ["unspecified", "birthday", "meeting", "anniversary", "business", "other"] as const

interface NewReservationDialogProps {
  defaultDate: Date
  onCreate: (reservation: CalendarReservation) => void
}

export function NewReservationDialog({ defaultDate, onCreate }: NewReservationDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // The wizard splits the form into three steps; reopening resets to the first.
  const [step, setStep] = useState(0)
  const tableOptions = useTableOptions()
  const [draft, setDraft, clearDraft] = usePersistedFormState("new-reservation-form", {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    // No table chosen yet — the Table step must be resolved explicitly (either
    // pick a table from the floor plan or let the customer choose) before the
    // wizard lets staff create the reservation.
    tableId: "",
    date: toDateInputValue(defaultDate),
    time: "19:00",
    partySize: "2",
    durationMinutes: "unspecified",
    foodCategories: [] as string[],
    eventType: "unspecified",
  })
  const {
    customerName,
    customerPhone,
    customerEmail,
    tableId,
    date,
    time,
    partySize,
    durationMinutes,
    foodCategories,
    eventType,
  } = draft
  const setCustomerName = (v: string) => setDraft((d) => ({ ...d, customerName: v }))
  const setCustomerPhone = (v: string) => setDraft((d) => ({ ...d, customerPhone: v }))
  const setCustomerEmail = (v: string) => setDraft((d) => ({ ...d, customerEmail: v }))
  const setTableId = (v: string) => setDraft((d) => ({ ...d, tableId: v }))
  const setDate = (v: string) => setDraft((d) => ({ ...d, date: v }))
  const setTime = (v: string) => setDraft((d) => ({ ...d, time: v }))
  const setPartySize = (v: string) => setDraft((d) => ({ ...d, partySize: v }))
  const setDurationMinutes = (v: string) => setDraft((d) => ({ ...d, durationMinutes: v }))
  const setEventType = (v: string) => setDraft((d) => ({ ...d, eventType: v }))
  const toggleFoodCategory = (value: string) =>
    setDraft((d) => ({
      ...d,
      foodCategories: d.foodCategories.includes(value)
        ? d.foodCategories.filter((c) => c !== value)
        : [...d.foodCategories, value],
    }))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedTable, setPickedTable] = useState<TableOption | null>(null)

  // The floor-plan table the staff chose, used to label the picker button.
  const selectedFloorTable =
    tableId && tableId !== LET_CUSTOMER_CHOOSE
      ? tableOptions.find((t) => t.id === tableId) ?? (pickedTable?.id === tableId ? pickedTable : undefined)
      : undefined

  const steps = [
    t("pages.reservations.newDialog.stepGuest"),
    t("pages.reservations.newDialog.stepBooking"),
    t("pages.reservations.newDialog.stepTable"),
  ]

  function resetForm() {
    setDraft({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      tableId: "",
      date: toDateInputValue(defaultDate),
      time: "19:00",
      partySize: "2",
      durationMinutes: "unspecified",
      foodCategories: [] as string[],
      eventType: "unspecified",
    })
    clearDraft()
    setPickedTable(null)
    setError(null)
  }

  const reservedForIso = useMemo(() => {
    try {
      const [hour, minute] = (time || "19:00").split(":").map(Number)
      const parsed = date ? new Date(date) : new Date()
      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        parsed.setHours(hour, minute, 0, 0)
      }
      return parsed.toISOString()
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

  /**
   * Validates the current step before allowing the wizard to move forward.
   * Each step only checks its own fields, so the guest isn't blocked by
   * fields they haven't seen yet.
   */
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
    // The Table step must be resolved explicitly — either a floor-plan table
    // or "let the customer choose". Food categories/event type stay optional.
    if (!tableId) {
      setError(t("pages.reservations.newDialog.errorTableChoice"))
      return false
    }
    return true
  }

  async function handleCreate() {
    // Creation only ever happens through an explicit click on the Create
    // button. The form below prevents default submission, so an Enter keypress
    // in a field can never create or advance the wizard on its own.
    if (!customerName.trim() || !customerPhone.trim() || !tableId || !date || !time) {
      setError(t("pages.reservations.newDialog.errorRequired"))
      return
    }
    const party = Number(partySize)
    if (!Number.isFinite(party) || party < 1) {
      setError(t("pages.reservations.newDialog.errorPartySize"))
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

    // "Not specified" duration falls back to the default table hold time
    // (90 min) internally, since the calendar/timeline views need a numeric
    // duration to render — the customer simply wasn't asked for an exact one.
    const duration = durationMinutes === "unspecified" ? 90 : Number(durationMinutes)

    // Structured picks (event type, food categories) are persisted in the
    // notes field so they survive without a schema change.
    const noteParts: string[] = []
    if (eventType && eventType !== "unspecified") noteParts.push(`Event: ${eventType}`)
    if (foodCategories.length > 0) noteParts.push(`Food preferences: ${foodCategories.join(", ")}`)

    // Persist to the backend first. Only once the row is safely stored do we
    // add it to the list and close the dialog — otherwise a failed save would
    // look successful and the booking would disappear on the next refresh.
    setIsSaving(true)
    let saved: CalendarReservation
    try {
      saved = await createReservationOnServer({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        partySize: party,
        reservedFor: start.toISOString(),
        // Omitted when the guest will pick their own table, which is what
        // leaves the reservation unassigned and unlocks the floor-plan
        // picker on the confirmation page.
        tableId: tableId && tableId !== LET_CUSTOMER_CHOOSE ? tableId : undefined,
        notes: noteParts.length > 0 ? noteParts.join("; ") : undefined,
      })
    } catch (err) {
      console.error("[reservations] Failed to save reservation:", err)
      setError(err instanceof Error ? err.message : t("pages.reservations.newDialog.errorSave"))
      return
    } finally {
      setIsSaving(false)
    }

    onCreate({
      ...saved,
      durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 90,
      foodCategories: foodCategories.length > 0 ? foodCategories : undefined,
      eventType: eventType === "unspecified" ? undefined : eventType,
    })

    toast.success(t("pages.reservations.toasts.created", "Reservation created successfully"), {
      description: `${customerName.trim()} · ${party} ${party === 1 ? "guest" : "guests"} · ${date} ${time}`,
    })

    resetForm()
    setStep(0)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setStep(0)
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex-1 sm:flex-initial">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("pages.reservations.newReservation")}</span>
          <span className="sm:hidden">{t("pages.reservations.newReservationShort")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.newDialog.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.newDialog.description")}</DialogDescription>
        </DialogHeader>

        {/* Step indicator: filled+checked once done, ring when active, muted
            when still ahead. */}
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
            // Enter in a field must never create the reservation or advance the
            // wizard — navigation and creation happen via explicit buttons.
            e.preventDefault()
          }}
          className="flex flex-col gap-4"
        >
          {step === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-res-name">{t("pages.reservations.newDialog.customerName")}</Label>
                <Input
                  id="new-res-name"
                  placeholder="Alicia Ford"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-res-phone">{t("pages.reservations.newDialog.phone")}</Label>
                <PhoneInput
                  id="new-res-phone"
                  placeholder="555 123 4567"
                  value={customerPhone}
                  onChange={(value) => setCustomerPhone(value ?? "")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-res-email">
                  {t("pages.reservations.newDialog.email")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("pages.reservations.newDialog.optional")}
                  </span>
                </Label>
                <Input
                  id="new-res-email"
                  type="email"
                  placeholder="alicia@example.com"
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
                  <Label htmlFor="new-res-date">{t("pages.reservations.newDialog.date")}</Label>
                  <Input
                    id="new-res-date"
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
                    <Label htmlFor="new-res-time">{t("pages.reservations.newDialog.time")}</Label>
                    <span className="text-muted-foreground text-xs font-normal">
                      {openTimeStr} - {closeTimeStr}
                    </span>
                  </div>
                  <Input
                    id="new-res-time"
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
                  <Label htmlFor="new-res-party">{t("pages.reservations.newDialog.partySize")}</Label>
                  <Input
                    id="new-res-party"
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-res-duration">{t("pages.reservations.newDialog.duration")}</Label>
                  <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                    <SelectTrigger id="new-res-duration" className="w-full">
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
                <Label htmlFor="new-res-event">{t("pages.reservations.newDialog.eventType")}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="new-res-event" className="w-full">
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
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    aria-pressed={tableId === LET_CUSTOMER_CHOOSE}
                    onClick={() => {
                      setTableId(LET_CUSTOMER_CHOOSE)
                      setPickedTable(null)
                    }}
                    className={cn(
                      "flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      tableId === LET_CUSTOMER_CHOOSE
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-accent/50",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <UserRound className="text-muted-foreground size-4" />
                        {t("pages.reservations.newDialog.letCustomerChoose")}
                      </span>
                      {tableId === LET_CUSTOMER_CHOOSE && <Check className="text-primary size-4" />}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("pages.reservations.newDialog.letCustomerChooseHint")}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={Boolean(selectedFloorTable)}
                    onClick={() => setPickerOpen(true)}
                    className={cn(
                      "flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selectedFloorTable
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-accent/50",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <LayoutGrid className="text-muted-foreground size-4" />
                        {selectedFloorTable
                          ? `${t("pages.reservations.colTable")} ${selectedFloorTable.name}`
                          : t("pages.reservations.newDialog.chooseFromFloorPlan")}
                      </span>
                      {selectedFloorTable && <Check className="text-primary size-4" />}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedFloorTable
                        ? selectedFloorTable.floor
                        : t("pages.reservations.newDialog.chooseFromFloorPlanHint")}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-res-food-category">
                  {t("pages.reservations.newDialog.foodCategory")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("pages.reservations.newDialog.optional")}
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="new-res-food-category"
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
                  <Button type="button" variant="outline" onClick={resetForm}>
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
              <Button type="button" disabled={isSaving} onClick={() => void handleCreate()}>
                {isSaving ? t("pages.reservations.newDialog.saving") : t("pages.reservations.newDialog.create")}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      {/* Nested dialog: remounts per open (via key) so the picker's local
          selection re-initializes from the current assignment each time. */}
      <TablePickerDialog
        key={pickerOpen ? "picker-open" : "picker-closed"}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedTableId={tableId === LET_CUSTOMER_CHOOSE ? null : tableId}
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
