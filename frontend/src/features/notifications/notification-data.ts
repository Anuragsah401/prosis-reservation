export type NotificationType =
  | "reservation_new"
  | "reservation_confirmed"
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

export const notificationTypeLabels: Record<NotificationType, string> = {
  reservation_new: "New reservation",
  reservation_confirmed: "Confirmation",
  reservation_cancelled: "Cancellation",
  reservation_updated: "Update",
  waitlist: "Waitlist",
  system: "System",
}
