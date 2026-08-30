import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeSlotGridProps {
  slots: string[]
  bookedSlots?: Set<string>
  disabledSlots?: Set<string>
  selected: string | null
  onSelect: (time: string) => void
}

function formatDisplayTime(time: string) {
  if (!time) return ""
  const [hourStr = "00", minute = "00"] = time.split(":")
  return `${hourStr.padStart(2, "0")}:${minute.padStart(2, "0")}`
}

export function TimeSlotGrid({
  slots,
  bookedSlots = new Set(),
  disabledSlots = new Set(),
  selected,
  onSelect,
}: TimeSlotGridProps) {
  const { t } = useTranslation()

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("publicBooking.step1.noSlots", "No time slots available for this date.")}
      </div>
    )
  }

  // Split into Lunch (before 16:00) and Dinner (16:00+)
  const lunchSlots = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10)
    return hour < 16
  })

  const dinnerSlots = slots.filter((s) => {
    const hour = parseInt(s.split(":")[0], 10)
    return hour >= 16
  })

  const renderSlotButtons = (slotList: string[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slotList.map((slot) => {
        const isBooked = bookedSlots.has(slot)
        const isDisabled = disabledSlots.has(slot) || isBooked
        const isSelected = selected === slot

        return (
          <Button
            key={slot}
            type="button"
            variant={isSelected ? "default" : "outline"}
            disabled={isDisabled}
            onClick={() => onSelect(slot)}
            className={cn(
              "h-11 rounded-xl text-sm font-semibold transition-all touch-manipulation",
              isSelected
                ? "shadow-md shadow-primary/25 scale-[1.03] ring-2 ring-primary/20"
                : "hover:bg-muted/80 active:scale-95",
              isDisabled && "line-through opacity-35 bg-muted/40",
            )}
          >
            {formatDisplayTime(slot)}
          </Button>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {lunchSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          {dinnerSlots.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Sun className="size-3.5 text-amber-500" />
              <span>{t("publicBooking.step1.lunchSlots", "Lunch & Afternoon")}</span>
            </div>
          )}
          {renderSlotButtons(lunchSlots)}
        </div>
      )}

      {dinnerSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          {lunchSlots.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
              <Moon className="size-3.5 text-indigo-400" />
              <span>{t("publicBooking.step1.dinnerSlots", "Dinner & Evening")}</span>
            </div>
          )}
          {renderSlotButtons(dinnerSlots)}
        </div>
      )}
    </div>
  )
}

