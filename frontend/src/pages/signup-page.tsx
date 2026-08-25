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
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <SEOHead
        title="Get Started | Create Restaurant Account"
        description="Sign up for Seat Booking. Create your restaurant account, build interactive floor plans, and start accepting online table reservations in minutes."
        canonicalPath="/signup"
      />
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
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
                      "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isActive && "border-primary text-primary",
                      !isCompleted && !isActive && "text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="size-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[11px] whitespace-nowrap sm:block",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground",
                    )}
                  >
                    {t(s.titleKey)}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-colors",
                      isCompleted ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-semibold tracking-tight">{t(steps[step].titleKey)}</h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.signup.stepOf", { current: step + 1, total: steps.length })} —{" "}
                {step === 0 && t("auth.signup.stepIntroAccount")}
                {step === 1 && t("auth.signup.stepIntroRestaurant")}
                {step === 2 && t("auth.signup.stepIntroTables")}
              </p>
            </div>

            <form
              onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}
              className="flex flex-col gap-4"
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
                        className="pr-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
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
                  <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
                    {t("auth.signup.back")}
                  </Button>
                )}
                {isLastStep ? (
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t("auth.signup.createAccount")}
                  </Button>
                ) : (
                  <Button type="button" className="flex-1" onClick={handleNext}>
                    {t("auth.signup.continue")}
                  </Button>
                )}
              </div>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              {t("auth.signup.haveAccount")}{" "}
              <Link to="/login" className="text-foreground font-medium hover:underline">
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
  )
}
