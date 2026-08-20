import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { fetchRestaurantProfile, type RestaurantProfile } from "@/features/restaurant/restaurant-api"

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
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRestaurantProfile()
      setProfile(data)
    } catch (err) {
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
