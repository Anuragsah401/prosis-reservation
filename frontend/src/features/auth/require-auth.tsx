import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "@/features/auth/auth-client"

export function RequireAuth() {
  const location = useLocation()

  if (!authClient.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  if (authClient.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
