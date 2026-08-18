import { apiClient, getCurrentRestaurantId } from "@/lib/api-client"

/** Shape returned by the `/customers` endpoints. */
export interface ApiCustomer {
  id: string
  restaurantId: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** A single reservation on a customer's detail/history view. */
export interface ApiCustomerReservation {
  id: string
  partySize: number
  reservedFor: string
  status: string
  notes: string | null
  tableId: string | null
  table: { id: string; name: string; location: string | null } | null
}

/** Loads the restaurant's customers from the backend. */
export async function fetchCustomers(): Promise<ApiCustomer[]> {
  const restaurantId = getCurrentRestaurantId()
  if (!restaurantId) return []
  return apiClient.get<ApiCustomer[]>(`/customers?restaurantId=${restaurantId}`)
}

/** Creates a new customer for the current restaurant. */
export async function createCustomer(input: {
  name: string
  email?: string | null
  phone?: string | null
  notes?: string | null
  tags?: string[]
}): Promise<ApiCustomer> {
  const restaurantId = getCurrentRestaurantId()
  if (!restaurantId) {
    throw new Error("Your session has expired. Please sign in again.")
  }
  return apiClient.post<ApiCustomer>("/customers", { restaurantId, ...input })
}

/** Edits an existing customer's details. */
export async function updateCustomer(
  id: string,
  changes: {
    name?: string
    email?: string | null
    phone?: string | null
    notes?: string | null
    tags?: string[]
  },
): Promise<ApiCustomer> {
  return apiClient.patch<ApiCustomer>(`/customers/${id}`, changes)
}

/** Permanently deletes a customer. Throws on failure. */
export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`)
}

/** Loads a customer's recent reservation history (most recent first). */
export async function fetchCustomerReservations(customerId: string): Promise<ApiCustomerReservation[]> {
  return apiClient.get<ApiCustomerReservation[]>(`/customers/${customerId}/reservations`)
}
