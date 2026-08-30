import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { UtensilsCrossed } from "lucide-react"
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
    <div className="bg-muted/10 min-h-svh flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-13 max-w-4xl items-center justify-between px-3.5 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground font-bold text-sm tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-primary/20">
              <UtensilsCrossed className="size-3.5" />
            </div>
            <span>{t("common.appName", "Seat Booking")}</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <PublicBookingFlow restaurantId={id} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>
          Powered by{" "}
          <Link to="/" className="font-semibold text-foreground hover:underline">
            SeatBooking.dk
          </Link>{" "}
          • Instant & Free Online Reservations
        </p>
      </footer>
    </div>
  )
}
