import { Link } from "react-router-dom"
import {
  ArrowRight,
  CalendarClock,
  LayoutGrid,
  Users,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  {
    icon: LayoutGrid,
    title: "Visual floor plan builder",
    description:
      "Drag-and-drop tables, shapes, and multiple floors to mirror your real dining room layout in minutes.",
  },
  {
    icon: CalendarClock,
    title: "Smart reservations calendar",
    description:
      "Diagram, Day, Week, and Timeline views keep every booking, table, and party size in perfect sync.",
  },
  {
    icon: Users,
    title: "Customer relationship hub",
    description:
      "Track visit history, tags, and status for every guest so your team can deliver a personal touch.",
  },
  {
    icon: BarChart3,
    title: "Actionable analytics",
    description:
      "Spot peak hours, no-show trends, and table utilization at a glance with built-in reporting.",
  },
]

const steps = [
  {
    title: "Set up your restaurant",
    description: "Add your tables, floors, and opening hours in a guided setup flow.",
  },
  {
    title: "Share your booking page",
    description: "Send guests a branded public link so they can reserve a table in seconds.",
  },
  {
    title: "Manage every service",
    description: "Confirm, seat, and follow up on reservations from one collaborative dashboard.",
  },
]

const testimonials = [
  {
    quote:
      "Prosisit Table cut our no-show rate in half and the floor plan view means hosts always know what's free.",
    name: "Maria Chen",
    role: "GM, Lumen Bistro",
  },
  {
    quote:
      "Switching from spreadsheets to Prosisit Table saved our front-of-house team hours every single week.",
    name: "Daniel Ortiz",
    role: "Owner, The Copper Fork",
  },
  {
    quote: "The analytics dashboard finally gives us real numbers on turn times and busy nights.",
    name: "Priya Nair",
    role: "Operations Lead, Nair & Co.",
  },
]

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For new restaurants getting started with online bookings.",
    features: ["1 restaurant", "Up to 10 tables", "Public booking page", "Email support"],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    description: "For busy restaurants that need the full front-of-house toolkit.",
    features: [
      "Unlimited tables & floors",
      "Reservations calendar & analytics",
      "Customer CRM & tags",
      "Priority support",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Multi-location",
    price: "Custom",
    period: "",
    description: "For restaurant groups managing several locations at once.",
    features: ["Everything in Growth", "Multi-restaurant management", "Role-based access", "Dedicated onboarding"],
    cta: "Contact sales",
    highlighted: false,
  },
]

export function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold">
              PT
            </span>
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
              <span className="hidden xs:inline">Prosisit Table</span>
              <span className="xs:hidden">Prosisit</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Reviews
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="px-2 text-xs sm:px-3 sm:text-sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="px-2 text-xs sm:px-3 sm:text-sm">
              <Link to="/signup">
                <span className="hidden xs:inline">Get started</span>
                <span className="xs:hidden">Sign up</span>
                <ArrowRight className="hidden size-4 xs:inline" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Sparkles className="size-3.5" />
            The all-in-one reservations platform
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Run a smoother service, from booking to the last table turned.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-balance">
            Prosisit Table gives restaurants a beautiful floor plan, a real-time reservations
            calendar, and a customer CRM — so your team always knows who&apos;s coming and where
            they&apos;re sitting.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">See how it works</a>
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
                    app.prosisittable.com/reservations
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-6">
                  {[
                    { label: "Tonight's covers", value: "128", icon: UtensilsCrossed },
                    { label: "Reservations", value: "42", icon: CalendarClock },
                    { label: "Tables occupied", value: "18 / 24", icon: LayoutGrid },
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
            Trusted by independent restaurants and growing groups
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
            Everything your front-of-house team needs
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            One platform to design your floor plan, manage bookings, and understand your guests.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardContent className="flex flex-col gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Up and running in three steps
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              No lengthy onboarding — most restaurants are taking bookings the same day.
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
            Loved by restaurant teams
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="h-full">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex gap-0.5 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
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
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Start free. Upgrade when your restaurant is ready to grow.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "border-primary relative shadow-lg lg:-translate-y-2"
                    : "relative"
                }
              >
                {plan.highlighted && (
                  <Badge className="absolute top-4 right-4">Most popular</Badge>
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
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/dashboard">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to streamline your service?
            </h2>
            <p className="max-w-xl text-sm opacity-90 sm:text-base">
              Join restaurants using Prosisit Table to manage tables, reservations, and guests —
              all in one place.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Get started free
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
              PT
            </span>
            <span className="text-sm font-semibold">Prosisit Table</span>
          </div>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Prosisit Table. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
