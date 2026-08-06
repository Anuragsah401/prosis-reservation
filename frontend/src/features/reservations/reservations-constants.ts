import type { ReservationStatus } from "@/features/reservations-calendar/calendar-data"

export const statusStyles: Record<ReservationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CHECKED_IN: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
}

export const statusCellStyles: Record<ReservationStatus, string> = {
  PENDING: "bg-yellow-500/15 dark:bg-yellow-500/10",
  CONFIRMED: "bg-blue-500/15 dark:bg-blue-500/10",
  CHECKED_IN: "bg-green-500/15 dark:bg-green-500/10",
  COMPLETED: "bg-muted",
  CANCELLED: "bg-destructive/15 dark:bg-destructive/10",
  NO_SHOW: "bg-destructive/15 dark:bg-destructive/10",
}

export const statusOptions: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]

export const statusSortOrder: Record<ReservationStatus, number> = {
  CONFIRMED: 0,
  CHECKED_IN: 1,
  PENDING: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  NO_SHOW: 5,
}

/** Selectable food category/dietary tags shown in the New Reservation form. */
export const FOOD_CATEGORY_VALUES = [
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "vegetarian",
  "glutenFree",
  "dessert",
] as const
