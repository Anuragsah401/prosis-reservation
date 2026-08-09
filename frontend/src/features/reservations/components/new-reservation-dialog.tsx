import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Plus } from "lucide-react"
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
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { usePersistedFormState } from "@/hooks/use-form-persistence"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { FOOD_CATEGORY_VALUES } from "../reservations-constants"
import { capitalize, toDateInputValue, useTableOptions } from "../reservations-utils"
import { createReservationOnServer } from "../reservations-api"

interface NewReservationDialogProps {
  defaultDate: Date
  onCreate: (reservation: CalendarReservation) => void
}

export function NewReservationDialog({ defaultDate, onCreate }: NewReservationDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const tableOptions = useTableOptions()
  const [draft, setDraft, clearDraft] = usePersistedFormState("new-reservation-form", {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    tableId: tableOptions[0]?.id ?? "",
    date: toDateInputValue(defaultDate),
    time: "19:00",
    partySize: "2",
    durationMinutes: "unspecified",
    foodCategories: [] as string[],
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
  } = draft
  const setCustomerName = (v: string) => setDraft((d) => ({ ...d, customerName: v }))
  const setCustomerPhone = (v: string) => setDraft((d) => ({ ...d, customerPhone: v }))
  const setCustomerEmail = (v: string) => setDraft((d) => ({ ...d, customerEmail: v }))
  const setTableId = (v: string) => setDraft((d) => ({ ...d, tableId: v }))
  const setDate = (v: string) => setDraft((d) => ({ ...d, date: v }))
  const setTime = (v: string) => setDraft((d) => ({ ...d, time: v }))
  const setPartySize = (v: string) => setDraft((d) => ({ ...d, partySize: v }))
  const setDurationMinutes = (v: string) => setDraft((d) => ({ ...d, durationMinutes: v }))
  const toggleFoodCategory = (value: string) =>
    setDraft((d) => ({
      ...d,
      foodCategories: d.foodCategories.includes(value)
        ? d.foodCategories.filter((c) => c !== value)
        : [...d.foodCategories, value],
    }))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setDraft({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      tableId: tableOptions[0]?.id ?? "",
      date: toDateInputValue(defaultDate),
      time: "19:00",
      partySize: "2",
      durationMinutes: "unspecified",
      foodCategories: [],
    })
    clearDraft()
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)

    // "Not specified" duration falls back to the default table hold time
    // (90 min) internally, since the calendar/timeline views need a numeric
    // duration to render — the customer simply wasn't asked for an exact one.
    const duration = durationMinutes === "unspecified" ? 90 : Number(durationMinutes)

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
        notes: foodCategories.length > 0 ? `Food preferences: ${foodCategories.join(", ")}` : undefined,
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
      // The dialog's table pick and food tags aren't sent to the API yet,
      // so keep the locally captured values.
      tableId: saved.tableId || tableId,
      durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 90,
      foodCategories: foodCategories.length > 0 ? foodCategories : undefined,
    })

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex-1 sm:flex-initial">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("pages.reservations.newReservation")}</span>
          <span className="sm:hidden">{t("pages.reservations.newReservationShort")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pages.reservations.newDialog.title")}</DialogTitle>
          <DialogDescription>{t("pages.reservations.newDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
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
              <span className="text-muted-foreground font-normal">{t("pages.reservations.newDialog.optional")}</span>
            </Label>
            <Input
              id="new-res-email"
              type="email"
              placeholder="alicia@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-date">{t("pages.reservations.newDialog.date")}</Label>
              <Input id="new-res-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-res-time">{t("pages.reservations.newDialog.time")}</Label>
              <Input id="new-res-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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
                  <SelectItem value="unspecified">{t("pages.reservations.newDialog.durationUnspecified")}</SelectItem>
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
            <Label>{t("pages.reservations.newDialog.table")}</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("pages.reservations.newDialog.selectTable")} />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((t2) => (
                  <SelectItem key={t2.id} value={t2.id}>
                    {t2.floor} · {t("pages.reservations.colTable")} {t2.name} ({t2.capacity}{" "}
                    {t("pages.reservations.newDialog.seats")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-res-food-category">
              {t("pages.reservations.newDialog.foodCategory")}{" "}
              <span className="text-muted-foreground font-normal">{t("pages.reservations.newDialog.optional")}</span>
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

          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("pages.reservations.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("pages.reservations.newDialog.saving") : t("pages.reservations.newDialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
