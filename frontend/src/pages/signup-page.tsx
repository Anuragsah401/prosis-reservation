import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
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

const steps = [
  { title: "Your account", icon: User },
  { title: "Restaurant details", icon: Store },
  { title: "Tables & hours", icon: UtensilsCrossed },
]

const cuisineOptions = [
  "American",
  "Italian",
  "Indian",
  "Japanese",
  "Mexican",
  "Mediterranean",
  "Other",
]

const tableCountOptions = ["1-5", "6-10", "11-20", "21-40", "40+"]

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 — account
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Step 2 — restaurant details
  const [restaurantName, setRestaurantName] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [phone, setPhone] = useState("")

  // Step 3 — tables & hours
  const [tableCount, setTableCount] = useState("")
  const [openTime, setOpenTime] = useState("17:00")
  const [closeTime, setCloseTime] = useState("23:00")

  function validateStep(current: number) {
    if (current === 0) {
      if (!name.trim() || !email.trim() || !password) {
        return "Please fill in all fields."
      }
      if (password.length < 8) {
        return "Password must be at least 8 characters."
      }
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must contain at least one letter and one number."
      }
    }
    if (current === 1) {
      if (!restaurantName.trim() || !cuisine) {
        return "Please fill in your restaurant name and cuisine type."
      }
    }
    if (current === 2) {
      if (!tableCount) {
        return "Please select how many tables you have."
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

    authClient
      .register({
        name: name.trim(),
        email: email.trim(),
        password,
        restaurantName: restaurantName.trim(),
        restaurantPhone: phone.trim() || undefined,
      })
      .then(() => {
        navigate("/reservations")
      })
      .catch((err: unknown) => {
        setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const isLastStep = step === steps.length - 1

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
              PT
            </span>
            <span className="text-lg font-semibold tracking-tight">Prosisit Table</span>
          </Link>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((s, index) => {
            const isCompleted = index < step
            const isActive = index === step
            return (
              <div key={s.title} className="flex flex-1 items-center gap-2">
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
                    {s.title}
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
              <h1 className="text-xl font-semibold tracking-tight">{steps[step].title}</h1>
              <p className="text-muted-foreground text-sm">
                Step {step + 1} of {steps.length} —{" "}
                {step === 0 && "let's start with your login details."}
                {step === 1 && "tell us a bit about your restaurant."}
                {step === 2 && "set up your tables and service hours."}
              </p>
            </div>

            <form
              onSubmit={isLastStep ? handleSubmit : (e) => e.preventDefault()}
              className="flex flex-col gap-4"
            >
              {step === 0 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jamie Rivera"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
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
                </>
              )}

              {step === 1 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="restaurant">Restaurant name</Label>
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
                    <Label htmlFor="cuisine">Cuisine type</Label>
                    <Select value={cuisine} onValueChange={setCuisine}>
                      <SelectTrigger id="cuisine" className="w-full">
                        <SelectValue placeholder="Select a cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 555 0100"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tables">Number of tables</Label>
                    <Select value={tableCount} onValueChange={setTableCount}>
                      <SelectTrigger id="tables" className="w-full">
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                      <SelectContent>
                        {tableCountOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t} tables
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="open-time">Opening time</Label>
                      <Input
                        id="open-time"
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="close-time">Closing time</Label>
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
                    Back
                  </Button>
                )}
                {isLastStep ? (
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    Create account
                  </Button>
                ) : (
                  <Button type="button" className="flex-1" onClick={handleNext}>
                    Continue
                  </Button>
                )}
              </div>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
