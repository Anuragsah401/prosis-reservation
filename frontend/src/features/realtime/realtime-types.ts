export type RealtimeEventType =
  | "CONNECTED"
  | "RESERVATION_CREATED"
  | "RESERVATION_UPDATED"
  | "RESERVATION_STATUS_CHANGED"
  | "RESERVATION_DELETED"
  | "NOTIFICATION_NEW"
  | "NOTIFICATION_READ"
  | "TABLE_UPDATED"

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType
  payload?: T
  timestamp: string
}

export type RealtimeListener<T = any> = (event: RealtimeEvent<T>) => void

