import React, { useMemo } from "react"
import { Users, Check } from "lucide-react"
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

interface ChairItem {
  id: string
  style: React.CSSProperties
}

interface PlateItem {
  id: string
  style: React.CSSProperties
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

export function TableGraphic({
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
}: TableGraphicProps) {
  const statusCfg = statusTheme[status] || statusTheme.AVAILABLE

  // Dynamic dimension calculations for responsive styling
  const minDim = Math.min(width, height)
  const isVeryCompact = minDim < 68 || width < 75 || height < 60
  const isCompact = minDim < 95 || width < 105 || height < 75
  const isLarge = minDim >= 120 && width >= 130
  const showPlates = minDim >= 80 && !isCompact

  const { chairs, plates } = useMemo(
    () => computeChairsAndPlates(shape, capacity, width, height, showPlates),
    [shape, capacity, width, height, showPlates],
  )

  // Shape geometry
  const isCircle = shape === "CIRCLE"
  const tableRadiusClass = isCircle ? "rounded-full" : shape === "SQUARE" ? "rounded-xl" : "rounded-2xl"

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center select-none overflow-visible",
        !isSelectable && "opacity-45 grayscale-[25%]",
        className,
      )}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* 1. Surrounding Dining Chairs */}
      {chairs.map((chair) => (
        <div
          key={chair.id}
          className={cn(
            "absolute z-0 rounded-full border shadow-xs transition-colors pointer-events-none",
            statusCfg.chairBg,
            statusCfg.chairBorder,
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
          "relative z-10 flex size-full flex-col items-center justify-center text-center transition-all overflow-hidden",
          "border-2 shadow-md bg-gradient-to-b",
          tableRadiusClass,
          statusCfg.tableBorder,
          statusCfg.tableBg,
          isSelected
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
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
        {/* Subtle tabletop architectural inlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-1 border shadow-inner",
            tableRadiusClass,
            statusCfg.tableInset,
          )}
        />

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

        {/* Selected Checkmark Badge */}
        {isSelected && (
          <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 z-30 flex size-5 items-center justify-center rounded-full shadow-md">
            <Check className="size-3 stroke-[3]" />
          </span>
        )}

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
}
