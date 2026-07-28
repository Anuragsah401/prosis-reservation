import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface MiniMonthCalendarProps {
  selectedDate: Date
  onSelect: (date: Date) => void
  highlightedDates?: Set<string>
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function MiniMonthCalendar({ selectedDate, onSelect, highlightedDates }: MiniMonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const today = new Date()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-1 pb-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onSelect(new Date())}
          className="h-6 px-1.5 text-xs font-medium"
        >
          Today
        </Button>
        <div className="flex items-center gap-0.5">
          <span className="text-xs font-semibold">
            {viewMonth.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-5"
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            <ChevronLeft className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-5"
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-muted-foreground text-[10px] font-medium">
            {label}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} />
          const selected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, today)
          const hasBookings = highlightedDates?.has(dateKey(date))
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={cn(
                "relative mx-auto flex size-6 items-center justify-center rounded-full text-[11px] transition-colors",
                selected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isToday
                    ? "text-primary font-semibold"
                    : "hover:bg-accent",
              )}
            >
              {date.getDate()}
              {hasBookings && !selected && (
                <span className="bg-primary absolute bottom-0.5 size-1 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
