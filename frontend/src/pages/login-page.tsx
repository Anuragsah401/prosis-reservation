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
    <div className="bg-background relative min-h-screen flex flex-col justify-center overflow-hidden animate-page-fade">
      <SEOHead
        title="Sign In | Seat Booking"
        description="Sign in to your Seat Booking restaurant management portal to access real-time reservations, floor plans, and dining analytics."
        canonicalPath="/login"
      />

      {/* Top Floating Utility Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: LUXURY RESTAURANT ATMOSPHERE & VISUAL SHOWCASE     */}
        {/* ------------------------------------------------------------- */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden">
          {/* Ambient Lighting & Glow Gradients */}
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />

          {/* Top Branding */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-base font-bold shadow-lg group-hover:scale-105 transition-transform">
                SB
              </span>
              <span className="text-xl font-bold tracking-tight text-white">{t("common.appName")}</span>
            </Link>
          </div>

          {/* Centerpiece Visual & Badges */}
          <div className="relative z-10 my-auto max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Next-Gen Front-of-House Management</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Every table, booking, and guest in perfect harmony.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Seat Booking connects your 2D dining room floor plan with instant online reservations, SMS reminders, and guest CRM.
            </p>

            {/* Floating Live Status Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-200">Live Service Status</span>
                <span className="text-emerald-400 font-medium">● 98.4% Table Occupancy</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
                  <p className="text-xs font-bold text-white">Table 4 (VIP Booth)</p>
                  <p className="text-[11px] text-slate-300">Party of 4 • Seated</p>
                  <span className="inline-block mt-1 text-[10px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded font-medium">
                    Chef Tasting 🍷
                  </span>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700/60">
                  <p className="text-xs font-bold text-white">Table 2 (Patio)</p>
                  <p className="text-[11px] text-slate-300">Party of 2 • 19:30</p>
                  <span className="inline-block mt-1 text-[10px] bg-sky-900/80 text-sky-200 px-1.5 py-0.5 rounded font-medium">
                    Confirmed 🥂
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Review Quote */}
          <div className="relative z-10 border-t border-slate-800/80 pt-6">
            <p className="text-xs italic text-slate-300 leading-relaxed">
              &ldquo;Seat Booking cut our no-show rate in half and the live floor plan view means hosts always know what&apos;s free in seconds.&rdquo;
            </p>
            <p className="mt-2 text-xs font-bold text-white">Maria Chen <span className="text-slate-400 font-normal">— General Manager, Lumen Bistro</span></p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: SIGN IN FORM                                      */}
        {/* ------------------------------------------------------------- */}
        <div className="relative flex flex-col items-center justify-center p-6 sm:p-12">
          {/* Subtle Mobile/Desktop Background Glow */}
          <div className="animate-pulse-glow pointer-events-none absolute -top-32 left-1/2 -z-10 h-[450px] w-[550px] -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/15 via-sky-500/10 to-emerald-500/15 blur-3xl" />

          <div className="w-full max-w-sm">
            {/* Mobile Header Logo */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                  SB
                </span>
                <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
              </Link>
            </div>

            <Card className="card-hover-effect shadow-2xl border-2 backdrop-blur-xl bg-card/90">
              <CardContent className="flex flex-col gap-6 pt-6">
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">{t("auth.login.welcomeBack")}</h1>
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
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("auth.login.password")}</Label>
                      <Link to="/forgot-password" className="text-muted-foreground text-xs hover:text-primary transition-colors hover:underline">
                        {t("auth.login.forgotPassword")}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
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

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <Button type="submit" className="mt-1 w-full font-semibold shadow-md hover:scale-102 transition-all" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t("auth.login.signIn")}
                  </Button>
                </form>

                <p className="text-muted-foreground text-center text-sm">
                  {t("auth.login.noAccount")}{" "}
                  <Link to="/signup" className="text-primary font-semibold hover:underline">
                    {t("auth.login.signUp")}
                  </Link>
                </p>
              </CardContent>
            </Card>

            <p className="text-muted-foreground mt-6 text-center text-xs">
              <Link to="/" className="hover:text-foreground transition-colors hover:underline">
                {t("auth.login.backHome")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
