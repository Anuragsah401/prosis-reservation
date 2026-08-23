import { Button } from "@/components/ui/button"
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
  if (slots.length === 0) {
    return <p className="text-muted-foreground text-sm">No time slots available for this date.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => {
        const isBooked = bookedSlots.has(slot)
        const isDisabled = disabledSlots.has(slot) || isBooked
        const isSelected = selected === slot
        return (
          <Button
            key={slot}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={isDisabled}
            onClick={() => onSelect(slot)}
            className={cn(isDisabled && "line-through opacity-40")}
          >
            {formatDisplayTime(slot)}
          </Button>
        )
      })}
    </div>
  )
}
