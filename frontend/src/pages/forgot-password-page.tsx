import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { authClient, AuthError } from "@/features/auth/auth-client"
import { SEOHead } from "@/components/seo"

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError(t("auth.forgotPassword.errorRequired"))
      return
    }

    setLoading(true)
    authClient
      .forgotPassword({ email: email.trim() })
      .then(() => {
        setSubmitted(true)
      })
      .catch((err: unknown) => {
        setError(err instanceof AuthError ? err.message : t("auth.forgotPassword.errorGeneric"))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden animate-page-fade">
      <SEOHead
        title="Reset Password | Seat Booking"
        description="Reset your account password for Seat Booking."
        canonicalPath="/forgot-password"
      />
      {/* Animated Background Aura & Grid */}
      <div className="animate-pulse-glow pointer-events-none absolute -top-32 left-1/2 -z-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/20 via-sky-500/15 to-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
              SB
            </span>
            <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
          </Link>
        </div>

        <Card className="card-hover-effect shadow-xl border-2">
          <CardContent className="flex flex-col gap-6 pt-6">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full shadow-xs">
                  <MailCheck className="size-6 text-primary" />
                </span>
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-bold tracking-tight">
                    {t("auth.forgotPassword.checkEmailTitle")}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {t("auth.forgotPassword.checkEmailSubtitle")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-xl font-bold tracking-tight">{t("auth.forgotPassword.title")}</h1>
                  <p className="text-muted-foreground text-sm">{t("auth.forgotPassword.subtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">{t("auth.login.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@restaurant.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <Button type="submit" className="mt-1 w-full font-semibold shadow-md hover:scale-102 transition-all" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t("auth.forgotPassword.sendLink")}
                  </Button>
                </form>
              </>
            )}

            <p className="text-muted-foreground text-center text-sm">
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
