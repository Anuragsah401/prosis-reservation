import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestSelectorProps {
  value: number
  onChange: (guests: number) => void
  max?: number
}

export function GuestSelector({ value, onChange }: GuestSelectorProps) {
  const { t } = useTranslation()
  const quickOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {quickOptions.map((n) => (
          <Button
            key={n}
            type="button"
            variant={value === n ? "default" : "outline"}
            size="sm"
            className={cn("min-w-9 h-9 font-medium")}
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
        <span>{t("publicBooking.step1.customPartySize", "Custom party size:")}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={value <= 1}
          >
            <Minus className="size-3.5" />
          </Button>
          <Input
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val >= 1) onChange(val)
            }}
            className="w-16 h-7 text-center text-xs font-semibold px-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onChange(value + 1)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
