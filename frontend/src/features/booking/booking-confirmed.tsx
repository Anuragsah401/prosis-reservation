import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <CheckCircle2 className="size-12 text-emerald-500" />
      <div>
        <h2 className="text-xl font-semibold">
          {t("publicBooking.confirmed.heading", "Reservation requested!")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("publicBooking.confirmed.notice", "Your table at {{restaurant}} is being confirmed. We'll be in touch shortly.", {
            restaurant: restaurantName,
          })}
        </p>
      </div>

      <div className="bg-muted/50 flex w-full max-w-md flex-col gap-3 rounded-lg border p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.guest", "Guest")}</span>
          <span className="font-medium">{confirmation.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.date", "Date")}</span>
          <span className="font-medium">{confirmation.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.time", "Time")}</span>
          <span className="font-medium">{formatDisplayTime(confirmation.time)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.partySize", "Party size")}</span>
          <span className="font-medium">
            {t("publicBooking.step3.guestsCount", "{{count}} guests", { count: confirmation.guests })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.table", "Table")}</span>
          <span className="font-medium">
            {confirmation.table
              ? `${confirmation.table.number}${confirmation.table.floor ? ` (${confirmation.table.floor})` : ""}`
              : t("publicBooking.confirmed.tableAssignedOnArrival", "Assigned upon arrival")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.confirmationId", "Confirmation ID")}</span>
          <span className="font-mono text-xs">{confirmation.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("publicBooking.confirmed.status", "Status")}</span>
          <Badge variant="secondary">{confirmation.status}</Badge>
        </div>
      </div>

      <Button variant="outline" onClick={onBookAnother} className="mt-2">
        {t("publicBooking.confirmed.bookAnother", "Book another reservation")}
      </Button>
    </div>
  )
}
