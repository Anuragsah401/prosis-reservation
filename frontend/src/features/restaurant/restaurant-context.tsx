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
  const [profile, setProfile] = useState<RestaurantProfile | null>(() => {
    const user = authClient.getUser()
    return (user?.restaurant as RestaurantProfile | undefined) ?? null
  })
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

      // Keep user.restaurant in localStorage in sync with latest profile
      const user = authClient.getUser()
      if (user) {
        localStorage.setItem("prosisit:auth:user", JSON.stringify({ ...user, restaurant: data }))
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // If the token is invalid/expired, clean up session
        authClient.logout()
        setProfile(null)
      } else {
        // For network/404 errors, fallback to user.restaurant if available
        const user = authClient.getUser()
        if (user?.restaurant) {
          setProfile(user.restaurant as RestaurantProfile)
        }
      }
      setError(err instanceof Error ? err.message : "Failed to load restaurant profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()

    const handleAuthChange = () => {
      void load()
    }

    window.addEventListener("auth:state-change", handleAuthChange)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      window.removeEventListener("auth:state-change", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
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
