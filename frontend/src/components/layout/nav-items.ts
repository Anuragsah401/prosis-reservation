import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarCheck,
  Users,
  Settings,
  LayoutGrid,
  BarChart3,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Tables", to: "/tables", icon: UtensilsCrossed },
  { title: "Floor Plan", to: "/floor-plan", icon: LayoutGrid },
  { title: "Reservations", to: "/reservations", icon: CalendarCheck },
  { title: "Customers", to: "/customers", icon: Users },
  { title: "Analytics", to: "/analytics", icon: BarChart3 },
  { title: "Settings", to: "/settings", icon: Settings },
]
