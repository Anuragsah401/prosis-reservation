import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Settings,
  LayoutGrid,
  BarChart3,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  titleKey: string
  to: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { title: "Dashboard", titleKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Floor Plan", titleKey: "nav.floorPlan", to: "/floor-plan", icon: LayoutGrid },
  { title: "Reservations", titleKey: "nav.reservations", to: "/reservations", icon: CalendarCheck },
  { title: "Customers", titleKey: "nav.customers", to: "/customers", icon: Users },
  { title: "Analytics", titleKey: "nav.analytics", to: "/analytics", icon: BarChart3 },
  { title: "Settings", titleKey: "nav.settings", to: "/settings", icon: Settings },
]
