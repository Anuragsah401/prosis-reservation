import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { API_URL } from "@/lib/config"
import { authClient } from "@/features/auth/auth-client"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import type { RealtimeEvent, RealtimeEventType, RealtimeListener } from "./realtime-types"

interface RealtimeContextValue {
  isConnected: boolean
  lastEvent: RealtimeEvent | null
  subscribe: (type: RealtimeEventType | "*", listener: RealtimeListener) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useRestaurant()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  
  const listenersRef = useRef<Map<string, Set<RealtimeListener>>>(new Map())
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)

  const subscribe = useCallback((type: RealtimeEventType | "*", listener: RealtimeListener) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set())
    }
    const set = listenersRef.current.get(type)!
    set.add(listener)

    return () => {
      set.delete(listener)
      if (set.size === 0) {
        listenersRef.current.delete(type)
      }
    }
  }, [])

  const dispatchEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event)

    // Dispatch to specific listeners
    const specificListeners = listenersRef.current.get(event.type)
    if (specificListeners) {
      for (const listener of specificListeners) {
        try {
          listener(event)
        } catch (err) {
          console.error(`[realtime] Listener error for ${event.type}:`, err)
        }
      }
    }

    // Dispatch to wildcard listeners
    const wildcardListeners = listenersRef.current.get("*")
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        try {
          listener(event)
        } catch (err) {
          console.error("[realtime] Wildcard listener error:", err)
        }
      }
    }
  }, [])

  const connect = useCallback(() => {
    const user = authClient.getUser()
    const activeRestaurantId = profile?.id ?? user?.restaurantId ?? user?.restaurant?.id ?? null
    if (!activeRestaurantId) return
    const token = authClient.getToken()
    if (!token) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const url = `${API_URL}/realtime/stream?restaurantId=${encodeURIComponent(
      activeRestaurantId,
    )}&token=${encodeURIComponent(token)}`

    try {
      const es = new EventSource(url)
      eventSourceRef.current = es

      es.onopen = () => {
        setIsConnected(true)
        retryCountRef.current = 0
      }

      es.onmessage = (e) => {
        try {
          const data: RealtimeEvent = JSON.parse(e.data)
          dispatchEvent(data)
        } catch (err) {
          console.error("[realtime] Failed to parse message:", err)
        }
      }

      es.onerror = () => {
        setIsConnected(false)
        es.close()
        eventSourceRef.current = null

        // Exponential backoff reconnect
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 10_000)
        retryCountRef.current += 1

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    } catch (err) {
      console.error("[realtime] Failed to initialize EventSource:", err)
    }
  }, [profile?.id, dispatchEvent])

  useEffect(() => {
    connect()

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        // Re-verify connection on tab refocus
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connect()
        }
      }
    }

    const handleAuthChange = () => {
      connect()
    }

    window.addEventListener("auth:state-change", handleAuthChange)
    document.addEventListener("visibilitychange", handleVisibilityOrFocus)
    window.addEventListener("focus", handleVisibilityOrFocus)
    window.addEventListener("online", connect)

    return () => {
      window.removeEventListener("auth:state-change", handleAuthChange)
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus)
      window.removeEventListener("focus", handleVisibilityOrFocus)
      window.removeEventListener("online", connect)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect])

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}

export function useRealtimeListener<T = any>(
  type: RealtimeEventType | "*",
  callback: RealtimeListener<T>,
  deps: React.DependencyList = [],
) {
  const { subscribe } = useRealtime()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const unsubscribe = subscribe(type, (event) => {
      callbackRef.current(event)
    })
    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, type, ...deps])
}
