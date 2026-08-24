import { useTranslation } from "react-i18next"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebarCollapsed } from "@/components/layout/use-sidebar-collapsed"
import { cn } from "@/lib/utils"

export function DashboardSidebar() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useSidebarCollapsed()

  return (
    <aside
      className={cn(
        "bg-background hidden shrink-0 border-r transition-[width] duration-200 md:flex md:flex-col sticky top-0 h-svh",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
      >
        {collapsed ? (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                aria-label="Expand sidebar"
              >
                SB
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t("common.appName", "Seat Booking")} — expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <span className="text-lg font-semibold">{t("common.appName", "Seat Booking")}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav collapsed={collapsed} />
      </div>
      {collapsed && (
        <div className="flex justify-center border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      )}
    </aside>
  )
}

