import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Bell,
  Check,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Users2,
  Info,
  X,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/features/notifications/use-notifications"
import {
  notificationTypeLabels,
  type NotificationType,
  getTranslatedNotificationTitle,
} from "@/features/notifications/notification-data"

const typeIcons: Record<NotificationType, typeof Bell> = {
  reservation_new: CalendarPlus,
  reservation_confirmed: CalendarCheck,
  reservation_cancelled: CalendarX,
  reservation_updated: CalendarClock,
  waitlist: Users2,
  system: Info,
}

type FilterOption = "all" | "unread" | NotificationType

function formatFullTime(iso: string, locale?: string) {
  return new Date(iso).toLocaleString(locale || undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications()
  const [filter, setFilter] = useState<FilterOption>("all")

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const filterOptions: { id: FilterOption; label: string }[] = [
    { id: "all", label: t("pages.notifications.filterAll", "All") },
    { id: "unread", label: t("pages.notifications.filterUnread", "Unread") },
    ...(Object.keys(notificationTypeLabels) as NotificationType[]).map((type) => ({
      id: type,
      label: t(`pages.notifications.types.${type}`, notificationTypeLabels[type]),
    })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit gap-1.5 px-2" asChild>
          <Link to="/reservations">
            <ArrowLeft className="size-3.5" />
            {t("pages.notifications.backToReservations", "Back to reservations")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("pages.notifications.title", "Notifications")}</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0
                ? t("pages.notifications.unreadCount", { count: unreadCount })
                : t("pages.notifications.allCaughtUp", "You're all caught up.")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAllRead()}>
              <Check className="size-3.5" />
              {t("pages.notifications.markAllRead", "Mark all read")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === opt.id
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              {t("pages.notifications.empty", "No notifications here.")}
            </p>
          ) : (
            filtered.map((n) => {
              const Icon = typeIcons[n.type]
              const displayTitle = getTranslatedNotificationTitle(n.title, t)
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group hover:bg-muted/50 flex items-start gap-3 px-4 py-3 text-sm",
                    !n.read && "bg-muted/30",
                  )}
                  onClick={() => !n.read && markRead(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {n.href ? (
                        <Link
                          to={n.href}
                          onClick={(e) => e.stopPropagation()}
                          className={cn("font-medium", !n.read && "font-semibold")}
                        >
                          {displayTitle}
                        </Link>
                      ) : (
                        <p className={cn("font-medium", !n.read && "font-semibold")}>{displayTitle}</p>
                      )}
                      {!n.read && <span className="bg-primary size-1.5 shrink-0 rounded-full" />}
                    </div>
                    <p className="text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{formatFullTime(n.createdAt, i18n.language)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismiss(n.id)
                    }}
                    aria-label={t("pages.notifications.dismiss", "Dismiss notification")}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
