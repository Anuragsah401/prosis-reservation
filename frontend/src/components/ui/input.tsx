import * as React from "react"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, forwardedRef) => {
    const internalRef = React.useRef<HTMLInputElement | null>(null)

    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [forwardedRef],
    )

    const handleIconClick = () => {
      try {
        const el = internalRef.current
        if (el) {
          const withPicker = el as HTMLInputElement & { showPicker?: () => void }
          if (typeof withPicker.showPicker === "function") {
            withPicker.showPicker()
          } else {
            el.focus()
          }
        }
      } catch {
        internalRef.current?.focus()
      }
    }

    const isDateTime = type === "date" || type === "time"

    if (!isDateTime) {
      return (
        <input
          ref={setRef}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:[color-scheme:dark]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
            className,
          )}
          {...props}
        />
      )
    }

    return (
      <div className="relative flex w-full items-center">
        <input
          ref={setRef}
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-9 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:[color-scheme:dark]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
            className,
          )}
          {...props}
        />
        {type === "date" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleIconClick}
            className="text-muted-foreground hover:text-foreground pointer-events-none absolute right-2.5 flex items-center justify-center"
            aria-hidden="true"
          >
            <Calendar className="size-4" />
          </button>
        )}
        {type === "time" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleIconClick}
            className="text-muted-foreground hover:text-foreground pointer-events-none absolute right-2.5 flex items-center justify-center"
            aria-hidden="true"
          >
            <Clock className="size-4" />
          </button>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"

export { Input }
