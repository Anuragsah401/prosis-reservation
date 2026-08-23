import { apiClient } from "@/lib/api-client"

export interface RestaurantProfile {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  timezone: string
  /** Opening time as minutes from midnight (e.g. 11:00 = 660). */
  openingTime: number
  /** Closing time as minutes from midnight (e.g. 23:00 = 1380). */
  closingTime: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Fetches the current restaurant's profile (including opening/closing hours). */
export async function fetchRestaurantProfile(): Promise<RestaurantProfile> {
  return apiClient.get<RestaurantProfile>("/restaurants/profile")
}

/** Updates the restaurant's profile. */
export async function updateRestaurantProfile(
  id: string,
  data: Partial<{
    name: string
    email: string | null
    phone: string | null
    address: string | null
    timezone: string
    openingTime: number
    closingTime: number
  }>,
): Promise<RestaurantProfile> {
  return apiClient.patch<RestaurantProfile>(`/restaurants/${id}`, data)
}

/**
 * Converts minutes-from-midnight (e.g. 660 = 11:00) to hours for the calendar
 * grid (e.g. 11).
 */
export function minutesToHour(minutes: number): number {
  return Math.floor(minutes / 60)
}

/** Converts minutes-from-midnight to a "HH:MM" string. */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(h)}:${pad(m)}`
}

/** Converts "HH:MM" string to minutes-from-midnight. */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}
