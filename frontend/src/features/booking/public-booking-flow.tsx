import { useMemo, useState } from "react"
import { CalendarDays, MapPin, Users } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getMockRestaurant, generateTimeSlots, getBookedSlots } from "@/features/booking/booking-data"
import { GuestSelector } from "@/features/booking/guest-selector"
import { TimeSlotGrid } from "@/features/booking/time-slot-grid"
import { BookingForm, type BookingContactDetails } from "@/features/booking/booking-form"
import { BookingConfirmed } from "@/features/booking/booking-confirmed"
import { submitBooking, type BookingConfirmation } from "@/features/booking/booking-storage"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

interface PublicBookingFlowProps {
  restaurantId: string
}

export function PublicBookingFlow({ restaurantId }: PublicBookingFlowProps) {
  const restaurant = useMemo(() => getMockRestaurant(restaurantId), [restaurantId])

  const [date, setDate] = useState(todayIso())
  const [guests, setGuests] = useState(2)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)

  const slots = useMemo(() => generateTimeSlots(), [])
  const bookedSlots = useMemo(() => getBookedSlots(date), [date])

  function handleDateChange(nextDate: string) {
    setDate(nextDate)
    setSelectedTime(null)
  }

  async function handleFormSubmit(details: BookingContactDetails) {
    if (!selectedTime) return
    setIsSubmitting(true)
    try {
      const result = await submitBooking({
        restaurantId,
        date,
        time: selectedTime,
        guests,
        ...details,
      })
      setConfirmation(result)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBookAnother() {
    setConfirmation(null)
    setSelectedTime(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{restaurant.name}</h1>
        {restaurant.address && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5" />
            {restaurant.address}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{confirmation ? "Booking confirmed" : "Reserve a table"}</CardTitle>
          {!confirmation && (
            <CardDescription>Pick a date, party size, and time to get started.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {confirmation ? (
            <BookingConfirmed
              confirmation={confirmation}
              restaurantName={restaurant.name}
              onBookAnother={handleBookAnother}
            />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="booking-date" className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    Date
                  </Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={date}
                    min={todayIso()}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    Guests
                  </Label>
                  <GuestSelector value={guests} onChange={setGuests} />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <Label>Available times</Label>
                <TimeSlotGrid
                  slots={slots}
                  bookedSlots={bookedSlots}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
              </div>

              {selectedTime && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-3">
                    <Label>Your details</Label>
                    <BookingForm isSubmitting={isSubmitting} onSubmit={handleFormSubmit} />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
