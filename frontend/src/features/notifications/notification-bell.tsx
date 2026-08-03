import { Bell, Check, CalendarPlus, CalendarX, CalendarClock, Users2, Info, X } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/features/notifications/use-notifications"
import type { NotificationType } from "@/features/notifications/notification-data"

const typeIcons: Record<NotificationType, typeof Bell> = {
  reservation_new: CalendarPlus,
  reservation_cancelled: CalendarX,
  reservation_updated: CalendarClock,
  waitlist: Users2,
  system: Info,
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Notification bell for the top bar. Self-contained: data fetching, read
 * state, and dismissal all flow through `useNotifications`, which already
 * targets the backend notification endpoints (falling back to a local mock
 * until they exist / auth is wired up) — no further plumbing is needed to
 * connect this to the real API later. See `notification-service.ts`.
 */
export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => markAllRead()}
            >
              <Check className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.slice(0, 6).map((n) => {
              const Icon = typeIcons[n.type]
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group hover:bg-muted/60 relative flex items-start gap-2.5 border-b px-3 py-2.5 text-sm last:border-b-0",
                    !n.read && "bg-muted/40",
                  )}
                  onClick={() => !n.read && markRead(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("truncate font-medium", !n.read && "font-semibold")}>{n.title}</p>
                      {!n.read && <span className="bg-primary size-1.5 shrink-0 rounded-full" />}
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismiss(n.id)
                    }}
                    aria-label="Dismiss notification"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t p-1.5">
          <Button variant="ghost" size="sm" className="w-full justify-center text-xs" asChild>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
