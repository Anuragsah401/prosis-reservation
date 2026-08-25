import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { authClient, AuthError } from "@/features/auth/auth-client"
import { usePersistedState } from "@/hooks/use-form-persistence"
import { SEOHead } from "@/components/seo"

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail, clearEmailDraft] = usePersistedState("login-form-email", "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError(t("auth.login.errorRequired"))
      return
    }

    setLoading(true)
    authClient
      .login({ email: email.trim(), password })
      .then(() => {
        clearEmailDraft()
        navigate("/reservations")
      })
      .catch((err: unknown) => {
        setError(err instanceof AuthError ? err.message : t("auth.login.errorGeneric"))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <SEOHead
        title="Sign In | Seat Booking"
        description="Sign in to your Seat Booking restaurant management portal to access real-time reservations, floor plans, and dining analytics."
        canonicalPath="/login"
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
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-semibold tracking-tight">{t("auth.login.welcomeBack")}</h1>
              <p className="text-muted-foreground text-sm">{t("auth.login.subtitle")}</p>
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

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <Link to="/forgot-password" className="text-muted-foreground text-xs hover:underline">
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" className="mt-1 w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {t("auth.login.signIn")}
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              {t("auth.login.noAccount")}{" "}
              <Link to="/signup" className="text-foreground font-medium hover:underline">
                {t("auth.login.signUp")}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          <Link to="/" className="hover:underline">
            {t("auth.login.backHome")}
          </Link>
        </p>
      </div>
    </div>
  )
}
