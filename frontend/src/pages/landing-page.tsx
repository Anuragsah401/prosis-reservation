import { Link } from "react-router-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowRight,
  CalendarClock,
  LayoutGrid,
  Users,
  BarChart3,
  CheckCircle2,
  Menu,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const featureIcons = [LayoutGrid, CalendarClock, Users, BarChart3]

interface FeatureItem {
  title: string
  description: string
}

interface StepItem {
  title: string
  description: string
}

interface TestimonialItem {
  quote: string
  name: string
  role: string
}

interface PlanItem {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
}

export function LandingPage() {
  const { t } = useTranslation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const featuresList = t("landing.featuresSection.items", { returnObjects: true }) as FeatureItem[]
  const steps = t("landing.howItWorks.steps", { returnObjects: true }) as StepItem[]
  const testimonials = t("landing.testimonials.items", { returnObjects: true }) as TestimonialItem[]
  const plans = t("landing.pricing.plans", { returnObjects: true }) as PlanItem[]

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold">
              SB
            </span>
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
              <span>{t("common.appName", "Seat Booking")}</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.features")}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.howItWorks")}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.pricing")}
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.reviews")}
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/login">{t("header.signIn")}</Link>
            </Button>
            <Button size="sm" asChild className="hidden md:inline-flex">
              <Link to="/signup">
                {t("header.getStarted")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                      PT
                    </span>
                    {t("common.appName")}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
                  <a
                    href="#features"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    {t("landing.landingNav.features")}
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    {t("landing.landingNav.howItWorks")}
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    {t("landing.landingNav.pricing")}
                  </a>
                  <a
                    href="#testimonials"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    {t("landing.landingNav.reviews")}
                  </a>
                </nav>
                <div className="mt-2 flex flex-col gap-2 border-t p-4">
                  <Button variant="outline" asChild onClick={() => setMobileNavOpen(false)}>
                    <Link to="/login">{t("header.signIn")}</Link>
                  </Button>
                  <Button asChild onClick={() => setMobileNavOpen(false)}>
                    <Link to="/signup">
                      {t("header.getStarted")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" />
            {t("landing.badge")}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-balance">
            {t("landing.heroSubtitle")}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">
                {t("landing.heroCtaPrimary")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">{t("landing.heroCtaSecondary")}</a>
            </Button>
          </div>

          <div className="mt-12 w-full max-w-4xl">
            <Card className="overflow-hidden border-2 shadow-lg">
              <CardContent className="p-0">
                <div className="bg-muted/40 flex items-center gap-1.5 border-b px-4 py-3">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-yellow-500/70" />
                  <span className="size-2.5 rounded-full bg-green-500/70" />
                  <span className="text-muted-foreground ml-3 text-xs">
                    {t("landing.demo.url")}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-6">
                  {[
                    { label: t("landing.demo.tonightsCovers"), value: "128", icon: UtensilsCrossed },
                    { label: t("landing.demo.reservations"), value: "42", icon: CalendarClock },
                    { label: t("landing.demo.tablesOccupied"), value: "18 / 24", icon: LayoutGrid },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card flex items-center gap-3 rounded-lg border p-4">
                      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                        <stat.icon className="size-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-muted-foreground text-xs">{stat.label}</p>
                        <p className="text-xl font-semibold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Logos / trust strip */}
      <section className="border-y">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
            {t("landing.trust.title")}
          </p>
          <div className="text-muted-foreground/70 mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-lg font-semibold">
            <span>Lumen Bistro</span>
            <span>The Copper Fork</span>
            <span>Nair &amp; Co.</span>
            <span>Harbor House</span>
            <span>Marchetti&apos;s</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("landing.featuresSection.title")}
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {t("landing.featuresSection.subtitle")}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuresList.map((feature, index) => {
            const Icon = featureIcons[index] ?? LayoutGrid
            return (
              <Card key={feature.title} className="h-full">
                <CardContent className="flex flex-col gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("landing.howItWorks.title")}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {t("landing.howItWorks.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col gap-3">
                <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-semibold">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="h-full">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex gap-0.5 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {t("landing.pricing.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const highlighted = index === 1
              return (
                <Card
                  key={plan.name}
                  className={
                    highlighted
                      ? "border-primary relative shadow-lg lg:-translate-y-2"
                      : "relative"
                  }
                >
                  {highlighted && (
                    <Badge className="absolute top-4 right-4">{t("landing.pricing.mostPopular")}</Badge>
                  )}
                  <CardContent className="flex h-full flex-col gap-4">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                    </div>
                    <ul className="flex flex-1 flex-col gap-2 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/dashboard">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("landing.ctaBanner.title")}
            </h2>
            <p className="max-w-xl text-sm opacity-90 sm:text-base">
              {t("landing.ctaBanner.subtitle")}
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                {t("landing.ctaBanner.button")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
              SB
            </span>
            <span className="text-sm font-semibold">{t("common.appName", "Seat Booking")}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {t("common.appName", "Seat Booking")}. {t("landing.footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  )
}
