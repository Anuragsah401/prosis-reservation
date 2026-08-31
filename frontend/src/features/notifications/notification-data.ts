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

import type { TFunction } from "i18next"

export const notificationTypeLabels: Record<NotificationType, string> = {
  reservation_new: "New reservation",
  reservation_confirmed: "Confirmation",
  reservation_cancelled: "Cancellation",
  reservation_updated: "Update",
  waitlist: "Waitlist",
  system: "System",
}

export function getTranslatedNotificationTitle(
  title: string,
  t: TFunction,
): string {
  const titleKeyMap: Record<string, string> = {
    "Online booking received": "pages.notifications.titles.onlineBookingReceived",
    "Guest seated": "pages.notifications.titles.guestSeated",
    "Reservation completed": "pages.notifications.titles.reservationCompleted",
    "No-show": "pages.notifications.titles.noShow",
    "Reservation cancelled": "pages.notifications.titles.reservationCancelled",
    "Reservation confirmed": "pages.notifications.titles.reservationConfirmed",
    "Reservation updated": "pages.notifications.titles.reservationUpdated",
    "Reservation deleted": "pages.notifications.titles.reservationDeleted",
  }
  const key = titleKeyMap[title]
  return key ? t(key, title) : title
}
