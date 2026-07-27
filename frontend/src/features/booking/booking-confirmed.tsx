import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BookingConfirmation } from "@/features/booking/booking-storage"

interface BookingConfirmedProps {
  confirmation: BookingConfirmation
  restaurantName: string
  onBookAnother: () => void
}

function formatDisplayTime(time: string) {
  const [hourStr, minute] = time.split(":")
  const hour = Number(hourStr)
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${period}`
}

export function BookingConfirmed({ confirmation, restaurantName, onBookAnother }: BookingConfirmedProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <CheckCircle2 className="size-12 text-emerald-500" />
      <div>
        <h2 className="text-xl font-semibold">Reservation requested!</h2>
        <p className="text-muted-foreground text-sm">
          Your table at {restaurantName} is being confirmed. We&apos;ll be in touch shortly.
        </p>
      </div>

      <div className="bg-muted/50 flex w-full max-w-sm flex-col gap-2 rounded-lg border p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{confirmation.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">{formatDisplayTime(confirmation.time)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guests</span>
          <span className="font-medium">{confirmation.guests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confirmation</span>
          <span className="font-mono text-xs">{confirmation.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="secondary">{confirmation.status}</Badge>
        </div>
      </div>

      <Button variant="outline" onClick={onBookAnother}>
        Book another reservation
      </Button>
    </div>
  )
}
