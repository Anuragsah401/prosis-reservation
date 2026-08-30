import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertCircle,
  Check,
  Store,
  LayoutGrid,
  List,
  X,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { generateTimeSlots, formatDisplayTime } from "@/features/booking/booking-data"
import { GuestSelector } from "@/features/booking/guest-selector"
import { TimeSlotGrid } from "@/features/booking/time-slot-grid"
import { BookingConfirmed } from "@/features/booking/booking-confirmed"
import { FloorPlanViewer, type FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"
import { SEOHead, generateRestaurantSchema } from "@/components/seo"
import {
  fetchPublicRestaurant,
  fetchPublicTablesForBooking,
  submitBooking,
  type PublicRestaurant,
  type BookingConfirmation,
} from "@/features/booking/booking-storage"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface PublicBookingFlowProps {
  restaurantId: string
}

function getTableDisplayName(table?: { name?: string; number?: string; floor?: string } | null, fallback = "Restaurant's choice"): string {
  if (!table) return fallback
  const rawName = table.name || table.number || "Table"
  const formattedName = rawName.toLowerCase().startsWith("table") ? rawName : `Table ${rawName}`
  return table.floor ? `${formattedName} (${table.floor})` : formattedName
}

export function PublicBookingFlow({ restaurantId }: PublicBookingFlowProps) {
  const { t } = useTranslation()
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null)
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true)
  const [restaurantError, setRestaurantError] = useState<string | null>(null)

  // Multi-step state: 1 = Date & Time, 2 = Table Selection, 3 = Guest Details, 4 = Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 values
  const [date, setDate] = useState(todayIso())
  const [guests, setGuests] = useState(2)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Step 2 values
  const [tableChoiceMode, setTableChoiceMode] = useState<"AUTO" | "CHOOSE">("AUTO")
  const [tablePickerView, setTablePickerView] = useState<"MAP" | "LIST">("MAP")
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [activeFloor, setActiveFloor] = useState<string>("")
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false)
  const [floorPlanTables, setFloorPlanTables] = useState<FloorPlanViewerTable[]>([])
  const [isLoadingTables, setIsLoadingTables] = useState(false)

  // Step 3 values
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Confirmation state
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  // Fetch restaurant details on load
  useEffect(() => {
    let cancelled = false
    setIsLoadingRestaurant(true)
    setRestaurantError(null)

    fetchPublicRestaurant(restaurantId)
      .then((data) => {
        if (!cancelled) setRestaurant(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setRestaurantError(err instanceof Error ? err.message : t("publicBooking.notFoundMessage", "Failed to load restaurant."))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRestaurant(false)
      })

    return () => {
      cancelled = true
    }
  }, [restaurantId, t])

  // Computed ISO timestamp for the reservation
  const reservedForIso = useMemo(() => {
    if (!selectedTime) return ""
    return new Date(`${date}T${selectedTime}:00`).toISOString()
  }, [date, selectedTime])

  // Available slots computed dynamically from restaurant's opening/closing times
  const slots = useMemo(() => {
    const opening = restaurant?.openingTime ?? 660 // 11:00
    const closing = restaurant?.closingTime ?? 1380 // 23:00
    return generateTimeSlots(opening, closing, 30)
  }, [restaurant?.openingTime, restaurant?.closingTime])

  // Disabled past slots if date is today
  const disabledSlots = useMemo(() => {
    const disabled = new Set<string>()
    if (date === todayIso()) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes() + 15 // 15 min buffer
      slots.forEach((s) => {
        const [h, m] = s.split(":").map(Number)
        if (h * 60 + m < currentMinutes) {
          disabled.add(s)
        }
      })
    }
    return disabled
  }, [date, slots])

  // Load floor plan tables when moving to step 2 or when date/time/guests changes
  // NOTE: selectedTableId is intentionally excluded from dependency array to avoid reloading on selection
  useEffect(() => {
    if (step === 2 && reservedForIso) {
      let cancelled = false
      setIsLoadingTables(true)

      fetchPublicTablesForBooking(restaurantId, reservedForIso, guests)
        .then((tables) => {
          if (!cancelled) {
            setFloorPlanTables(tables)
            setSelectedTableId((currentId) => {
              if (!currentId) return null
              const current = tables.find((t) => t.id === currentId)
              return current && current.available ? currentId : null
            })
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFloorPlanTables([])
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoadingTables(false)
        })

      return () => {
        cancelled = true
      }
    }
  }, [step, restaurantId, reservedForIso, guests])

  const floors = useMemo(
    () => [...new Set(floorPlanTables.map((t) => t.floor).filter((f): f is string => Boolean(f)))],
    [floorPlanTables],
  )

  useEffect(() => {
    if (floors.length > 0 && (!activeFloor || !floors.includes(activeFloor))) {
      setActiveFloor(floors[0])
    }
  }, [floors, activeFloor])

  const selectedTableObj = useMemo(() => {
    if (!selectedTableId) return null
    return floorPlanTables.find((t) => t.id === selectedTableId) ?? null
  }, [selectedTableId, floorPlanTables])

  const filteredFloorTables = useMemo(() => {
    if (!activeFloor || floors.length <= 1) return floorPlanTables
    return floorPlanTables.filter((t) => t.floor === activeFloor)
  }, [floorPlanTables, activeFloor, floors.length])

  const availableTablesList = useMemo(() => {
    return filteredFloorTables.filter((t) => t.available)
  }, [filteredFloorTables])

  function handleDateChange(nextDate: string) {
    setDate(nextDate)
    setSelectedTime(null)
    setSelectedTableId(null)
  }

  function handleGuestsChange(nextGuests: number) {
    setGuests(nextGuests)
    setSelectedTableId(null)
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time)
    setSelectedTableId(null)
  }

  function goToStep2() {
    if (!selectedTime) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goToStep3() {
    setStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function validateContactForm(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = t("publicBooking.step3.errorName", "Please enter your full name")
    if (!email.trim()) {
      errors.email = t("publicBooking.step3.errorEmail", "Please enter your email address")
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = t("publicBooking.step3.errorEmailInvalid", "Please enter a valid email address")
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleFinalSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!validateContactForm() || !selectedTime) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await submitBooking({
        restaurantId,
        date,
        time: selectedTime,
        guests,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        tableId: tableChoiceMode === "CHOOSE" ? selectedTableId || undefined : undefined,
        notes: notes.trim() || undefined,
      })

      setConfirmation(result)
      setStep(4)
      window.scrollTo({ top: 0, behavior: "smooth" })
      toast.success(t("publicBooking.confirmed.toastSuccess", "Reservation requested! A confirmation email has been sent."))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("publicBooking.step3.errorSubmit", "Failed to submit booking. Please try again.")
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBookAnother() {
    setConfirmation(null)
    setSelectedTime(null)
    setSelectedTableId(null)
    setTableChoiceMode("AUTO")
    setNotes("")
    setStep(1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (isLoadingRestaurant) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">{t("publicBooking.loading", "Loading restaurant details…")}</p>
      </div>
    )
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-4 text-center">
        <AlertCircle className="size-12 text-destructive" />
        <h2 className="text-lg font-semibold">{t("publicBooking.notFoundTitle", "Restaurant Not Found")}</h2>
        <p className="text-muted-foreground text-sm">
          {restaurantError || t("publicBooking.notFoundMessage", "This booking link may be invalid or the restaurant is currently not accepting reservations.")}
        </p>
      </div>
    )
  }

  const stepsList = [
    { s: 1, label: t("publicBooking.steps.dateTime", "Date & Time") },
    { s: 2, label: t("publicBooking.steps.chooseTable", "Table") },
    { s: 3, label: t("publicBooking.steps.yourDetails", "Details") },
  ]

  const restaurantSchema = generateRestaurantSchema({
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3.5 py-5 sm:px-6 sm:py-10 pb-10 sm:pb-12">
      <SEOHead
        title={`Reserve a Table at ${restaurant.name}`}
        description={`Book your table online at ${restaurant.name}${restaurant.address ? ` in ${restaurant.address}` : ""}. Instant confirmation, seating layout selection, and special requests.`}
        canonicalPath={`/restaurant/${restaurant.id}/book`}
        ogType="restaurant.restaurant"
        jsonLd={restaurantSchema}
      />

      {/* Restaurant Hero Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {restaurant.logoUrl ? (
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="size-13 sm:size-15 shrink-0 rounded-2xl border border-border/80 object-contain bg-background p-1 shadow-xs"
            />
          ) : (
            <div className="size-13 sm:size-15 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <Store className="size-6" />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {restaurant.name}
              </h1>
              <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shrink-0">
                <CheckCircle2 className="size-3 mr-1" />
                Verified Partner
              </Badge>
            </div>

            {restaurant.address && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs truncate">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{restaurant.address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="outline" className="text-xs font-medium text-muted-foreground gap-1">
            <Clock className="size-3" />
            <span>
              {formatDisplayTime(slots[0] || "11:00")} – {formatDisplayTime(slots[slots.length - 1] || "22:30")}
            </span>
          </Badge>
        </div>
      </div>

      {/* Connected Step Bar */}
      {step !== 4 && (
        <div className="flex items-center justify-between relative px-2 py-1">
          <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-border -z-0" />
          {stepsList.map(({ s, label }) => {
            const isCompleted = s < step
            const isCurrent = s === step

            return (
              <div key={label} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    isCompleted && "bg-primary text-primary-foreground shadow-sm",
                    isCurrent && "border-2 border-primary bg-background text-primary ring-4 ring-primary/15 font-extrabold shadow-sm scale-110",
                    !isCompleted && !isCurrent && "border border-border bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-4 stroke-[3]" /> : s}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-tight text-center whitespace-nowrap",
                    isCurrent ? "text-foreground font-bold" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* STEP 1: DATE, GUESTS & TIME */}
      {step === 1 && (
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {t("publicBooking.step1.title", "Select Date, Guests & Time")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("publicBooking.step1.subtitle", "Pick your reservation details below.")}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 flex flex-col gap-5">
            {/* Quick Date Shortcuts & Date Input */}
            <div className="flex flex-col gap-2.5">
              <Label htmlFor="booking-date" className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarDays className="size-3.5 text-primary" />
                <span>{t("publicBooking.step1.date", "Date")}</span>
              </Label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {[
                  { label: "Today", val: todayIso() },
                  { label: "Tomorrow", val: addDaysIso(1) },
                  { label: "In 2 Days", val: addDaysIso(2) },
                ].map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={date === item.val ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 text-xs rounded-xl font-medium",
                      date === item.val && "shadow-xs",
                    )}
                    onClick={() => handleDateChange(item.val)}
                  >
                    {item.label}
                  </Button>
                ))}

                <div className="relative col-span-3 sm:col-span-1">
                  <Input
                    id="booking-date"
                    type="date"
                    value={date}
                    min={todayIso()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="h-9 text-xs rounded-xl cursor-pointer font-medium"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Guest Selector */}
            <div className="flex flex-col gap-2.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Users className="size-3.5 text-primary" />
                <span>{t("publicBooking.step1.guests", "Number of Guests")}</span>
              </Label>
              <GuestSelector value={guests} onChange={handleGuestsChange} max={20} />
            </div>

            <Separator />

            {/* Time Slot Grid */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-primary" />
                  <span>{t("publicBooking.step1.availableTimes", "Available Times")}</span>
                </Label>
                {selectedTime && (
                  <Badge variant="default" className="text-xs font-semibold">
                    {formatDisplayTime(selectedTime)}
                  </Badge>
                )}
              </div>

              <TimeSlotGrid
                slots={slots}
                disabledSlots={disabledSlots}
                selected={selectedTime}
                onSelect={handleTimeSelect}
              />
            </div>
          </CardContent>

          <CardFooter className="justify-end border-t p-4 sm:p-6">
            <Button
              onClick={goToStep2}
              disabled={!selectedTime}
              size="lg"
              className="w-full sm:w-auto gap-2 font-semibold shadow-xs"
            >
              <span>{t("publicBooking.step1.next", "Next: Choose Table")}</span>
              <ChevronRight className="size-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: TABLE SELECTION (WITH FULL-VIEWPORT POPUP DIALOG) */}
      {step === 2 && (
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {t("publicBooking.step2.title", "Select Table Preference")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("publicBooking.step2.subtitle", "Reservation for {{guests}} guests on {{date}} at {{time}}", {
                guests,
                date,
                time: selectedTime && formatDisplayTime(selectedTime),
              })}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 flex flex-col gap-4 sm:gap-5">
            {/* Table Choice Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setTableChoiceMode("AUTO")
                  setSelectedTableId(null)
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-4 sm:p-5 text-left transition-all",
                  tableChoiceMode === "AUTO"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:bg-muted/50 bg-card",
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm w-full">
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span>{t("publicBooking.step2.autoTitle", "Restaurant's Choice")}</span>
                  {tableChoiceMode === "AUTO" && <Check className="size-4 text-primary ml-auto" />}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("publicBooking.step2.autoHint", "We'll automatically assign the best available table for your party upon arrival.")}
                </p>
                {tableChoiceMode === "AUTO" && (
                  <Badge variant="secondary" className="mt-1 text-[11px] font-semibold text-primary">
                    Active Choice
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTableChoiceMode("CHOOSE")
                  setIsFloorPlanModalOpen(true)
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-4 sm:p-5 text-left transition-all group",
                  tableChoiceMode === "CHOOSE"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                    : "border-border hover:bg-muted/50 bg-card",
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm w-full">
                  <Layers className="size-4 text-primary shrink-0" />
                  <span>{t("publicBooking.step2.chooseTitle", "Choose from Floor Plan")}</span>
                  {tableChoiceMode === "CHOOSE" && <Check className="size-4 text-primary ml-auto" />}
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("publicBooking.step2.chooseHint", "Pick your favorite available table directly on our interactive restaurant layout.")}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={tableChoiceMode === "CHOOSE" && selectedTableObj ? "default" : "outline"} className="text-[11px] font-semibold">
                    {selectedTableObj ? getTableDisplayName(selectedTableObj) : "Tap to open layout"}
                  </Badge>
                </div>
              </button>
            </div>
          </CardContent>

          <CardFooter className="justify-between border-t p-4 sm:p-6">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="size-4" />
              <span>{t("publicBooking.step2.back", "Back")}</span>
            </Button>

            <Button
              onClick={goToStep3}
              disabled={tableChoiceMode === "CHOOSE" && !selectedTableId}
              size="lg"
              className="gap-2 font-semibold shadow-xs"
            >
              <span>{t("publicBooking.step2.next", "Next: Your Details")}</span>
              <ChevronRight className="size-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: GUEST CONTACT DETAILS & SUBMIT */}
      {step === 3 && (
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {t("publicBooking.step3.title", "Guest Information")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("publicBooking.step3.subtitle", "Provide your contact details to receive booking confirmation.")}
            </CardDescription>
          </CardHeader>

          <form onSubmit={(e) => void handleFinalSubmit(e)}>
            <CardContent className="p-4 sm:p-6 pt-0 flex flex-col gap-4 sm:gap-5">
              {/* Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border bg-muted/30 p-3.5 text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Date</span>
                  <span className="font-semibold text-foreground mt-0.5">{date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Time</span>
                  <span className="font-semibold text-foreground mt-0.5">{selectedTime && formatDisplayTime(selectedTime)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Party</span>
                  <span className="font-semibold text-foreground mt-0.5">{guests} guests</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Table</span>
                  <span className="font-semibold text-foreground mt-0.5 truncate">
                    {tableChoiceMode === "CHOOSE" && selectedTableObj
                      ? getTableDisplayName(selectedTableObj)
                      : "Restaurant's choice"}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-name" className="text-xs font-semibold">
                  {t("publicBooking.step3.fullName", "Full Name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="booking-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("publicBooking.step3.fullNamePlaceholder", "Jane Doe")}
                  autoComplete="name"
                  autoCapitalize="words"
                  className="h-11 rounded-xl"
                  required
                />
                {formErrors.name && <p className="text-destructive text-xs">{formErrors.name}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="booking-email" className="text-xs font-semibold">
                    {t("publicBooking.step3.email", "Email Address")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="booking-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("publicBooking.step3.emailPlaceholder", "jane@example.com")}
                    className="h-11 rounded-xl"
                    required
                  />
                  {formErrors.email && <p className="text-destructive text-xs">{formErrors.email}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="booking-phone" className="text-xs font-semibold">
                    {t("publicBooking.step3.phone", "Phone Number")}
                  </Label>
                  <Input
                    id="booking-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("publicBooking.step3.phonePlaceholder", "+45 20 12 34 56")}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-notes" className="text-xs font-semibold">
                  {t("publicBooking.step3.notes", "Special Requests & Dietary Notes")}{" "}
                  <span className="text-muted-foreground font-normal">
                    {t("publicBooking.step3.notesOptional", "(optional)")}
                  </span>
                </Label>
                <Textarea
                  id="booking-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("publicBooking.step3.notesPlaceholder", "Allergies, high chairs, birthday celebration, quiet table...")}
                  rows={3}
                  className="rounded-xl resize-none text-sm"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-between border-t p-4 sm:p-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ChevronLeft className="size-4" />
                <span>{t("publicBooking.step3.back", "Back")}</span>
              </Button>

              <Button type="submit" disabled={isSubmitting} size="lg" className="gap-2 font-semibold shadow-xs">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("publicBooking.step3.submitting", "Confirming...")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>{t("publicBooking.step3.submit", "Complete Booking")}</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* STEP 4: CONFIRMATION */}
      {step === 4 && confirmation && (
        <Card className="shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-2 text-center">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {t("publicBooking.confirmed.title", "Booking Confirmed!")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("publicBooking.confirmed.subtitle", "We've received your reservation request at {{restaurant}}.", {
                restaurant: restaurant.name,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <BookingConfirmed
              confirmation={confirmation}
              restaurantName={restaurant.name}
              onBookAnother={handleBookAnother}
            />
          </CardContent>
        </Card>
      )}

      {/* Floor Plan Selection Pop-Up Dialog / Modal */}
      {isFloorPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsFloorPlanModalOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative z-10 flex flex-col w-full h-full sm:h-[90vh] sm:max-h-[850px] max-w-5xl bg-background sm:rounded-3xl border border-border shadow-2xl overflow-hidden">
            {/* Header: Title, Reservation Context, View Switcher & Close */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/80 bg-card shrink-0 gap-3">
              <div className="flex flex-col min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                  {t("publicBooking.step2.floorPlanTitle", "Select Your Table")}
                </h2>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {restaurant.name} • {guests} guests • {date} at {selectedTime && formatDisplayTime(selectedTime)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Segmented Map vs List View Switcher */}
                <div className="flex items-center rounded-full border border-border/80 bg-muted/40 p-0.5 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTablePickerView("MAP")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold",
                      tablePickerView === "MAP"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span>Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTablePickerView("LIST")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-semibold",
                      tablePickerView === "LIST"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <List className="size-3.5" />
                    <span>List ({availableTablesList.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFloorPlanModalOpen(false)}
                  className="size-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all shrink-0"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Dedicated Floor Selector Strip (Only shown when multiple floors exist) */}
            {floors.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 sm:px-6 border-b border-border/60 bg-muted/20 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Floor:
                </span>
                <div className="flex items-center gap-1.5">
                  {floors.map((fl) => {
                    const isActive = (activeFloor || floors[0]) === fl
                    return (
                      <button
                        key={fl}
                        type="button"
                        onClick={() => setActiveFloor(fl)}
                        className={cn(
                          "px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        {fl}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 relative overflow-hidden bg-muted/15 flex flex-col min-h-0">
              {isLoadingTables ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Loading floor plan layout…</span>
                  </div>
                </div>
              ) : floorPlanTables.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                  <AlertCircle className="size-10 text-muted-foreground" />
                  <p className="text-sm font-semibold">No floor plan layout available</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    You can proceed with Restaurant's Choice and our team will assign the ideal table for you.
                  </p>
                </div>
              ) : tablePickerView === "LIST" ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredFloorTables.map((tbl) => {
                      const isAvailable = tbl.available
                      const isSelected = selectedTableId === tbl.id

                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedTableId(tbl.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border text-left transition-all touch-manipulation",
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md font-semibold"
                              : isAvailable
                                ? "border-border bg-card hover:bg-muted/70 active:scale-[0.98] shadow-xs"
                                : "opacity-40 bg-muted/30 cursor-not-allowed border-border/40",
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">
                              {getTableDisplayName(tbl)}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {tbl.capacity} seats {tbl.floor ? `• ${tbl.floor}` : ""}
                            </span>
                          </div>

                          {isSelected ? (
                            <Badge variant="default" className="text-xs">Selected</Badge>
                          ) : isAvailable ? (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">Available</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
                  <div className="flex-1 w-full h-full relative overflow-hidden">
                    <FloorPlanViewer
                      tables={floorPlanTables}
                      selectedTableId={selectedTableId}
                      activeFloor={activeFloor || floors[0]}
                      onFloorChange={setActiveFloor}
                      hideFloorTabs={true}
                      onSelect={setSelectedTableId}
                      seatsLabel={t("reservationConfirm.seats", "seats")}
                      showFullscreen={false}
                    />
                  </div>

                  {/* Map Legend */}
                  <div className="border-t bg-card/80 backdrop-blur-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-card inline-block size-3 rounded-sm border-2 border-emerald-500/60" />
                        <span>Available ({guests}+ seats)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="bg-muted inline-block size-3 rounded-sm border-2 opacity-40" />
                        <span>Unavailable</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="border-primary bg-primary/20 inline-block size-3 rounded-sm border-2" />
                        <span>Selected</span>
                      </span>
                    </div>
                    <span className="hidden sm:inline text-[11px]">Pinch / Drag to pan & zoom</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-border/80 bg-card shrink-0">
              <div className="flex items-center gap-2">
                {selectedTableObj ? (
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Selected Table</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {getTableDisplayName(selectedTableObj)} ({selectedTableObj.capacity} seats)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    Tap any available table on the layout to select
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={!selectedTableId}
                  size="default"
                  onClick={() => {
                    setIsFloorPlanModalOpen(false)
                  }}
                  className="gap-1.5 font-semibold shadow-xs"
                >
                  <Check className="size-4" />
                  <span>Confirm Table</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
