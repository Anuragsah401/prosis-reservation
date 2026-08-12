import { apiClient, getCurrentRestaurantId, ApiError } from "@/lib/api-client"
import type {
  CalendarReservation,
  ReservationStatus,
} from "@/features/reservations-calendar/calendar-data"

interface CreateReservationOnServerInput {
  customerName: string
  customerPhone?: string
  customerEmail?: string
  partySize: number
  reservedFor: string
  /** Omitted when the guest will choose their own table on the confirm page. */
  tableId?: string
  notes?: string
  /** Set to "CHECKED_IN" for walk-ins, which are seated immediately. */
  status?: "CHECKED_IN"
}

interface ApiCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

/** Shape returned by `GET /api/reservations?restaurantId=...`. */
interface ApiReservation {
  id: string
  partySize: number
  reservedFor: string
  status: ReservationStatus
  notes: string | null
  tableId: string | null
  customer: ApiCustomer | null
  table: { id: string; name: string; location: string | null } | null
}

/** Fallback duration, in minutes, for reservations (the API doesn't store one). */
const DEFAULT_DURATION_MINUTES = 90

/**
 * Maps a reservation from the API into the `CalendarReservation` shape the
 * list/calendar/timeline components already render, so the UI components
 * don't need to change alongside the data source.
 */
function toCalendarReservation(r: ApiReservation): CalendarReservation {
  return {
    id: r.id,
    customerId: r.customer?.id ?? undefined,
    customerName: r.customer?.name ?? "Guest",
    customerPhone: r.customer?.phone ?? "",
    customerEmail: r.customer?.email ?? undefined,
    tableId: r.tableId ?? "",
    tableName: r.table?.name ?? undefined,
    partySize: r.partySize,
    start: r.reservedFor,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    status: r.status,
    notes: r.notes ?? undefined,
  }
}

/**
 * Loads the restaurant's reservations from the backend. Returns an empty
 * array when there's no signed-in restaurant context, so callers can render
 * an empty list rather than special-casing null.
 */
export async function fetchReservations(): Promise<CalendarReservation[]> {
  const restaurantId = getCurrentRestaurantId()
  if (!restaurantId) return []

  const reservations = await apiClient.get<ApiReservation[]>(
    `/reservations?restaurantId=${restaurantId}`,
  )
  return reservations.map(toCalendarReservation)
}

/**
 * Persists a reservation status change (e.g. marking a guest as seated).
 * The backend enforces which transitions are legal.
 */
export async function updateReservationStatusOnServer(id: string, status: ReservationStatus) {
  await apiClient.patch(`/reservations/${id}/status`, { status })
}

/** Editable reservation fields. `tableName` is client-side only (used to
 * re-render the row) and is never sent to the backend. */
export interface UpdateReservationChanges {
  /** New ISO start datetime. */
  start?: string
  partySize?: number
  /** New table assignment. Omit to leave the current assignment untouched. */
  tableId?: string
  /** Display name of the newly assigned table (not sent to the backend). */
  tableName?: string
  notes?: string
}

/**
 * Persists edits to a reservation (time, party size, table, notes). The
 * backend's update endpoint supports exactly these fields; customer contact
 * info is intentionally excluded since the customer record is shared across
 * that guest's reservations.
 */
export async function updateReservationOnServer(id: string, changes: UpdateReservationChanges) {
  const body: Record<string, unknown> = {}
  if (changes.start !== undefined) body.reservedFor = changes.start
  if (changes.partySize !== undefined) body.partySize = changes.partySize
  if (changes.tableId !== undefined) body.tableId = changes.tableId
  if (changes.notes !== undefined) body.notes = changes.notes
  await apiClient.patch(`/reservations/${id}`, body)
}

/** Permanently deletes a reservation. Throws on failure. */
export async function deleteReservationOnServer(id: string) {
  await apiClient.delete(`/reservations/${id}`)
}

/**
 * Updates a customer's contact details. Used when editing a reservation's
 * guest info — the reservation itself references the customer by id, so
 * editing the shared record keeps every one of that guest's reservations
 * consistent.
 */
export async function updateCustomerOnServer(
  id: string,
  changes: { name?: string; email?: string | null; phone?: string | null },
) {
  await apiClient.patch(`/customers/${id}`, changes)
}

/**
 * Persists a staff-created reservation to the backend, which triggers the
 * customer confirmation email (with a link to confirm and optionally choose
 * a table from the floor plan).
 *
 * Reuses an existing customer — matched by email first, then by phone — or
 * creates a new one, since the reservations API requires a customerId.
 *
 * Throws on failure. This used to swallow errors and return null, which made
 * a failed save look identical to a successful one: the row was added to
 * local state, the dialog closed, and the booking silently vanished on the
 * next refresh. A reservation that isn't persisted is a lost booking, so the
 * caller must surface the problem rather than hide it.
 */
export async function createReservationOnServer(
  input: CreateReservationOnServerInput,
): Promise<CalendarReservation> {
  const restaurantId = getCurrentRestaurantId()
  if (!restaurantId) {
    throw new ApiError("Your session has expired. Please sign in again.", 401)
  }

  const customers = await apiClient.get<ApiCustomer[]>(`/customers?restaurantId=${restaurantId}`)
  const email = input.customerEmail?.toLowerCase()

  // Email is the stronger identifier, so it's matched first. Checking both
  // in a single `find` let whichever record came first in the list win,
  // which meant a shared or stale phone number could hijack the match and
  // route the confirmation to a different guest's email address.
  let customer =
    (email ? customers.find((c) => c.email?.toLowerCase() === email) : undefined) ??
    (input.customerPhone ? customers.find((c) => c.phone === input.customerPhone) : undefined)

  if (!customer) {
    customer = await apiClient.post<ApiCustomer>("/customers", {
      restaurantId,
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone,
    })
  } else if (email && !customer.email) {
    // Matched on phone alone: record the email now so this guest gets the
    // richer email confirmation instead of falling back to SMS next time.
    // An existing, different email is left alone — overwriting it could
    // silently redirect another guest's confirmations.
    // Non-fatal: the reservation itself still saves without this.
    try {
      customer = await apiClient.patch<ApiCustomer>(`/customers/${customer.id}`, {
        email: input.customerEmail,
      })
    } catch (err) {
      console.error("[reservations] Failed to backfill customer email:", err)
    }
  }

  const created = await apiClient.post<ApiReservation>("/reservations", {
    restaurantId,
    customerId: customer.id,
    partySize: input.partySize,
    reservedFor: input.reservedFor,
    tableId: input.tableId,
    notes: input.notes,
    // JSON.stringify drops undefined, so ordinary reservations are unaffected.
    status: input.status,
  })

  // The create response omits the customer relation, so it's filled in from
  // the record resolved above — otherwise the new row would render as
  // "Guest" until the next refetch.
  return {
    ...toCalendarReservation(created),
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone ?? "",
    customerEmail: customer.email ?? undefined,
  }
}
