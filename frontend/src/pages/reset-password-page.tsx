import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { authClient, AuthError } from "@/features/auth/auth-client"
import { SEOHead } from "@/components/seo"

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError(t("auth.resetPassword.errorMissingToken"))
      return
    }
    if (!password || password.length < 8) {
      setError(t("auth.resetPassword.errorPasswordLength"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.errorMismatch"))
      return
    }

    setLoading(true)
    authClient
      .resetPassword({ token, password })
      .then(() => {
        setSuccess(true)
        setTimeout(() => navigate("/login"), 2000)
      })
      .catch((err: unknown) => {
        setError(err instanceof AuthError ? err.message : t("auth.resetPassword.errorGeneric"))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden animate-page-fade">
      <SEOHead
        title="Set New Password | Seat Booking"
        description="Set a new password for your Seat Booking account."
        robots="noindex, follow"
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
            {success ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <h1 className="text-xl font-bold tracking-tight">
                  {t("auth.resetPassword.successTitle")}
                </h1>
                <p className="text-muted-foreground text-sm">{t("auth.resetPassword.successSubtitle")}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-xl font-bold tracking-tight">{t("auth.resetPassword.title")}</h1>
                  <p className="text-muted-foreground text-sm">{t("auth.resetPassword.subtitle")}</p>
                </div>

                {!token && (
                  <p className="text-destructive text-center text-sm">
                    {t("auth.resetPassword.errorMissingToken")}
                  </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="pr-9 transition-all focus:ring-2 focus:ring-primary/20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirm-password">{t("auth.resetPassword.confirmPassword")}</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <Button type="submit" className="mt-1 w-full font-semibold shadow-md hover:scale-102 transition-all" disabled={loading || !token}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t("auth.resetPassword.submit")}
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
