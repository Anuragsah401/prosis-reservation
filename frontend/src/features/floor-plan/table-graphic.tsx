import React, { useMemo } from "react"
import { Users, Check, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { TableShape, TableStatus } from "@/features/floor-plan/floor-plan-data"

export interface TableGraphicProps {
  name: string
  capacity: number
  shape: TableShape
  status?: TableStatus
  width?: number
  height?: number
  isSelected?: boolean
  isSelectable?: boolean
  location?: string
  seatsLabel?: string
  showStatusBadge?: boolean
  className?: string
  children?: React.ReactNode
  groupId?: string | null
  groupName?: string | null
}

const statusTheme: Record<TableStatus, {
  border: string
  tableBorder: string
  tableBg: string
  tableInset: string
  chairBg: string
  chairBorder: string
  plateBorder: string
  dot: string
  text: string
  badgeVariant: "default" | "secondary" | "outline" | "destructive"
}> = {
  AVAILABLE: {
    border: "border-emerald-500/70",
    tableBorder: "border-emerald-500/70 dark:border-emerald-400/60",
    tableBg: "from-card via-card to-emerald-950/5 dark:to-emerald-950/25",
    tableInset: "border-emerald-500/15 dark:border-emerald-400/20",
    chairBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
    chairBorder: "border-emerald-500/40 dark:border-emerald-400/40",
    plateBorder: "border-emerald-500/20 dark:border-emerald-400/30 bg-emerald-500/5",
    dot: "bg-emerald-500 shadow-emerald-500/50",
    text: "text-emerald-700 dark:text-emerald-400",
    badgeVariant: "default",
  },
  OCCUPIED: {
    border: "border-amber-500/70",
    tableBorder: "border-amber-500/70 dark:border-amber-400/60",
    tableBg: "from-card via-card to-amber-950/5 dark:to-amber-950/25",
    tableInset: "border-amber-500/15 dark:border-amber-400/20",
    chairBg: "bg-amber-500/15 dark:bg-amber-500/25",
    chairBorder: "border-amber-500/40 dark:border-amber-400/40",
    plateBorder: "border-amber-500/20 dark:border-amber-400/30 bg-amber-500/5",
    dot: "bg-amber-500 shadow-amber-500/50",
    text: "text-amber-700 dark:text-amber-400",
    badgeVariant: "secondary",
  },
  RESERVED: {
    border: "border-blue-500/70",
    tableBorder: "border-blue-500/70 dark:border-blue-400/60",
    tableBg: "from-card via-card to-blue-950/5 dark:to-blue-950/25",
    tableInset: "border-blue-500/15 dark:border-blue-400/20",
    chairBg: "bg-blue-500/15 dark:bg-blue-500/25",
    chairBorder: "border-blue-500/40 dark:border-blue-400/40",
    plateBorder: "border-blue-500/20 dark:border-blue-400/30 bg-blue-500/5",
    dot: "bg-blue-500 shadow-blue-500/50",
    text: "text-blue-700 dark:text-blue-400",
    badgeVariant: "outline",
  },
  MAINTENANCE: {
    border: "border-destructive/70",
    tableBorder: "border-destructive/70 dark:border-destructive/60",
    tableBg: "from-card via-card to-destructive/10",
    tableInset: "border-destructive/15",
    chairBg: "bg-destructive/15 dark:bg-destructive/25",
    chairBorder: "border-destructive/40",
    plateBorder: "border-destructive/20 bg-destructive/5",
    dot: "bg-destructive shadow-destructive/50",
    text: "text-destructive",
    badgeVariant: "destructive",
  },
}

export interface GroupColorTheme {
  id: string
  name: string
  innerBorder: string
  innerGlow: string
  outerRing: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  accentText: string
  chairRing: string
}

export const GROUP_COLOR_PALETTES: GroupColorTheme[] = [
  {
    id: "violet",
    name: "Violet",
    innerBorder: "border-2 border-violet-500 dark:border-violet-400",
    innerGlow: "bg-violet-500/10 dark:bg-violet-400/15 shadow-[inset_0_0_12px_rgba(139,92,246,0.3)]",
    outerRing: "shadow-violet-500/20",
    badgeBg: "bg-violet-600 dark:bg-violet-500",
    badgeText: "text-white",
    badgeBorder: "border-violet-400/60 shadow-xs",
    accentText: "text-violet-600 dark:text-violet-400",
    chairRing: "ring-1.5 ring-violet-500/60",
  },
  {
    id: "blue",
    name: "Blue",
    innerBorder: "border-2 border-blue-500 dark:border-blue-400",
    innerGlow: "bg-blue-500/10 dark:bg-blue-400/15 shadow-[inset_0_0_12px_rgba(59,130,246,0.3)]",
    outerRing: "shadow-blue-500/20",
    badgeBg: "bg-blue-600 dark:bg-blue-500",
    badgeText: "text-white",
    badgeBorder: "border-blue-400/60 shadow-xs",
    accentText: "text-blue-600 dark:text-blue-400",
    chairRing: "ring-1.5 ring-blue-500/60",
  },
  {
    id: "amber",
    name: "Amber",
    innerBorder: "border-2 border-amber-500 dark:border-amber-400",
    innerGlow: "bg-amber-500/10 dark:bg-amber-400/15 shadow-[inset_0_0_12px_rgba(245,158,11,0.3)]",
    outerRing: "shadow-amber-500/20",
    badgeBg: "bg-amber-600 dark:bg-amber-500",
    badgeText: "text-white",
    badgeBorder: "border-amber-400/60 shadow-xs",
    accentText: "text-amber-600 dark:text-amber-400",
    chairRing: "ring-1.5 ring-amber-500/60",
  },
  {
    id: "rose",
    name: "Rose",
    innerBorder: "border-2 border-rose-500 dark:border-rose-400",
    innerGlow: "bg-rose-500/10 dark:bg-rose-400/15 shadow-[inset_0_0_12px_rgba(244,63,94,0.3)]",
    outerRing: "shadow-rose-500/20",
    badgeBg: "bg-rose-600 dark:bg-rose-500",
    badgeText: "text-white",
    badgeBorder: "border-rose-400/60 shadow-xs",
    accentText: "text-rose-600 dark:text-rose-400",
    chairRing: "ring-1.5 ring-rose-500/60",
  },
  {
    id: "teal",
    name: "Teal",
    innerBorder: "border-2 border-teal-500 dark:border-teal-400",
    innerGlow: "bg-teal-500/10 dark:bg-teal-400/15 shadow-[inset_0_0_12px_rgba(20,184,166,0.3)]",
    outerRing: "shadow-teal-500/20",
    badgeBg: "bg-teal-600 dark:bg-teal-500",
    badgeText: "text-white",
    badgeBorder: "border-teal-400/60 shadow-xs",
    accentText: "text-teal-600 dark:text-teal-400",
    chairRing: "ring-1.5 ring-teal-500/60",
  },
  {
    id: "fuchsia",
    name: "Fuchsia",
    innerBorder: "border-2 border-fuchsia-500 dark:border-fuchsia-400",
    innerGlow: "bg-fuchsia-500/10 dark:bg-fuchsia-400/15 shadow-[inset_0_0_12px_rgba(217,70,239,0.3)]",
    outerRing: "shadow-fuchsia-500/20",
    badgeBg: "bg-fuchsia-600 dark:bg-fuchsia-500",
    badgeText: "text-white",
    badgeBorder: "border-fuchsia-400/60 shadow-xs",
    accentText: "text-fuchsia-600 dark:text-fuchsia-400",
    chairRing: "ring-1.5 ring-fuchsia-500/60",
  },
  {
    id: "emerald",
    name: "Emerald",
    innerBorder: "border-2 border-emerald-500 dark:border-emerald-400",
    innerGlow: "bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_12px_rgba(16,185,129,0.3)]",
    outerRing: "shadow-emerald-500/20",
    badgeBg: "bg-emerald-600 dark:bg-emerald-500",
    badgeText: "text-white",
    badgeBorder: "border-emerald-400/60 shadow-xs",
    accentText: "text-emerald-600 dark:text-emerald-400",
    chairRing: "ring-1.5 ring-emerald-500/60",
  },
  {
    id: "indigo",
    name: "Indigo",
    innerBorder: "border-2 border-indigo-500 dark:border-indigo-400",
    innerGlow: "bg-indigo-500/10 dark:bg-indigo-400/15 shadow-[inset_0_0_12px_rgba(99,102,241,0.3)]",
    outerRing: "shadow-indigo-500/20",
    badgeBg: "bg-indigo-600 dark:bg-indigo-500",
    badgeText: "text-white",
    badgeBorder: "border-indigo-400/60 shadow-xs",
    accentText: "text-indigo-600 dark:text-indigo-400",
    chairRing: "ring-1.5 ring-indigo-500/60",
  },
]

const groupThemeCache = new Map<string, GroupColorTheme>()

export function getGroupColorTheme(groupId: string | null | undefined): GroupColorTheme | null {
  if (!groupId) return null
  const cached = groupThemeCache.get(groupId)
  if (cached) return cached

  let hash = 0
  for (let i = 0; i < groupId.length; i++) {
    hash = (hash << 5) - hash + groupId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % GROUP_COLOR_PALETTES.length
  const theme = GROUP_COLOR_PALETTES[index]
  groupThemeCache.set(groupId, theme)
  return theme
}

interface ChairItem {
  id: string
  style: React.CSSProperties
}

interface PlateItem {
  id: string
  style: React.CSSProperties
}

const chairPlatesCache = new Map<string, { chairs: ChairItem[]; plates: PlateItem[] }>()

function getCachedChairsAndPlates(
  shape: TableShape,
  capacity: number,
  w: number,
  h: number,
  showPlates: boolean,
): { chairs: ChairItem[]; plates: PlateItem[] } {
  const key = `${shape}:${capacity}:${w}:${h}:${showPlates}`
  let res = chairPlatesCache.get(key)
  if (!res) {
    res = computeChairsAndPlates(shape, capacity, w, h, showPlates)
    if (chairPlatesCache.size > 300) chairPlatesCache.clear()
    chairPlatesCache.set(key, res)
  }
  return res
}

/**
 * Computes realistic dining chairs and tableware place settings
 * that dynamically scale and position along the table perimeter.
 */
function computeChairsAndPlates(
  shape: TableShape,
  capacity: number,
  w: number,
  h: number,
  showPlates: boolean,
): { chairs: ChairItem[]; plates: PlateItem[] } {
  const count = Math.max(1, Math.min(capacity, 16))
  const chairs: ChairItem[] = []
  const plates: PlateItem[] = []

  const minDim = Math.min(w, h)
  // Dynamic chair sizing proportional to table dimensions
  const chairW = Math.min(22, Math.max(10, Math.round(minDim * 0.18)))
  const chairD = Math.min(10, Math.max(5, Math.round(chairW * 0.44)))
  const plateSize = Math.min(14, Math.max(7, Math.round(minDim * 0.12)))
  const inset = 1

  if (shape === "CIRCLE") {
    const radius = minDim / 2 - chairD / 2 - 2
    const plateRadius = Math.max(10, minDim / 2 - chairD - plateSize / 2 - 5)
    const cx = w / 2
    const cy = h / 2

    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      const deg = (angle * 180) / Math.PI + 90

      chairs.push({
        id: `c-${i}`,
        style: {
          left: `${x}px`,
          top: `${y}px`,
          width: `${chairW}px`,
          height: `${chairD}px`,
          transform: `translate(-50%, -50%) rotate(${deg}deg)`,
        },
      })

      if (showPlates) {
        const px = cx + plateRadius * Math.cos(angle)
        const py = cy + plateRadius * Math.sin(angle)
        plates.push({
          id: `p-${i}`,
          style: {
            left: `${px}px`,
            top: `${py}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, -50%)",
          },
        })
      }
    }

    return { chairs, plates }
  }

  // RECTANGLE or SQUARE
  const isSquare = shape === "SQUARE" || Math.abs(w - h) < 18
  const plateInset = Math.min(18, Math.max(9, Math.round(minDim * 0.14)))

  if (isSquare) {
    const sides = [
      { side: "top", count: 0 },
      { side: "bottom", count: 0 },
      { side: "left", count: 0 },
      { side: "right", count: 0 },
    ]

    for (let i = 0; i < count; i++) {
      sides[i % 4].count++
    }

    sides.forEach(({ side, count: sCount }) => {
      for (let j = 0; j < sCount; j++) {
        const frac = (j + 1) / (sCount + 1)
        if (side === "top") {
          chairs.push({
            id: `sq-top-${j}`,
            style: {
              left: `${w * frac}px`,
              top: `${inset + chairD / 2}px`,
              width: `${chairW}px`,
              height: `${chairD}px`,
              transform: "translate(-50%, -50%)",
            },
          })
          if (showPlates) {
            plates.push({
              id: `p-top-${j}`,
              style: {
                left: `${w * frac}px`,
                top: `${plateInset}px`,
                width: `${plateSize}px`,
                height: `${plateSize}px`,
                transform: "translate(-50%, -50%)",
              },
            })
          }
        } else if (side === "bottom") {
          chairs.push({
            id: `sq-bot-${j}`,
            style: {
              left: `${w * frac}px`,
              bottom: `${inset}px`,
              width: `${chairW}px`,
              height: `${chairD}px`,
              transform: "translate(-50%, 50%)",
            },
          })
          if (showPlates) {
            plates.push({
              id: `p-bot-${j}`,
              style: {
                left: `${w * frac}px`,
                bottom: `${plateInset}px`,
                width: `${plateSize}px`,
                height: `${plateSize}px`,
                transform: "translate(-50%, 50%)",
              },
            })
          }
        } else if (side === "left") {
          chairs.push({
            id: `sq-left-${j}`,
            style: {
              left: `${inset + chairD / 2}px`,
              top: `${h * frac}px`,
              width: `${chairD}px`,
              height: `${chairW}px`,
              transform: "translate(-50%, -50%)",
            },
          })
          if (showPlates) {
            plates.push({
              id: `p-left-${j}`,
              style: {
                left: `${plateInset}px`,
                top: `${h * frac}px`,
                width: `${plateSize}px`,
                height: `${plateSize}px`,
                transform: "translate(-50%, -50%)",
              },
            })
          }
        } else if (side === "right") {
          chairs.push({
            id: `sq-right-${j}`,
            style: {
              right: `${inset}px`,
              top: `${h * frac}px`,
              width: `${chairD}px`,
              height: `${chairW}px`,
              transform: "translate(50%, -50%)",
            },
          })
          if (showPlates) {
            plates.push({
              id: `p-right-${j}`,
              style: {
                right: `${plateInset}px`,
                top: `${h * frac}px`,
                width: `${plateSize}px`,
                height: `${plateSize}px`,
                transform: "translate(50%, -50%)",
              },
            })
          }
        }
      }
    })

    return { chairs, plates }
  }

  // RECTANGLE
  const isWide = w >= h
  const longSideCount = Math.max(1, Math.floor(count / 2))
  const shortSideCount = count - longSideCount * 2 > 0 ? count - longSideCount * 2 : 0

  if (isWide) {
    for (let i = 0; i < longSideCount; i++) {
      const frac = (i + 1) / (longSideCount + 1)
      chairs.push({
        id: `top-${i}`,
        style: {
          left: `${w * frac}px`,
          top: `${inset + chairD / 2}px`,
          width: `${chairW}px`,
          height: `${chairD}px`,
          transform: "translate(-50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: `p-top-${i}`,
          style: {
            left: `${w * frac}px`,
            top: `${plateInset}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, -50%)",
          },
        })
      }

      chairs.push({
        id: `bot-${i}`,
        style: {
          left: `${w * frac}px`,
          bottom: `${inset}px`,
          width: `${chairW}px`,
          height: `${chairD}px`,
          transform: "translate(-50%, 50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: `p-bot-${i}`,
          style: {
            left: `${w * frac}px`,
            bottom: `${plateInset}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, 50%)",
          },
        })
      }
    }

    if (shortSideCount >= 1) {
      chairs.push({
        id: "left-0",
        style: {
          left: `${inset + chairD / 2}px`,
          top: `${h * 0.5}px`,
          width: `${chairD}px`,
          height: `${chairW}px`,
          transform: "translate(-50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: "p-left-0",
          style: {
            left: `${plateInset}px`,
            top: `${h * 0.5}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, -50%)",
          },
        })
      }
    }

    if (shortSideCount >= 2) {
      chairs.push({
        id: "right-0",
        style: {
          right: `${inset}px`,
          top: `${h * 0.5}px`,
          width: `${chairD}px`,
          height: `${chairW}px`,
          transform: "translate(50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: "p-right-0",
          style: {
            right: `${plateInset}px`,
            top: `${h * 0.5}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(50%, -50%)",
          },
        })
      }
    }
  } else {
    // Tall rectangle
    for (let i = 0; i < longSideCount; i++) {
      const frac = (i + 1) / (longSideCount + 1)
      chairs.push({
        id: `left-${i}`,
        style: {
          left: `${inset + chairD / 2}px`,
          top: `${h * frac}px`,
          width: `${chairD}px`,
          height: `${chairW}px`,
          transform: "translate(-50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: `p-left-${i}`,
          style: {
            left: `${plateInset}px`,
            top: `${h * frac}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, -50%)",
          },
        })
      }

      chairs.push({
        id: `right-${i}`,
        style: {
          right: `${inset}px`,
          top: `${h * frac}px`,
          width: `${chairD}px`,
          height: `${chairW}px`,
          transform: "translate(50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: `p-right-${i}`,
          style: {
            right: `${plateInset}px`,
            top: `${h * frac}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(50%, -50%)",
          },
        })
      }
    }

    if (shortSideCount >= 1) {
      chairs.push({
        id: "top-0",
        style: {
          left: `${w * 0.5}px`,
          top: `${inset + chairD / 2}px`,
          width: `${chairW}px`,
          height: `${chairD}px`,
          transform: "translate(-50%, -50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: "p-top-0",
          style: {
            left: `${w * 0.5}px`,
            top: `${plateInset}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, -50%)",
          },
        })
      }
    }

    if (shortSideCount >= 2) {
      chairs.push({
        id: "bot-0",
        style: {
          left: `${w * 0.5}px`,
          bottom: `${inset}px`,
          width: `${chairW}px`,
          height: `${chairD}px`,
          transform: "translate(-50%, 50%)",
        },
      })
      if (showPlates) {
        plates.push({
          id: "p-bot-0",
          style: {
            left: `${w * 0.5}px`,
            bottom: `${plateInset}px`,
            width: `${plateSize}px`,
            height: `${plateSize}px`,
            transform: "translate(-50%, 50%)",
          },
        })
      }
    }
  }

  return { chairs, plates }
}

export const TableGraphic = React.memo(function TableGraphic({
  name,
  capacity,
  shape,
  status = "AVAILABLE",
  width = 140,
  height = 90,
  isSelected = false,
  isSelectable = true,
  location,
  seatsLabel = "seats",
  showStatusBadge = false,
  className,
  children,
  groupId,
  groupName,
}: TableGraphicProps) {
  const statusCfg = statusTheme[status] || statusTheme.AVAILABLE
  const groupTheme = useMemo(() => getGroupColorTheme(groupId), [groupId])

  // Dynamic dimension calculations for responsive styling
  const minDim = Math.min(width, height)
  const isVeryCompact = minDim < 68 || width < 75 || height < 60
  const isCompact = minDim < 95 || width < 105 || height < 75
  const isLarge = minDim >= 120 && width >= 130
  const showPlates = minDim >= 80 && !isCompact

  const { chairs, plates } = useMemo(
    () => getCachedChairsAndPlates(shape, capacity, width, height, showPlates),
    [shape, capacity, width, height, showPlates],
  )

  // Shape geometry
  const isCircle = shape === "CIRCLE"
  const tableRadiusClass = isCircle ? "rounded-full" : shape === "SQUARE" ? "rounded-xl" : "rounded-2xl"

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center select-none overflow-visible [contain:layout_style]",
        !isSelectable && "opacity-45 grayscale-[25%]",
        className,
      )}
      style={{ width: `${width}px`, height: `${height}px`, willChange: "transform" }}
    >
      {/* Selection Checkmark (Rendered on outer overflow-visible container so it is NEVER clipped) */}
      {isSelected && (
        <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 z-40 flex size-5 items-center justify-center rounded-full shadow-md">
          <Check className="size-3 stroke-[3]" />
        </span>
      )}

      {/* Group Badge Indicator (Rendered on outer overflow-visible container so it is NEVER clipped) */}
      {(groupName || groupId) && groupTheme && (
        <span
          className={cn(
            "absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full font-bold shadow-md px-2.5 py-0.5 border text-center transition-colors whitespace-nowrap pointer-events-none select-none",
            groupTheme.badgeBg,
            groupTheme.badgeText,
            groupTheme.badgeBorder,
            isVeryCompact
              ? "text-[9px] px-1.5 py-0"
              : isCompact
              ? "text-[10px] px-2 py-0.5"
              : "text-[11px] px-2.5 py-0.5",
          )}
          title={`Group: ${groupName || "Linked Group"}`}
        >
          <Link2 className="size-3 shrink-0 stroke-[2.5]" />
          <span className="truncate max-w-[130px] font-bold">{groupName || "Linked"}</span>
        </span>
      )}

      {/* 1. Surrounding Dining Chairs */}
      {chairs.map((chair) => (
        <div
          key={chair.id}
          className={cn(
            "absolute z-0 rounded-full border shadow-xs pointer-events-none",
            statusCfg.chairBg,
            statusCfg.chairBorder,
            groupTheme && groupTheme.chairRing,
            isSelected && "border-primary/60 bg-primary/20",
          )}
          style={chair.style}
        >
          {/* Subtle ergonomic chair backrest curve */}
          <div className="size-full rounded-full border-t border-foreground/15 dark:border-white/20 bg-background/30" />
        </div>
      ))}

      {/* 2. Realistic Table Top Surface */}
      <div
        className={cn(
          "relative z-10 flex size-full flex-col items-center justify-center text-center transition-[border-color,box-shadow,background-color] duration-150 overflow-hidden",
          "border-2 shadow-md bg-gradient-to-b",
          tableRadiusClass,
          statusCfg.tableBorder,
          statusCfg.tableBg,
          isSelected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
            : isSelectable
            ? "hover:border-primary/80 hover:shadow-lg"
            : "",
        )}
        style={{
          margin: "4px",
          width: `calc(100% - 8px)`,
          height: `calc(100% - 8px)`,
        }}
      >
        {/* Same-color inner border recognition for grouped tables */}
        {groupTheme ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-1.5 z-10 transition-all",
              tableRadiusClass,
              groupTheme.innerBorder,
              groupTheme.innerGlow,
            )}
          />
        ) : (
          <div
            className={cn(
              "pointer-events-none absolute inset-1 border shadow-inner",
              tableRadiusClass,
              statusCfg.tableInset,
            )}
          />
        )}

        {/* Subtle Glass/Surface Reflection Highlight */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-2 top-0 h-1/2 bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent",
            tableRadiusClass,
          )}
        />

        {/* 3. Elegant Tableware Place Settings (Plates) */}
        {plates.map((plate) => (
          <div
            key={plate.id}
            className={cn(
              "pointer-events-none absolute rounded-full border shadow-2xs transition-colors",
              statusCfg.plateBorder,
            )}
            style={plate.style}
          >
            {/* Center plate rim */}
            <div className="absolute inset-0.5 rounded-full border border-foreground/5 dark:border-white/5" />
          </div>
        ))}

        {/* 4. Adaptive Centerpiece & Typography Container */}
        <div
          className={cn(
            "relative z-20 flex flex-col items-center justify-center w-full px-1 overflow-hidden",
            isVeryCompact ? "gap-0" : isCompact ? "gap-0.5" : "gap-1",
          )}
        >
          {/* Table Name & Status Dot */}
          <div className="flex items-center justify-center gap-1 max-w-full px-1">
            {/* Pulsing Status Dot in compact view */}
            {isCompact && (
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full shadow-xs",
                  statusCfg.dot,
                )}
              />
            )}
            <span
              className={cn(
                "text-foreground font-bold tracking-tight leading-tight truncate drop-shadow-xs",
                isVeryCompact
                  ? "text-[10px]"
                  : isCompact
                  ? "text-xs"
                  : isLarge
                  ? "text-sm sm:text-base font-extrabold"
                  : "text-xs sm:text-sm",
              )}
              title={name}
            >
              {name}
            </span>
          </div>

          {/* Group Name in Centerpiece */}
          {(groupName || groupId) && groupTheme && (
            <div className="flex items-center justify-center gap-1 max-w-full px-1">
              <span
                className={cn(
                  "font-bold truncate tracking-tight flex items-center gap-0.5",
                  groupTheme.accentText,
                  isVeryCompact ? "text-[8px]" : isCompact ? "text-[9px]" : "text-[11px]",
                )}
                title={`Group: ${groupName || "Linked Group"}`}
              >
                <Link2 className={cn("shrink-0", isVeryCompact ? "size-2" : isCompact ? "size-2.5" : "size-3")} />
                <span className="truncate">{groupName || "Linked"}</span>
              </span>
            </div>
          )}

          {/* Status Badge (Only shown in medium/large when explicitly enabled) */}
          {showStatusBadge && !isCompact && (
            <Badge
              variant={statusCfg.badgeVariant}
              className="text-[9px] font-semibold leading-none px-1.5 py-0.5 max-w-[90%] truncate shadow-2xs"
            >
              {status}
            </Badge>
          )}

          {/* Party Capacity & Location Info */}
          <div
            className={cn(
              "text-muted-foreground flex items-center justify-center gap-1 font-medium leading-none max-w-full px-1 truncate",
              isVeryCompact
                ? "text-[9px] mt-0.5"
                : isCompact
                ? "text-[10px]"
                : "text-[11px]",
            )}
          >
            <Users
              className={cn(
                "shrink-0 opacity-75",
                isVeryCompact ? "size-2" : isCompact ? "size-2.5" : "size-3",
              )}
            />
            <span className="truncate">
              {isVeryCompact
                ? capacity
                : isCompact
                ? `${capacity}p`
                : `${capacity} ${seatsLabel}`}
            </span>
            {location && !isCompact && height >= 80 && (
              <span className="opacity-70 truncate max-w-[70px]">
                · {location}
              </span>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
})
