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
  badge?: string
}

export interface NavSection {
  id: string
  titleKey: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    id: "main",
    titleKey: "nav.sectionMain",
    items: [
      { title: "Dashboard", titleKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard },
      { title: "Floor Plan", titleKey: "nav.floorPlan", to: "/floor-plan", icon: LayoutGrid },
      { title: "Reservations", titleKey: "nav.reservations", to: "/reservations", icon: CalendarCheck },
    ],
  },
  {
    id: "insights",
    titleKey: "nav.sectionInsights",
    items: [
      { title: "Customers", titleKey: "nav.customers", to: "/customers", icon: Users },
      { title: "Analytics", titleKey: "nav.analytics", to: "/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "system",
    titleKey: "nav.sectionSystem",
    items: [
      { title: "Settings", titleKey: "nav.settings", to: "/settings", icon: Settings },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap((s) => s.items)
