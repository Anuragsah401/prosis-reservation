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
  if (!time) return ""
  const [hourStr = "00", minute = "00"] = time.split(":")
  return `${hourStr.padStart(2, "0")}:${minute.padStart(2, "0")}`
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

      <div className="bg-muted/50 flex w-full max-w-md flex-col gap-3 rounded-lg border p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guest</span>
          <span className="font-medium">{confirmation.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">{confirmation.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium">{formatDisplayTime(confirmation.time)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Party size</span>
          <span className="font-medium">{confirmation.guests} guests</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Table</span>
          <span className="font-medium">
            {confirmation.table
              ? `${confirmation.table.number}${confirmation.table.floor ? ` (${confirmation.table.floor})` : ""}`
              : "Assigned upon arrival"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Confirmation ID</span>
          <span className="font-mono text-xs">{confirmation.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <Badge variant="secondary">{confirmation.status}</Badge>
        </div>
      </div>

      <Button variant="outline" onClick={onBookAnother} className="mt-2">
        Book another reservation
      </Button>
    </div>
  )
}
