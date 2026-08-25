import type { Response } from "express"

export type RealtimeEventType =
  | "RESERVATION_CREATED"
  | "RESERVATION_UPDATED"
  | "RESERVATION_STATUS_CHANGED"
  | "RESERVATION_DELETED"
  | "NOTIFICATION_NEW"
  | "NOTIFICATION_READ"
  | "TABLE_UPDATED"

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType
  payload?: T
  timestamp: string
}

interface ClientConnection {
  res: Response
  userId?: string
}

class RealtimeService {
  private clientsByRestaurant = new Map<string, Set<ClientConnection>>()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startHeartbeat()
  }

  /**
   * Registers an active SSE client connection for a restaurant.
   */
  public addClient(restaurantId: string, res: Response, userId?: string): () => void {
    if (!this.clientsByRestaurant.has(restaurantId)) {
      this.clientsByRestaurant.set(restaurantId, new Set())
    }

    const client: ClientConnection = { res, userId }
    const pool = this.clientsByRestaurant.get(restaurantId)!
    pool.add(client)

    // Return cleanup function
    return () => {
      pool.delete(client)
      if (pool.size === 0) {
        this.clientsByRestaurant.delete(restaurantId)
      }
    }
  }

  /**
   * Broadcasts a real-time event to all connected staff clients for a restaurant.
   */
  public broadcastToRestaurant<T = unknown>(
    restaurantId: string,
    type: RealtimeEventType,
    payload?: T,
  ): void {
    const pool = this.clientsByRestaurant.get(restaurantId)
    if (!pool || pool.size === 0) return

    const event: RealtimeEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    }

    const message = `data: ${JSON.stringify(event)}\n\n`

    for (const client of pool) {
      try {
        client.res.write(message)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[realtime] Failed to write event to client:", err)
        pool.delete(client)
      }
    }
  }

  /**
   * Sends a 15-second heartbeat ping (:keep-alive) to keep proxies and connections open.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [restaurantId, pool] of this.clientsByRestaurant.entries()) {
        for (const client of pool) {
          try {
            client.res.write(":keep-alive\n\n")
          } catch {
            pool.delete(client)
          }
        }
        if (pool.size === 0) {
          this.clientsByRestaurant.delete(restaurantId)
        }
      }
    }, 15_000)

    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref()
    }
  }
}

export const realtimeService = new RealtimeService()

