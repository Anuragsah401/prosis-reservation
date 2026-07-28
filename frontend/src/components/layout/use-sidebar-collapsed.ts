import { useEffect, useState } from "react"

const STORAGE_KEY = "prosisit-table-sidebar-collapsed"

/**
 * Persists sidebar collapsed/expanded state to localStorage so it survives
 * reloads. Kept as a plain hook (not context) since only DashboardSidebar
 * and DashboardLayout need it, both under the same parent.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(STORAGE_KEY) === "true"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return [collapsed, setCollapsed] as const
}
