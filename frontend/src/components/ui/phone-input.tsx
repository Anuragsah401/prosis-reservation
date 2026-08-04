import * as React from "react"
import PhoneInputPrimitive from "react-phone-number-input"
import type { Country } from "react-phone-number-input"
import { getCountryCallingCode } from "react-phone-number-input"
import en from "react-phone-number-input/locale/en.json"
import { ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CountrySelectProps {
  value?: Country
  onChange: (value?: Country) => void
  options: { value?: Country; label: string }[]
  disabled?: boolean
}

function CountrySelect({ value, onChange, options, disabled }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const countryOptions = React.useMemo(
    () => options.filter((o): o is { value: Country; label: string } => Boolean(o.value)),
    [options],
  )

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return countryOptions
    return countryOptions.filter((o) => {
      const dial = `+${getCountryCallingCode(o.value)}`
      return o.label.toLowerCase().includes(q) || dial.includes(q)
    })
  }, [countryOptions, search])

  const dialCode = value ? `+${getCountryCallingCode(value)}` : ""

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 shrink-0 items-center gap-1.5 rounded-md border bg-transparent px-3 text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {dialCode || "+1"}
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country or code..."
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">No matches found.</p>
          )}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                setSearch("")
              }}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                option.value === value && "bg-accent/50",
              )}
            >
              <span className="truncate">{option.label}</span>
              <span className="text-muted-foreground shrink-0">+{getCountryCallingCode(option.value)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PhoneNumberInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn("flex-1", className)} {...props} />
}

export interface PhoneInputProps {
  value?: string
  onChange: (value?: string) => void
  defaultCountry?: Country
  placeholder?: string
  id?: string
  className?: string
  disabled?: boolean
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "US",
  placeholder = "555 123 4567",
  id,
  className,
  disabled,
}: PhoneInputProps) {
  return (
    <PhoneInputPrimitive
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      id={id}
      labels={en}
      countrySelectComponent={CountrySelect}
      inputComponent={PhoneNumberInput}
      className={cn("flex items-center gap-2", className)}
    />
  )
}
