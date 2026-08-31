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

  const formattedDate = selectedDate.toLocaleDateString(i18n.language || undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
      {/* Left: Date jumper buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handlePrevDay}
          title={t("pages.reservations.dateShortcuts.prevDay", "Previous day")}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant={isSelectedYesterday ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium"
          onClick={() => onSelectDate(yesterday)}
        >
          {t("pages.reservations.dateShortcuts.yesterday", "Yesterday")}
        </Button>

        <Button
          variant={isSelectedToday ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={() => onSelectDate(today)}
        >
          <span className={isSelectedToday ? "size-1.5 rounded-full bg-primary-foreground" : "size-1.5 rounded-full bg-primary"} />
          {t("pages.reservations.dateShortcuts.today", "Today")}
        </Button>

        <Button
          variant={isSelectedTomorrow ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs font-medium"
          onClick={() => onSelectDate(tomorrow)}
        >
          {t("pages.reservations.dateShortcuts.tomorrow", "Tomorrow")}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={handleNextDay}
          title={t("pages.reservations.dateShortcuts.nextDay", "Next day")}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Center/Right: Human readable date + Total result badge & native date picker */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary shrink-0" />
          <span className="text-sm font-bold capitalize text-foreground">{formattedDate}</span>
          <Badge variant="secondary" className="text-xs font-semibold">
            {t("pages.reservations.resultCount", { count: totalCount })}
          </Badge>
        </div>

        {/* Native date picker jumper */}
        <label className="relative inline-flex items-center">
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
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              const el = document.getElementById("reservations-date-jump") as HTMLInputElement | null
              if (el && typeof el.showPicker === "function") {
                el.showPicker()
              }
            }}
          >
            <Calendar className="size-3.5" />
            <span className="hidden sm:inline">{t("pages.reservations.jumpToDate", "Jump to date")}</span>
          </Button>
        </label>
      </div>
    </div>
  )
}
