import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Store,
  User,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { authClient, AuthError } from "@/features/auth/auth-client"
import { usePersistedFormState } from "@/hooks/use-form-persistence"
import { SEOHead } from "@/components/seo"

const steps = [
  { titleKey: "auth.signup.stepYourAccount", icon: User },
  { titleKey: "auth.signup.stepRestaurantDetails", icon: Store },
  { titleKey: "auth.signup.stepTablesHours", icon: UtensilsCrossed },
] as const

// Stable values are stored in the form draft; only the display label is localized.
const cuisineOptions: { value: string; labelKey: string }[] = [
  { value: "American", labelKey: "auth.signup.cuisineAmerican" },
  { value: "Italian", labelKey: "auth.signup.cuisineItalian" },
  { value: "Indian", labelKey: "auth.signup.cuisineIndian" },
  { value: "Japanese", labelKey: "auth.signup.cuisineJapanese" },
  { value: "Mexican", labelKey: "auth.signup.cuisineMexican" },
  { value: "Mediterranean", labelKey: "auth.signup.cuisineMediterranean" },
  { value: "Other", labelKey: "auth.signup.cuisineOther" },
]

const tableCountOptions = ["1-5", "6-10", "11-20", "21-40", "40+"]

export function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [draft, setDraft, clearDraft] = usePersistedFormState("signup-form", {
    step: 0,
    name: "",
    email: "",
    password: "",
    restaurantName: "",
    cuisine: "",
    phone: undefined as string | undefined,
    tableCount: "",
    openTime: "17:00",
    closeTime: "23:00",
  })

  const step = draft.step
  const setStep = (updater: number | ((s: number) => number)) =>
    setDraft((d) => ({
      ...d,
      step: typeof updater === "function" ? (updater as (s: number) => number)(d.step) : updater,
    }))

  const { name, email, password, restaurantName, cuisine, phone, tableCount, openTime, closeTime } = draft
  const setName = (v: string) => setDraft((d) => ({ ...d, name: v }))
  const setEmail = (v: string) => setDraft((d) => ({ ...d, email: v }))
  const setPassword = (v: string) => setDraft((d) => ({ ...d, password: v }))
  const setRestaurantName = (v: string) => setDraft((d) => ({ ...d, restaurantName: v }))
  const setCuisine = (v: string) => setDraft((d) => ({ ...d, cuisine: v }))
  const setPhone = (v: string | undefined) => setDraft((d) => ({ ...d, phone: v }))
  const setTableCount = (v: string) => setDraft((d) => ({ ...d, tableCount: v }))
  const setOpenTime = (v: string) => setDraft((d) => ({ ...d, openTime: v }))
  const setCloseTime = (v: string) => setDraft((d) => ({ ...d, closeTime: v }))

  const [showPassword, setShowPassword] = useState(false)

  function validateStep(current: number) {
    if (current === 0) {
      if (!name.trim() || !email.trim() || !password) {
        return t("auth.signup.errorRequiredFields")
      }
      if (password.length < 8) {
        return t("auth.signup.errorPasswordLength")
      }
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return t("auth.signup.errorPasswordComplexity")
      }
    }
    if (current === 1) {
      if (!restaurantName.trim() || !cuisine) {
        return t("auth.signup.errorRestaurantAndCuisine")
      }
    }
    if (current === 2) {
      if (!tableCount) {
        return t("auth.signup.errorTableCount")
      }
    }
    return null
  }

  function handleNext() {
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function handleBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validateStep(step)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)

    // Convert "HH:MM" strings to minutes from midnight
    const openingMinutes = (() => {
      const [h, m] = openTime.split(":").map(Number)
      return h * 60 + m
    })()
    const closingMinutes = (() => {
      const [h, m] = closeTime.split(":").map(Number)
      return h * 60 + m
    })()

    authClient
      .register({
        name: name.trim(),
        email: email.trim(),
        password,
        restaurantName: restaurantName.trim(),
        restaurantPhone: phone?.trim() || undefined,
        restaurantOpeningTime: openingMinutes,
        restaurantClosingTime: closingMinutes,
      })
      .then(() => {
        clearDraft()
        navigate("/reservations")
      })
      .catch((err: unknown) => {
        setError(err instanceof AuthError ? err.message : t("auth.signup.errorGeneric"))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const isLastStep = step === steps.length - 1

  return (
    <div className="bg-background relative min-h-screen flex flex-col justify-center overflow-hidden animate-page-fade">
      <SEOHead
        title="Get Started | Create Restaurant Account"
        description="Sign up for Seat Booking. Create your restaurant account, build interactive floor plans, and start accepting online table reservations in minutes."
        canonicalPath="/signup"
      />

      {/* Top Floating Utility Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: LUXURY RESTAURANT ATMOSPHERE & VALUE PROPS        */}
        {/* ------------------------------------------------------------- */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white overflow-hidden">
          {/* Ambient Lighting & Glow Gradients */}
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/25 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
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

          {/* Centerpiece Value Props */}
          <div className="relative z-10 my-auto max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-primary animate-ping" />
              <span>14-Day Risk-Free Trial • No Credit Card Required</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Launch your modern front-of-house in 5 minutes.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join hundreds of restaurants seating more guests, eliminating double-bookings, and providing personalized diner hospitality.
            </p>

            {/* Value Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-xl backdrop-blur-md">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <UtensilsCrossed className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Visual 2D Floor Plan Designer</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Drag-and-drop table layouts, multi-floor zones, and live color status.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-xl backdrop-blur-md">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                  <Store className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">24/7 Branded Online Bookings</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Automated confirmation emails and 1-click self-service diner portals.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-xl backdrop-blur-md">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <User className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Guest CRM &amp; Dietary Tags</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Track repeat covers, VIP tags, and special celebration notes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="relative z-10 border-t border-slate-800/80 pt-6 flex items-center justify-between text-xs text-slate-400">
            <span>✓ 5-Minute Guided Setup</span>
            <span>✓ Cancel Anytime</span>
            <span>✓ $0 Per-Cover Fees</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: SIGN UP WIZARD                                    */}
        {/* ------------------------------------------------------------- */}
        <div className="relative flex flex-col items-center justify-center p-6 sm:p-12">
          {/* Subtle Background Glow */}
          <div className="animate-pulse-glow pointer-events-none absolute -top-32 left-1/2 -z-10 h-[450px] w-[550px] -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/15 via-sky-500/10 to-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

          <div className="w-full max-w-md">
            {/* Mobile Header Logo */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                  SB
                </span>
                <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
              </Link>
            </div>

            {/* Stepper */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {steps.map((s, index) => {
                const isCompleted = index < step
                const isActive = index === step
                return (
                  <div key={s.titleKey} className="flex flex-1 items-center gap-2">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                          isCompleted && "bg-primary border-primary text-primary-foreground scale-105 shadow-xs",
                          isActive && "border-primary text-primary ring-2 ring-primary/25 scale-110 font-bold",
                          !isCompleted && !isActive && "text-muted-foreground",
                        )}
                      >
                        {isCompleted ? <Check className="size-4" /> : index + 1}
                      </div>
                      <span
                        className={cn(
                          "hidden text-[11px] whitespace-nowrap sm:block transition-colors",
                          isActive ? "text-foreground font-semibold" : "text-muted-foreground",
                        )}
                      >
                        {t(s.titleKey)}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-all duration-500 rounded-full",
                          isCompleted ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <Card className="card-hover-effect shadow-2xl border-2 backdrop-blur-xl bg-card/90">
              <CardContent className="flex flex-col gap-6 pt-6">
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-2xl font-bold tracking-tight">{t(steps[step].titleKey)}</h1>
                  <p className="text-muted-foreground text-sm">
                    {t("auth.signup.stepOf", { current: step + 1, total: steps.length })} —{" "}
                    {step === 0 && t("auth.signup.stepIntroAccount")}
                    {step === 1 && t("auth.signup.stepIntroRestaurant")}
                    {step === 2 && t("auth.signup.stepIntroTables")}
                  </p>
                </div>

                <form
                  onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}
                  className="flex flex-col gap-4 animate-pure-fade"
                  key={step}
                >
                  {step === 0 && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="name">{t("auth.signup.name")}</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder={t("auth.signup.namePlaceholder")}
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">{t("auth.signup.email")}</Label>
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
                        <Label htmlFor="password">{t("auth.signup.password")}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.signup.passwordPlaceholder")}
                            autoComplete="new-password"
                            className="pr-9 transition-all focus:ring-2 focus:ring-primary/20"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
                            aria-label={showPassword ? t("auth.signup.hidePassword") : t("auth.signup.showPassword")}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="restaurant">{t("auth.signup.restaurantName")}</Label>
                        <Input
                          id="restaurant"
                          type="text"
                          placeholder="Lumen Bistro"
                          autoComplete="organization"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cuisine">{t("auth.signup.cuisineType")}</Label>
                        <Select value={cuisine} onValueChange={setCuisine}>
                          <SelectTrigger id="cuisine" className="w-full">
                            <SelectValue placeholder={t("auth.signup.selectCuisine")} />
                          </SelectTrigger>
                          <SelectContent>
                            {cuisineOptions.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {t(c.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone">{t("auth.signup.phoneNumber")}</Label>
                        <PhoneInput
                          id="phone"
                          placeholder={t("auth.signup.phonePlaceholder")}
                          value={phone}
                          onChange={setPhone}
                        />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="tables">{t("auth.signup.numTables")}</Label>
                        <Select value={tableCount} onValueChange={setTableCount}>
                          <SelectTrigger id="tables" className="w-full">
                            <SelectValue placeholder={t("auth.signup.selectRange")} />
                          </SelectTrigger>
                          <SelectContent>
                            {tableCountOptions.map((tCount) => (
                              <SelectItem key={tCount} value={tCount}>
                                {t("auth.signup.tablesCount", { count: tCount })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="open-time">{t("auth.signup.openingTime")}</Label>
                          <Input
                            id="open-time"
                            type="time"
                            value={openTime}
                            onChange={(e) => setOpenTime(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="close-time">{t("auth.signup.closingTime")}</Label>
                          <Input
                            id="close-time"
                            type="time"
                            value={closeTime}
                            onChange={(e) => setCloseTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <div className="mt-1 flex gap-3">
                    {step > 0 && (
                      <Button type="button" variant="outline" className="flex-1 hover:scale-102 transition-all" onClick={handleBack}>
                        {t("auth.signup.back")}
                      </Button>
                    )}
                    {isLastStep ? (
                      <Button type="submit" className="flex-1 font-semibold shadow-md hover:scale-102 transition-all" disabled={loading}>
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        {t("auth.signup.createAccount")}
                      </Button>
                    ) : (
                      <Button type="button" className="flex-1 font-semibold shadow-md hover:scale-102 transition-all" onClick={handleNext}>
                        {t("auth.signup.continue")}
                      </Button>
                    )}
                  </div>
                </form>

                <p className="text-muted-foreground text-center text-sm">
                  {t("auth.signup.haveAccount")}{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    {t("auth.signup.signIn")}
                  </Link>
                </p>
              </CardContent>
            </Card>

            <p className="text-muted-foreground mt-6 text-center text-xs">
              {t("auth.signup.termsNotice")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
