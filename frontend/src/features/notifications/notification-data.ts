export type NotificationType =
  | "reservation_new"
  | "reservation_cancelled"
  | "reservation_updated"
  | "waitlist"
  | "system"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  /** ISO timestamp string. */
  createdAt: string
  read: boolean
  /** Optional deep link, e.g. a reservation id to open on click. */
  href?: string
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

/**
 * Mock seed data used until the backend notifications endpoint is wired up.
 * Shape mirrors the expected API response so swapping in real data later
 * is a drop-in replacement — see `notification-service.ts`.
 */
export const initialNotifications: AppNotification[] = [
  {
    id: "n1",
    type: "reservation_new",
    title: "New reservation",
    message: "Henry Hall booked a table for 2 at 5:30 PM.",
    createdAt: minutesAgo(6),
    read: false,
  },
  {
    id: "n2",
    type: "waitlist",
    title: "Waitlist alert",
    message: "3 parties are waiting for a table tonight.",
    createdAt: minutesAgo(24),
    read: false,
  },
  {
    id: "n3",
    type: "reservation_cancelled",
    title: "Reservation cancelled",
    message: "Liam Martinez cancelled their 6:00 PM booking.",
    createdAt: minutesAgo(50),
    read: false,
  },
  {
    id: "n4",
    type: "reservation_updated",
    title: "Reservation updated",
    message: "Emma Rodriguez moved her booking to Table 5.",
    createdAt: minutesAgo(120),
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Welcome to Prosisit Table",
    message: "Your restaurant workspace is ready to go.",
    createdAt: minutesAgo(1440),
    read: true,
  },
]

export const notificationTypeLabels: Record<NotificationType, string> = {
  reservation_new: "New reservation",
  reservation_cancelled: "Cancellation",
  reservation_updated: "Update",
  waitlist: "Waitlist",
  system: "System",
}
