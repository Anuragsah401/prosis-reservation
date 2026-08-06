import { useTranslation } from "react-i18next"
import { List, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { NewReservationDialog } from "./new-reservation-dialog"
import { WalkInDialog } from "./walk-in-dialog"

interface ReservationsToolbarProps {
  tab: "list" | "calendar"
  onTabChange: (tab: "list" | "calendar") => void
  defaultDate: Date
  onCreate: (reservation: CalendarReservation) => void
}

/** View-toggle (list/calendar) + Walk-in and New Reservation actions. */
export function ReservationsToolbar({ tab, onTabChange, defaultDate, onCreate }: ReservationsToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <div className="flex items-center gap-1 rounded-md border p-0.5">
        <Button
          size="sm"
          variant={tab === "list" ? "default" : "ghost"}
          className="h-8 px-2.5"
          onClick={() => onTabChange("list")}
        >
          <List className="size-3.5" />
          <span className="hidden sm:inline">{t("pages.reservations.listView")}</span>
        </Button>
        <Button
          size="sm"
          variant={tab === "calendar" ? "default" : "ghost"}
          className="h-8 px-2.5"
          onClick={() => onTabChange("calendar")}
        >
          <CalendarDays className="size-3.5" />
          <span className="hidden sm:inline">{t("pages.reservations.calendarView")}</span>
        </Button>
      </div>
      <WalkInDialog onCreate={onCreate} />
      <NewReservationDialog defaultDate={defaultDate} onCreate={onCreate} />
    </div>
  )
}
