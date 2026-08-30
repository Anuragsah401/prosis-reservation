import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestSelectorProps {
  value: number
  onChange: (guests: number) => void
  max?: number
}

export function GuestSelector({ value, onChange, max = 20 }: GuestSelectorProps) {
  const { t } = useTranslation()
  const quickOptions = [1, 2, 3, 4, 5, 6, 7, 8]

  return (
    <div className="flex flex-col gap-3">
      {/* Quick Party Size Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 sm:gap-2">
        {quickOptions.map((n) => {
          const isSelected = value === n
          return (
            <Button
              key={n}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-11 sm:h-10 rounded-xl font-semibold text-sm transition-all touch-manipulation",
                isSelected
                  ? "shadow-sm shadow-primary/25 scale-[1.02]"
                  : "hover:bg-muted/80 active:scale-95",
              )}
              onClick={() => onChange(n)}
            >
              {n} {n === 1 ? "" : ""}
            </Button>
          )
        })}
      </div>

      {/* Custom Party Size Stepper */}
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-2.5 sm:p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5 text-primary" />
          <span>{t("publicBooking.step1.customPartySize", "Larger group or custom party:")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8.5 rounded-lg active:scale-90 transition-transform"
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={value <= 1}
            aria-label="Decrease guests"
          >
            <Minus className="size-4" />
          </Button>

          <Input
            type="number"
            min={1}
            max={max}
            value={value}
            inputMode="numeric"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1) onChange(Math.min(val, max))
            }}
            className="w-14 h-8.5 text-center text-sm font-bold px-1 rounded-lg"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8.5 rounded-lg active:scale-90 transition-transform"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            aria-label="Increase guests"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

