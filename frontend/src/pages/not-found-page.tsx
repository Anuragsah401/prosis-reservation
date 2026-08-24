import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Compass,
  Grid3X3,
  Home,
  LayoutDashboard,
  LogIn,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { authClient } from "@/features/auth/auth-client"

export function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = authClient.isAuthenticated()

  return (
    <div className="bg-background relative flex min-h-svh flex-col">
      {/* Top Navigation Bar */}
      <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-14 items-center justify-between border-b px-4 backdrop-blur sm:px-8">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 font-semibold">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-sm">
            <UtensilsCrossed className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight">{t("common.appName", "Seat Booking")}</span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
          {/* Visual Icon / Badge */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-2xl shadow-inner sm:size-24">
              <Compass className="size-10 animate-pulse sm:size-12" />
            </div>
            <div className="border-background bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full border-2 px-2 py-0.5 text-xs font-bold shadow">
              404
            </div>
          </div>

          {/* Heading and Description */}
          <div className="border-primary/20 bg-primary/5 text-primary mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold">
            {t("notFoundPage.badge", "404 Error")}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("notFoundPage.title", "Page not found")}
          </h1>

          <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed sm:text-base">
            {t(
              "notFoundPage.description",
              "Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.",
            )}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full gap-2 sm:w-auto"
            >
              <ArrowLeft className="size-4" />
              <span>{t("notFoundPage.goBack", "Go Back")}</span>
            </Button>

            {isAuthenticated ? (
              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>{t("notFoundPage.goToDashboard", "Go to Dashboard")}</span>
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link to="/">
                  <Home className="size-4" />
                  <span>{t("notFoundPage.goHome", "Back to Home")}</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Quick Helpful Links */}
          <div className="border-border/60 mt-10 w-full border-t pt-6">
            <p className="text-muted-foreground mb-3 text-xs font-medium">
              {t("notFoundPage.lookingFor", "Here are some helpful links instead:")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="hover:bg-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors"
                  >
                    <LayoutDashboard className="size-3.5 text-primary" />
                    <span>{t("notFoundPage.linkDashboard", "Dashboard")}</span>
                  </Link>
                  <Link
                    to="/reservations"
                    className="hover:bg-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors"
                  >
                    <Calendar className="size-3.5 text-primary" />
                    <span>{t("notFoundPage.linkReservations", "Reservations")}</span>
                  </Link>
                  <Link
                    to="/floor-plan"
                    className="hover:bg-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors"
                  >
                    <Grid3X3 className="size-3.5 text-primary" />
                    <span>{t("notFoundPage.linkTables", "Tables & Floor Plan")}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="hover:bg-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors"
                  >
                    <Home className="size-3.5 text-primary" />
                    <span>{t("notFoundPage.goHome", "Back to Home")}</span>
                  </Link>
                  <Link
                    to="/login"
                    className="hover:bg-accent text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors"
                  >
                    <LogIn className="size-3.5 text-primary" />
                    <span>{t("notFoundPage.linkLogin", "Sign In")}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

