import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient, AuthError } from "@/features/auth/auth-client"

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)
    authClient
      .login({ email: email.trim(), password })
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

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-md text-sm font-bold">
              PT
            </span>
            <span className="text-lg font-semibold tracking-tight">Prosisit Table</span>
          </Link>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground text-sm">
                Sign in to manage your restaurant&apos;s reservations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-muted-foreground text-xs hover:underline">
                    Forgot password?
                  </a>
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
                Sign in
              </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-foreground font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
