import { API_URL } from "@/lib/config"

const TOKEN_KEY = "prosisit:auth:token"
const USER_KEY = "prosisit:auth:user"

export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string | null
  isActive: boolean
  restaurantId: string | null
  roleId: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResult {
  user: AuthUser
  token: string
}

export class AuthError extends Error {
  status: number
  details?: Record<string, string[] | undefined>

  constructor(message: string, status: number, details?: Record<string, string[] | undefined>) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function handleAuthResponse(res: Response): Promise<AuthResult> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new AuthError(data.error ?? "Something went wrong. Please try again.", res.status, data.details)
  }
  return data as AuthResult
}

/**
 * Wraps `fetch` so network-level failures (backend not running, DNS/CORS
 * issues, offline, etc.) surface a clear, actionable message instead of the
 * generic "Something went wrong" — which previously made it look like a
 * validation/server bug when the real cause was the API being unreachable.
 */
async function postJson(path: string, body: unknown): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new AuthError(
      "Unable to reach the server. Please make sure the backend is running and try again.",
      0,
    )
  }
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  restaurantName?: string
  restaurantPhone?: string
  restaurantTimezone?: string
  restaurantOpeningTime?: number
  restaurantClosingTime?: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

interface MessageResult {
  message: string
}

async function handleMessageResponse(res: Response): Promise<MessageResult> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new AuthError(data.error ?? "Something went wrong. Please try again.", res.status, data.details)
  }
  return data as MessageResult
}

/**
 * Thin client for the backend auth module (`/api/auth/*`). Persists the
 * issued JWT + user profile to localStorage so the session survives a
 * refresh — swap for httpOnly cookies later if stronger CSRF protection is
 * needed.
 */
export const authClient = {
  async register(payload: RegisterPayload): Promise<AuthResult> {
    const res = await postJson("/auth/register", payload)
    const result = await handleAuthResponse(res)
    persistSession(result)
    return result
  },

  async login(payload: LoginPayload): Promise<AuthResult> {
    const res = await postJson("/auth/login", payload)
    const result = await handleAuthResponse(res)
    persistSession(result)
    return result
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResult> {
    const res = await postJson("/auth/forgot-password", payload)
    return handleMessageResponse(res)
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResult> {
    const res = await postJson("/auth/reset-password", payload)
    return handleMessageResponse(res)
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  },
}

function persistSession(result: AuthResult) {
  localStorage.setItem(TOKEN_KEY, result.token)
  localStorage.setItem(USER_KEY, JSON.stringify(result.user))
}
