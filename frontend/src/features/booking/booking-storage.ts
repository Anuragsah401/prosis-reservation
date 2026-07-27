const STORAGE_KEY = "prosisit:public-bookings"

export interface BookingRequest {
  restaurantId: string
  date: string
  time: string
  guests: number
  name: string
  email: string
  phone: string
  notes?: string
}

export interface BookingConfirmation extends BookingRequest {
  id: string
  createdAt: string
  status: "PENDING"
}

/**
 * Placeholder for `POST /api/reservations`. The real endpoint requires a
 * `customerId` and (optionally) a `tableId`, which a public, unauthenticated
 * booking page cannot resolve on its own yet — that would require either:
 *   1. A public "create-or-find customer by email" step, or
 *   2. A dedicated public booking endpoint that creates the Customer +
 *      Reservation together server-side.
 * Until one of those exists, bookings are stored locally so the UI flow
 * (including a confirmation screen) is fully demonstrable end-to-end.
 */
export async function submitBooking(request: BookingRequest): Promise<BookingConfirmation> {
  await new Promise((resolve) => setTimeout(resolve, 600)) // simulate network latency

  const confirmation: BookingConfirmation = {
    ...request,
    id: `bk_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: "PENDING",
  }

  const existing = loadBookings()
  existing.push(confirmation)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

  return confirmation
}

export function loadBookings(): BookingConfirmation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
