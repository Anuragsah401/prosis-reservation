import { API_URL } from "@/lib/config"
import { authClient } from "@/features/auth/auth-client"

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {}
  if (hasBody) headers["Content-Type"] = "application/json"
  const token = authClient.getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...buildHeaders(Boolean(init?.body)),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError("Unable to reach the server. Please make sure the backend is running and try again.", 0)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json().catch(() => undefined)

  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) || "Something went wrong. Please try again."
    throw new ApiError(message, res.status, data?.error)
  }

  return data as T
}

/** Returns the current signed-in user's restaurantId, or null if unavailable. */
export function getCurrentRestaurantId(): string | null {
  return authClient.getUser()?.restaurantId ?? null
}

export const apiClient = {
  get<T>(path: string) {
    return request<T>(path, { method: "GET" })
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined })
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined })
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined })
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" })
  },
}
