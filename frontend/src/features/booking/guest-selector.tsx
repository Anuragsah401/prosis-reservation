import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GuestSelectorProps {
  value: number
  onChange: (guests: number) => void
  max?: number
}

export function GuestSelector({ value, onChange, max = 8 }: GuestSelectorProps) {
  const options = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((n) => (
        <Button
          key={n}
          type="button"
          variant={value === n ? "default" : "outline"}
          size="sm"
          className={cn("min-w-10")}
          onClick={() => onChange(n)}
        >
          {n}
        </Button>
      ))}
    </div>
  )
}
