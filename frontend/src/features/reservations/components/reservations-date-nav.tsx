import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isSameDay } from "../reservations-utils"

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

  const formattedDate = selectedDate.toLocaleDateString(i18n.language || undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-card p-2.5 sm:p-3 shadow-xs">
      {/* Left: Date jumper buttons */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none flex-nowrap">
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8 shrink-0"
          onClick={handlePrevDay}
          title={t("pages.reservations.dateShortcuts.prevDay", "Previous day")}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant={isSelectedYesterday ? "secondary" : "ghost"}
          size="sm"
          className="h-7 sm:h-8 text-xs font-medium shrink-0 px-2 sm:px-2.5"
          onClick={() => onSelectDate(yesterday)}
        >
          {t("pages.reservations.dateShortcuts.yesterday", "Yesterday")}
        </Button>

        <Button
          variant={isSelectedToday ? "default" : "outline"}
          size="sm"
          className="h-7 sm:h-8 gap-1.5 text-xs font-semibold shrink-0 px-2 sm:px-2.5"
          onClick={() => onSelectDate(today)}
        >
          <span className={isSelectedToday ? "size-1.5 rounded-full bg-primary-foreground" : "size-1.5 rounded-full bg-primary"} />
          {t("pages.reservations.dateShortcuts.today", "Today")}
        </Button>

        <Button
          variant={isSelectedTomorrow ? "secondary" : "ghost"}
          size="sm"
          className="h-7 sm:h-8 text-xs font-medium shrink-0 px-2 sm:px-2.5"
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
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Center/Right: Human readable date + Total result badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <CalendarDays className="size-3.5 sm:size-4 text-primary shrink-0" />
        <span className="text-xs sm:text-sm font-bold capitalize text-foreground truncate">{formattedDate}</span>
        <Badge variant="secondary" className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 shrink-0">
          {t("pages.reservations.resultCount", { count: totalCount })}
        </Badge>
      </div>
    </div>
  )
}
