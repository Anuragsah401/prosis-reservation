import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  statusColors,
  type CalendarReservation,
} from "@/features/reservations-calendar/calendar-data"

export interface BookingSidebarListProps {
  reservations: CalendarReservation[]
  onSelect: (reservation: CalendarReservation) => void
  selectedId?: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function BookingSidebarList({ reservations, onSelect, selectedId }: BookingSidebarListProps) {
  const sorted = [...reservations].sort((a, b) => a.start.localeCompare(b.start))

  if (sorted.length === 0) {
    return <p className="text-muted-foreground px-1 py-6 text-center text-xs">No bookings for this day.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((r) => {
        const colors = statusColors[r.status]
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border-l-4 bg-card px-2.5 py-2 text-left text-xs shadow-sm transition-colors hover:bg-accent/60",
              selectedId === r.id && "ring-primary ring-2",
            )}
            style={{ borderLeftColor: colors.border }}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{r.customerName}</p>
              <p className="text-muted-foreground">{formatTime(r.start)}</p>
            </div>
            <span className="text-muted-foreground flex shrink-0 items-center gap-0.5">
              <Users className="size-3" />
              {r.partySize}
            </span>
          </button>
        )
      })}
    </div>
  )
}
