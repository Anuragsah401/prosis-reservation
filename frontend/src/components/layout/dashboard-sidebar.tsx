import { useTranslation } from "react-i18next"
import { PanelLeftClose, PanelLeftOpen, UtensilsCrossed, Store, ExternalLink } from "lucide-react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebarCollapsed } from "@/components/layout/use-sidebar-collapsed"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { authClient } from "@/features/auth/auth-client"
import { cn } from "@/lib/utils"

export function DashboardSidebar() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  const { profile } = useRestaurant()
  const user = authClient.getUser()
  const appName = t("common.appName", "Seat Booking")
  const restaurantName = profile?.name || user?.restaurant?.name || "My Restaurant"

  return (
    <aside
      className={cn(
        "bg-card/80 backdrop-blur-md hidden shrink-0 border-r border-border/70 transition-[width] duration-200 md:flex md:flex-col sticky top-0 h-svh z-30 select-none shadow-xs",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header Section with App Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border/60",
          collapsed ? "justify-center px-0" : "justify-between px-3.5",
        )}
      >
        {collapsed ? (
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className="size-9 rounded-xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-primary/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                aria-label="Expand sidebar"
              >
                <UtensilsCrossed className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium text-xs">
              {appName} — {t("nav.expandSidebar", "Expand sidebar")}
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8.5 rounded-xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-primary/20 shrink-0">
                <UtensilsCrossed className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-foreground truncate leading-tight">
                  {appName}
                </span>
                <span className="text-[9.5px] font-semibold text-muted-foreground/80 tracking-wider uppercase">
                  {t("nav.tagline", "Reservation Suite")}
                </span>
              </div>
            </div>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 shrink-0"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t("nav.collapseSidebar", "Collapse sidebar")}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-muted-foreground/15">
        <SidebarNav collapsed={collapsed} />
      </div>

      {/* Footer Section */}
      {collapsed ? (
        <div className="flex justify-center border-t border-border/60 p-2">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {t("nav.expandSidebar", "Expand sidebar")}
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="border-t border-border/60 p-3 bg-muted/15">
          <div className="rounded-xl border border-border/70 bg-background/60 p-2 shadow-2xs backdrop-blur-xs flex items-center justify-between gap-2 transition-colors hover:bg-background/90">
            <div className="flex items-center gap-2 min-w-0">
              {profile?.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={restaurantName}
                  className="size-7.5 rounded-lg border border-border/60 object-contain bg-background shrink-0 shadow-2xs"
                />
              ) : (
                <div className="size-7.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <Store className="size-3.5" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground truncate leading-tight">
                  {restaurantName}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span className="relative flex size-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="truncate">{t("nav.acceptingReservations", "Online")}</span>
                </span>
              </div>
            </div>

            {profile?.id && (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <a
                    href={`/restaurant/${profile.id}/book`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-7 rounded-lg border border-border/70 bg-card hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                    aria-label="View public booking page"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t("nav.liveBooking", "Live Booking Page")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

