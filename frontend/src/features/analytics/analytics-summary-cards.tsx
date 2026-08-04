import { TrendingUp, TrendingDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { SummaryMetric } from "@/features/analytics/analytics-data"
import { cn } from "@/lib/utils"

interface AnalyticsSummaryCardsProps {
  metrics: SummaryMetric[]
}

export function AnalyticsSummaryCards({ metrics }: AnalyticsSummaryCardsProps) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                metric.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
              )}
            >
              {metric.trend === "up" ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {metric.change} {t("pages.analytics.vsPreviousPeriod")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
