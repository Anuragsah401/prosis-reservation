import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { fetchRestaurantProfile, type RestaurantProfile } from "@/features/restaurant/restaurant-api"
import { authClient } from "@/features/auth/auth-client"
import { ApiError } from "@/lib/api-client"

interface RestaurantContextValue {
  profile: RestaurantProfile | null
  loading: boolean
  error: string | null
  refresh: () => void
}

const RestaurantContext = createContext<RestaurantContextValue>({
  profile: null,
  loading: false,
  error: null,
  refresh: () => {},
})

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<RestaurantProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!authClient.isAuthenticated()) {
      setProfile(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchRestaurantProfile()
      setProfile(data)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        // If the token is invalid or the restaurant was deleted, clean up the stale local session
        authClient.logout()
        setProfile(null)
      }
      setError(err instanceof Error ? err.message : "Failed to load restaurant profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <RestaurantContext.Provider value={{ profile, loading, error, refresh: load }}>
      {children}
    </RestaurantContext.Provider>
  )
}

export function useRestaurant(): RestaurantContextValue {
  return useContext(RestaurantContext)
}
