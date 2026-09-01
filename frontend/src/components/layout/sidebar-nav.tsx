import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { navSections } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { authClient, isManagerRole, type AuthUser } from "@/features/auth/auth-client"

interface SidebarNavProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const pathname = location.pathname
  const [user, setUser] = useState<AuthUser | null>(() => authClient.getUser())

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authClient.getUser())
    }
    window.addEventListener("auth:state-change", handleAuthChange)
    return () => window.removeEventListener("auth:state-change", handleAuthChange)
  }, [])

  const isManager = isManagerRole(user)

  const checkIsActive = (to: string) => {
    if (to === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname === to || pathname.startsWith(to + "/")
  }

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.managerOnly || isManager),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <nav className={cn("flex flex-col", collapsed ? "items-center gap-2 px-2" : "gap-3 px-3")}>
      {visibleSections.map((section, sIdx) => {
        const sectionTitle = t(section.titleKey)

        return (
          <div key={section.id} className={cn("flex flex-col", collapsed ? "w-full items-center gap-1" : "gap-1")}>
            {/* Section Heading or Divider */}
            {collapsed ? (
              sIdx > 0 && <div className="my-1.5 w-6 h-px bg-border/80" />
            ) : (
              <div className="px-2.5 pt-2 pb-1">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest select-none">
                  {sectionTitle}
                </span>
              </div>
            )}

            {/* Section Items */}
            <div className={cn("flex flex-col", collapsed ? "w-full items-center gap-1.5" : "gap-0.5")}>
              {section.items.map((item) => {
                const label = t(item.titleKey)
                const isActive = checkIsActive(item.to)
                const Icon = item.icon

                const linkElement = (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center transition-all duration-150 outline-hidden select-none",
                      collapsed
                        ? "size-10 rounded-xl justify-center"
                        : "gap-3 rounded-lg px-2.5 py-2 text-sm font-medium",
                      isActive
                        ? collapsed
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/20 font-semibold scale-[1.02]"
                          : "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs dark:bg-primary/20 dark:border-primary/30"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-[0.97]",
                    )}
                  >
                    {/* Active Accent Left Bar (Expanded Only) */}
                    {isActive && !collapsed && (
                      <span
                        className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary shadow-xs"
                        aria-hidden="true"
                      />
                    )}

                    <Icon
                      className={cn(
                        "shrink-0 transition-transform duration-200 group-hover:scale-110",
                        collapsed ? "size-5" : "size-4.5",
                        isActive
                          ? collapsed
                            ? "text-primary-foreground stroke-[2.3]"
                            : "text-primary stroke-[2.2]"
                          : "text-muted-foreground group-hover:text-foreground stroke-[1.8]",
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate tracking-tight flex-1">{label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )

                if (!collapsed) return linkElement

                return (
                  <Tooltip key={item.to} delayDuration={100}>
                    <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="font-semibold text-xs py-1 px-2.5 shadow-md">
                      {label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
