/**
 * Tiny module-level pub/sub so any part of the app can ask the notification
 * bell to refetch without sharing component state. The reservation mutations
 * (`reservations-api.ts`) emit after every successful create/update/status
 * change/delete, and `useNotifications` subscribes and refetches from the
 * backend — that's how the bell updates the instant staff act, instead of
 * waiting for the next poll.
 */

type Listener = () => void

const listeners = new Set<Listener>()

export function subscribeToNotificationRefresh(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitNotificationRefresh() {
  listeners.forEach((listener) => listener())
}
