import { useTranslation } from "react-i18next"
import { Users, Mail, Phone, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ApiCustomer } from "./customers-api"

interface CustomerStatsProps {
  customers: ApiCustomer[]
}

export function CustomerStats({ customers }: CustomerStatsProps) {
  const { t } = useTranslation()

  const total = customers.length
  const withEmail = customers.filter((c) => c.email && c.email.includes("@")).length
  const withPhone = customers.filter((c) => c.phone && c.phone.trim().length > 0).length
  const vipCount = customers.filter((c) =>
    c.tags.some((tag) => {
      const lower = tag.toLowerCase()
      return lower === "vip" || lower === "regular" || lower === "loyal"
    }),
  ).length
  const emailRate = total > 0 ? Math.round((withEmail / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 md:gap-2.5">
      {/* 1. Total Customers */}
      <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm">
        <CardContent className="p-2 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.total", "Total Guests")}
            </span>
            <div className="flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
              <Users className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground leading-none">
              {total}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.profiles", "profiles")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Reachable by Email */}
      <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm">
        <CardContent className="p-2 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.withEmail", "Email Reachable")}
            </span>
            <div className="flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Mail className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground leading-none">
              {withEmail}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              {emailRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. VIP & Loyal Guests */}
      <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm">
        <CardContent className="p-2 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.vipLoyal", "VIP & Loyal")}
            </span>
            <div className="flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground leading-none">
              {vipCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.guests", "guests")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Phone Reachable */}
      <Card className="border-border/80 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm">
        <CardContent className="p-2 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.withPhone", "Phone Reachable")}
            </span>
            <div className="flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Phone className="size-3 sm:size-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-1">
            <span className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground leading-none">
              {withPhone}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.contacts", "contacts")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
