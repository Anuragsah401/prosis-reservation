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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:gap-3">
      {/* 1. Total Customers */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-primary/[0.03] transition-all hover:border-primary/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.total", "Total Guests")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {total}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.profiles", "profiles")}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {t("pages.customers.stats.databaseDesc", "Registered guest CRM")}
          </div>
        </CardContent>
      </Card>

      {/* 2. Reachable by Email */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-emerald-500/[0.03] transition-all hover:border-emerald-500/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.withEmail", "Email Reachable")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Mail className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {withEmail}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              ({emailRate}%)
            </span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {t("pages.customers.stats.marketingReady", "Mailing list ready")}
          </div>
        </CardContent>
      </Card>

      {/* 3. VIP & Loyal Guests */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-purple-500/[0.03] transition-all hover:border-purple-500/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.vipLoyal", "VIP & Loyal")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {vipCount}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.guests", "guests")}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {t("pages.customers.stats.taggedVip", "Tagged as VIP / Regular")}
          </div>
        </CardContent>
      </Card>

      {/* 4. Phone Reachable */}
      <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card to-blue-500/[0.03] transition-all hover:border-blue-500/40 hover:shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/60" />
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {t("pages.customers.stats.withPhone", "Phone Reachable")}
            </span>
            <div className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Phone className="size-3.5 sm:size-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
              {withPhone}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
              {t("pages.customers.stats.contacts", "contacts")}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            {t("pages.customers.stats.smsReady", "SMS & call reachable")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
