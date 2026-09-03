import React, { useMemo } from "react"
import {
  Wine,
  DoorOpen,
  LogOut,
  UtensilsCrossed,
  UserCheck,
  Sprout,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FacilityType } from "@/features/floor-plan/floor-plan-data"

export interface FacilityGraphicProps {
  type: FacilityType
  name?: string
  width?: number
  height?: number
  isSelected?: boolean
  className?: string
  children?: React.ReactNode
}

const stoolCache = new Map<string, { id: string; style: React.CSSProperties }[]>()

function getCachedBarStools(type: FacilityType, width: number, height: number) {
  if (type !== "BAR") return []
  const key = `${type}:${width}:${height}`
  let res = stoolCache.get(key)
  if (!res) {
    const count = Math.max(2, Math.min(10, Math.floor(width / 36)))
    const stools = []
    const stoolSize = Math.min(22, Math.max(14, Math.round(height * 0.28)))

    for (let i = 0; i < count; i++) {
      const frac = (i + 1) / (count + 1)
      stools.push({
        id: `stool-${i}`,
        style: {
          left: `${width * frac}px`,
          bottom: `0px`,
          width: `${stoolSize}px`,
          height: `${stoolSize}px`,
          transform: "translate(-50%, 50%)",
        },
      })
    }
    if (stoolCache.size > 100) stoolCache.clear()
    stoolCache.set(key, stools)
    res = stools
  }
  return res
}

export const FacilityGraphic = React.memo(function FacilityGraphic({
  type,
  name,
  width = 120,
  height = 60,
  isSelected = false,
  className,
  children,
}: FacilityGraphicProps) {
  // Compute bar stools dynamically along the front edge of the bar counter
  const barStools = useMemo(() => {
    return getCachedBarStools(type, width, height)
  }, [type, width, height])

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center select-none overflow-visible [contain:layout_style]",
        className,
      )}
      style={{ width: `${width}px`, height: `${height}px`, willChange: "transform" }}
    >
      {/* 1. Facility-Specific Outer Props (e.g. Bar Stools) */}
      {type === "BAR" &&
        barStools.map((stool) => (
          <div
            key={stool.id}
            className="absolute z-0 rounded-full border-2 border-amber-500/50 dark:border-amber-400/40 bg-amber-500/20 dark:bg-amber-500/30 shadow-xs pointer-events-none flex items-center justify-center"
            style={stool.style}
          >
            {/* Inner stool cushion circle */}
            <div className="size-2 rounded-full bg-amber-500/40 dark:bg-amber-400/50" />
          </div>
        ))}

      {/* 2. Main Facility Body / Canvas */}
      <div
        className={cn(
          "relative z-10 flex size-full flex-col items-center justify-center p-1.5 text-center transition-[border-color,box-shadow,background-color] duration-150 overflow-hidden border-2 shadow-md",
          isSelected
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
            : "",
          type === "BAR" &&
            "rounded-xl border-amber-600/70 dark:border-amber-500/60 bg-gradient-to-b from-card via-amber-950/10 to-amber-950/20 text-amber-900 dark:text-amber-200",
          type === "RESTROOM" &&
            "rounded-xl border-sky-600/70 dark:border-sky-500/60 bg-gradient-to-b from-card via-sky-950/10 to-sky-950/20 text-sky-900 dark:text-sky-200",
          type === "ENTRANCE" &&
            "rounded-lg border-emerald-600/80 dark:border-emerald-500/70 bg-gradient-to-b from-card via-emerald-950/10 to-emerald-950/20 text-emerald-900 dark:text-emerald-200",
          type === "EXIT" &&
            "rounded-lg border-emerald-600/90 dark:border-emerald-500/80 bg-gradient-to-b from-card via-emerald-950/20 to-emerald-950/30 text-emerald-800 dark:text-emerald-300",
          type === "KITCHEN" &&
            "rounded-xl border-orange-600/70 dark:border-orange-500/60 bg-gradient-to-b from-card via-orange-950/10 to-orange-950/20 text-orange-900 dark:text-orange-200",
          type === "HOST_STAND" &&
            "rounded-xl border-purple-600/70 dark:border-purple-500/60 bg-gradient-to-b from-card via-purple-950/10 to-purple-950/20 text-purple-900 dark:text-purple-200",
          type === "WALL" &&
            "rounded-md border-muted-foreground/60 bg-muted-foreground/30 dark:bg-muted-foreground/40",
          type === "PLANT" &&
            "rounded-full border-emerald-600/80 dark:border-emerald-500/70 bg-emerald-500/20 dark:bg-emerald-500/30",
        )}
      >
        {/* Architectural Textures & Insets */}
        {type === "BAR" && (
          <>
            {/* Marble / polished wood counter line */}
            <div className="pointer-events-none absolute inset-x-2 top-1.5 h-1 rounded-full bg-amber-500/30 dark:bg-amber-400/30" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 max-w-full px-1">
              <div className="flex items-center gap-1">
                <Wine className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold truncate leading-tight">
                  {name || "Bar & Lounge"}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground opacity-80 uppercase tracking-wider font-semibold">
                Beverage Counter
              </span>
            </div>
          </>
        )}

        {type === "RESTROOM" && (
          <>
            {/* Tiled Floor Motif */}
            <div
              className="pointer-events-none absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 max-w-full px-1">
              <div className="flex items-center gap-1">
                <Users className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold truncate leading-tight">
                  {name || "Restrooms"}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground opacity-80 font-medium">
                WC / Facilities
              </span>
            </div>
          </>
        )}

        {type === "ENTRANCE" && (
          <>
            {/* Blueprint Door Swing Arc */}
            <svg
              className="pointer-events-none absolute inset-0 size-full opacity-35 stroke-emerald-600 dark:stroke-emerald-400"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
            >
              <path
                d="M 10 45 A 35 35 0 0 1 45 10 L 45 45 Z"
                fill="none"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <line x1="45" y1="10" x2="45" y2="45" strokeWidth="2" />
            </svg>
            <div className="relative z-10 flex items-center justify-center gap-1 max-w-full px-1">
              <DoorOpen className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold truncate leading-tight">
                {name || "Main Entrance"}
              </span>
            </div>
          </>
        )}

        {type === "EXIT" && (
          <div className="relative z-10 flex items-center justify-center gap-1.5 max-w-full px-1">
            <span className="flex size-4 items-center justify-center rounded-sm bg-emerald-600 text-white font-bold text-[9px]">
              <LogOut className="size-2.5" />
            </span>
            <span className="text-xs font-black tracking-wider uppercase truncate leading-tight">
              {name || "EXIT"}
            </span>
          </div>
        )}

        {type === "KITCHEN" && (
          <>
            {/* Stainless Kitchen Pass Window Line */}
            <div className="pointer-events-none absolute inset-x-2 bottom-1.5 h-1 border-t border-dashed border-orange-500/40" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 max-w-full px-1">
              <div className="flex items-center gap-1">
                <UtensilsCrossed className="size-3.5 shrink-0 text-orange-600 dark:text-orange-400" />
                <span className="text-xs font-bold truncate leading-tight">
                  {name || "Kitchen & Pass"}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground opacity-80 uppercase tracking-wider font-semibold">
                Staff Only
              </span>
            </div>
          </>
        )}

        {type === "HOST_STAND" && (
          <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 max-w-full px-1">
            <UserCheck className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold truncate leading-tight">
              {name || "Host Stand"}
            </span>
          </div>
        )}

        {type === "WALL" && (
          <div
            className="size-full opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, currentColor, currentColor 2px, transparent 2px, transparent 6px)",
            }}
          />
        )}

        {type === "PLANT" && (
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Sprout className="size-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
        )}

        {children}
      </div>
    </div>
  )
})

