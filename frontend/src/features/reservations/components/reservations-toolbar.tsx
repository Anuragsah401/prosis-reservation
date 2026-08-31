import { useTranslation } from "react-i18next"
import { List, CalendarDays, Printer, Download, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { NewReservationDialog } from "./new-reservation-dialog"
import { WalkInDialog } from "./walk-in-dialog"

interface ReservationsToolbarProps {
  tab: "list" | "calendar"
  onTabChange: (tab: "list" | "calendar") => void
  defaultDate: Date
  onCreate: (reservation: CalendarReservation) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  onExportCSV?: () => void
  onPrintRunSheet?: () => void
}

/** View-toggle (list/calendar) + Quick Service Tools + Walk-in and New Reservation actions. */
export function ReservationsToolbar({
  tab,
  onTabChange,
  defaultDate,
  onCreate,
  onRefresh,
  isRefreshing,
  onExportCSV,
  onPrintRunSheet,
}: ReservationsToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
      <div className="flex items-center gap-1">
        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
          <Button
            size="sm"
            variant={tab === "list" ? "default" : "ghost"}
            className="h-8 px-2.5 text-xs font-semibold shadow-xs"
            onClick={() => onTabChange("list")}
          >
            <List className="size-3.5" />
            <span className="hidden sm:inline">{t("pages.reservations.listView", "List")}</span>
          </Button>
          <Button
            size="sm"
            variant={tab === "calendar" ? "default" : "ghost"}
            className="h-8 px-2.5 text-xs font-semibold shadow-xs"
            onClick={() => onTabChange("calendar")}
          >
            <CalendarDays className="size-3.5" />
            <span className="hidden sm:inline">{t("pages.reservations.calendarView", "Calendar")}</span>
          </Button>
        </div>

        {/* Operational Service Tools: Print & Export */}
        {onPrintRunSheet && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            onClick={onPrintRunSheet}
            title={t("pages.reservations.serviceTools.printRunSheet", "Print Service Sheet")}
          >
            <Printer className="size-3.5" />
            <span className="hidden md:inline">{t("pages.reservations.serviceTools.printRunSheet", "Print Sheet")}</span>
          </Button>
        )}

        {onExportCSV && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
            onClick={onExportCSV}
            title={t("pages.reservations.serviceTools.exportCsv", "Export CSV")}
          >
            <Download className="size-3.5" />
            <span className="hidden md:inline">{t("pages.reservations.serviceTools.exportCsv", "Export")}</span>
          </Button>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={onRefresh}
            title={t("pages.reservations.serviceTools.refresh", "Refresh reservations")}
            disabled={isRefreshing}
          >
            <RotateCw className={cn("size-3.5", isRefreshing && "animate-spin text-primary")} />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <WalkInDialog onCreate={onCreate} />
        <NewReservationDialog defaultDate={defaultDate} onCreate={onCreate} />
      </div>
    </div>
  )
}
