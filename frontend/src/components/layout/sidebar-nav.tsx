import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { navSections } from "@/components/layout/nav-items"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarNavProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const { t } = useTranslation()

  return (
    <nav className={cn("flex flex-col gap-3", collapsed ? "px-2" : "px-3")}>
      {navSections.map((section, sIdx) => {
        const sectionTitle = t(section.titleKey)

        return (
          <div key={section.id} className="flex flex-col gap-1">
            {/* Section Heading or Divider */}
            {collapsed ? (
              sIdx > 0 && <div className="my-1.5 mx-auto w-6 h-px bg-border/60" />
            ) : (
              <div className="px-2 pt-2 pb-1">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest select-none">
                  {sectionTitle}
                </span>
              </div>
            )}

            {/* Section Items */}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const label = t(item.titleKey)
                const link = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 outline-hidden select-none",
                        collapsed ? "size-10 justify-center p-0 mx-auto" : "px-2.5 py-2",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-2xs dark:bg-primary/20 dark:border-primary/30"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground active:scale-[0.98]",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active Accent Left Bar (Expanded) */}
                        {isActive && !collapsed && (
                          <span
                            className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r-md bg-primary shadow-xs"
                            aria-hidden="true"
                          />
                        )}

                        <item.icon
                          className={cn(
                            "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                            isActive ? "text-primary stroke-[2.2]" : "text-muted-foreground group-hover:text-foreground",
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
                      </>
                    )}
                  </NavLink>
                )

                if (!collapsed) return link

                return (
                  <Tooltip key={item.to} delayDuration={150}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium text-xs">
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

