import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isSameDay, toDateInputValue } from "../reservations-utils"

interface ReservationsDateNavProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  totalCount: number
}

export function ReservationsDateNav({ selectedDate, onSelectDate, totalCount }: ReservationsDateNavProps) {
  const { t, i18n } = useTranslation()

  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isSelectedToday = isSameDay(selectedDate, today)
  const isSelectedYesterday = isSameDay(selectedDate, yesterday)
  const isSelectedTomorrow = isSameDay(selectedDate, tomorrow)

  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    onSelectDate(d)
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    onSelectDate(d)
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) return
    const [y, m, d] = val.split("-").map(Number)
    if (y && m && d) {
      onSelectDate(new Date(y, m - 1, d))
    }
  }

  const formattedDateFull = selectedDate.toLocaleDateString(i18n.language || undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 shadow-xs">
      {/* Date jumper shortcuts with smooth horizontal scroll on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8 shrink-0"
          onClick={handlePrevDay}
          title={t("pages.reservations.dateShortcuts.prevDay", "Previous day")}
        >
          <ChevronLeft className="size-3.5 sm:size-4" />
        </Button>

        <Button
          variant={isSelectedYesterday ? "secondary" : "ghost"}
          size="sm"
          className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium shrink-0"
          onClick={() => onSelectDate(yesterday)}
        >
          {t("pages.reservations.dateShortcuts.yesterday", "Yesterday")}
        </Button>

        <Button
          variant={isSelectedToday ? "default" : "outline"}
          size="sm"
          className="h-7 sm:h-8 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-xs font-semibold shrink-0"
          onClick={() => onSelectDate(today)}
        >
          <span className={isSelectedToday ? "size-1.5 rounded-full bg-primary-foreground" : "size-1.5 rounded-full bg-primary"} />
          {t("pages.reservations.dateShortcuts.today", "Today")}
        </Button>

        <Button
          variant={isSelectedTomorrow ? "secondary" : "ghost"}
          size="sm"
          className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium shrink-0"
          onClick={() => onSelectDate(tomorrow)}
        >
          {t("pages.reservations.dateShortcuts.tomorrow", "Tomorrow")}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8 shrink-0"
          onClick={handleNextDay}
          title={t("pages.reservations.dateShortcuts.nextDay", "Next day")}
        >
          <ChevronRight className="size-3.5 sm:size-4" />
        </Button>
      </div>

      {/* Human readable date + Total result badge & native date picker */}
      <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <CalendarDays className="size-3.5 sm:size-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-bold capitalize text-foreground truncate">
            {formattedDateFull}
          </span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] sm:text-xs font-semibold shrink-0">
            {t("pages.reservations.resultCount", { count: totalCount })}
          </Badge>
        </div>

        {/* Native date picker jumper */}
        <label className="relative inline-flex items-center shrink-0">
          <input
            type="date"
            className="sr-only"
            value={toDateInputValue(selectedDate)}
            onChange={handleDateInputChange}
            id="reservations-date-jump"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              const el = document.getElementById("reservations-date-jump") as HTMLInputElement | null
              if (el && typeof el.showPicker === "function") {
                el.showPicker()
              }
            }}
          >
            <Calendar className="size-3.5" />
            <span className="hidden md:inline">{t("pages.reservations.jumpToDate", "Jump to date")}</span>
          </Button>
        </label>
      </div>
    </div>
  )
}
