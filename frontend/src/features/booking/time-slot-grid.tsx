import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimeSlotGridProps {
  slots: string[]
  bookedSlots: Set<string>
  selected: string | null
  onSelect: (time: string) => void
}

function formatDisplayTime(time: string) {
  const [hourStr, minute] = time.split(":")
  const hour = Number(hourStr)
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${period}`
}

export function TimeSlotGrid({ slots, bookedSlots, selected, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return <p className="text-muted-foreground text-sm">No time slots available for this date.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const isBooked = bookedSlots.has(slot)
        const isSelected = selected === slot
        return (
          <Button
            key={slot}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={isBooked}
            onClick={() => onSelect(slot)}
            className={cn(isBooked && "line-through opacity-40")}
          >
            {formatDisplayTime(slot)}
          </Button>
        )
      })}
    </div>
  )
}
