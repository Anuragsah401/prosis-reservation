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
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <SEOHead
        title="Reset Password | Seat Booking"
        description="Reset your account password for Seat Booking."
        canonicalPath="/forgot-password"
      />
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
              SB
            </span>
            <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                  <MailCheck className="size-6" />
                </span>
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-semibold tracking-tight">
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
                  <h1 className="text-xl font-semibold tracking-tight">{t("auth.forgotPassword.title")}</h1>
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
                    />
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <Button type="submit" className="mt-1 w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t("auth.forgotPassword.sendLink")}
                  </Button>
                </form>
              </>
            )}

            <p className="text-muted-foreground text-center text-sm">
              <Link to="/login" className="text-foreground font-medium hover:underline">
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
