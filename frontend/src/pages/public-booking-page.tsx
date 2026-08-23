import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PublicBookingFlow } from "@/features/booking/public-booking-flow"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"

export function PublicBookingPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">{t("publicBooking.notFound", "Restaurant not found.")}</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-svh">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <PublicBookingFlow restaurantId={id} />
    </div>
  )
}
