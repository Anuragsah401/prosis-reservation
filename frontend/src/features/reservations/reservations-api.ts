import { apiClient, getCurrentRestaurantId, ApiError } from "@/lib/api-client"
import { emitNotificationRefresh } from "@/features/notifications/notification-events"
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

import { normalizeStatus, parseReservationNotes } from "./reservations-utils"

/** Fallback duration, in minutes, for reservations (the API doesn't store one). */
const DEFAULT_DURATION_MINUTES = 90

/**
 * Maps a reservation from the API into the `CalendarReservation` shape the
 * list/calendar/timeline components already render, so the UI components
 * don't need to change alongside the data source.
 */
function toCalendarReservation(r: ApiReservation): CalendarReservation {
  const parsed = parseReservationNotes(r.notes)
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
    status: normalizeStatus(r.status),
    notes: r.notes ?? undefined,
    specialRequests: parsed.specialRequests,
    foodCategories: parsed.foodCategories.length > 0 ? parsed.foodCategories : undefined,
    eventType: parsed.eventType,
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
  // The backend records this status change as a notification (seated,
  // cancelled, completed, ...), so ask the bell to refetch right away.
  emitNotificationRefresh()
}

/** Editable reservation fields. `tableName` is client-side only (used to
 * re-render the row) and is never sent to the backend. */
export interface UpdateReservationChanges {
  /** New ISO start datetime. */
  start?: string
  partySize?: number
  /** New table assignment. Pass null to unassign. Omit to leave untouched. */
  tableId?: string | null
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
  emitNotificationRefresh()
}

/** Permanently deletes a reservation. Throws on failure. */
export async function deleteReservationOnServer(id: string) {
  await apiClient.delete(`/reservations/${id}`)
  emitNotificationRefresh()
}

/**
 * Re-sends the confirmation email to any email address.
 * Useful when the customer's email on file is wrong or staff needs to send
 * the link to a different address.
 */
export async function resendConfirmationEmail(reservationId: string, email: string) {
  await apiClient.post(`/reservations/${reservationId}/resend-confirmation`, { email })
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
  } else {
    // Customer matched by email or phone.
    // If the name passed into the reservation differs (e.g. spouse, typo correction,
    // or different guest using contact details), or if missing email/phone can be backfilled,
    // update the customer record so the reservation and table display the latest name.
    const updates: Partial<{ name: string; email: string; phone: string }> = {}
    if (input.customerName && input.customerName.trim() && customer.name !== input.customerName.trim()) {
      updates.name = input.customerName.trim()
    }
    if (input.customerEmail && !customer.email) {
      updates.email = input.customerEmail.trim()
    }
    if (input.customerPhone && !customer.phone) {
      updates.phone = input.customerPhone.trim()
    }
    if (Object.keys(updates).length > 0) {
      try {
        customer = await apiClient.patch<ApiCustomer>(`/customers/${customer.id}`, updates)
      } catch (err) {
        console.error("[reservations] Failed to update customer:", err)
      }
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
  // The backend records this as a "New reservation" (or "Walk-in seated")
  // notification, so ask the bell to refetch right away.
  emitNotificationRefresh()
  return {
    ...toCalendarReservation(created),
    customerId: customer.id,
    customerName: customer.name ?? input.customerName,
    customerPhone: customer.phone ?? input.customerPhone ?? "",
    customerEmail: customer.email ?? input.customerEmail ?? undefined,
  }
}
