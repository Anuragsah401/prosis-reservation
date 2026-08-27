import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Activity,
  TrendingUp,
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
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { SEOHead, generateSoftwareAppSchema, generateFaqSchema } from "@/components/seo"

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

interface DemoTable {
  id: string
  name: string
  capacity: number
  status: "AVAILABLE" | "RESERVED" | "SEATED"
  guestName?: string
  time?: string
  tags?: string[]
  x: number
  y: number
  shape: "circle" | "rect"
}

const INITIAL_TABLES: DemoTable[] = [
  { id: "t1", name: "Table 1", capacity: 2, status: "SEATED", guestName: "Elena Rostova", time: "19:00", tags: ["Anniversary 🥂"], x: 18, y: 22, shape: "circle" },
  { id: "t2", name: "Table 2", capacity: 4, status: "RESERVED", guestName: "Marcus Vance", time: "19:30", tags: ["Gluten-Free 🌾"], x: 50, y: 22, shape: "rect" },
  { id: "t3", name: "Table 3", capacity: 2, status: "AVAILABLE", x: 80, y: 22, shape: "circle" },
  { id: "t4", name: "Table 4 (VIP)", capacity: 6, status: "SEATED", guestName: "Sophia Lin", time: "18:45", tags: ["VIP", "Chef Tasting 🍷"], x: 22, y: 65, shape: "rect" },
  { id: "t5", name: "Table 5", capacity: 4, status: "AVAILABLE", x: 55, y: 65, shape: "rect" },
  { id: "t6", name: "Terrace 1", capacity: 4, status: "RESERVED", guestName: "Liam O'Connor", time: "20:00", tags: ["Birthday 🎂"], x: 82, y: 65, shape: "circle" },
]

export function LandingPage() {
  const { t } = useTranslation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"video" | "floorplan" | "analytics">("video")
  const [selectedTable, setSelectedTable] = useState<DemoTable>(INITIAL_TABLES[3])
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [videoProgress, setVideoProgress] = useState(35)
  const [calculatorTables, setCalculatorTables] = useState(24)
  const [activeFloor, setActiveFloor] = useState<"main" | "terrace">("main")

  const featuresList = t("landing.featuresSection.items", { returnObjects: true }) as FeatureItem[]
  const steps = t("landing.howItWorks.steps", { returnObjects: true }) as StepItem[]
  const testimonials = t("landing.testimonials.items", { returnObjects: true }) as TestimonialItem[]
  const plans = t("landing.pricing.plans", { returnObjects: true }) as PlanItem[]

  const softwareSchema = generateSoftwareAppSchema()
  const faqSchema = generateFaqSchema()

  // Video progress animation loop
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setVideoProgress((prev) => (prev >= 100 ? 0 : prev + 1))
    }, 200)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Estimated ROI calculation metrics
  const extraMonthlyCovers = Math.round(calculatorTables * 14.5)
  const hoursSavedPerWeek = Math.round(calculatorTables * 0.45 + 3)
  const estimatedAddedRevenue = Math.round(extraMonthlyCovers * 42)

  return (
    <div className="bg-background text-foreground min-h-screen selection:bg-primary selection:text-primary-foreground">
      <SEOHead
        title="Seat Booking | Modern Restaurant Reservation & Floor Plan System"
        description="Streamline table reservations, design custom 2D floor plans, manage guest walk-ins, and boost dining capacity with Seat Booking."
        canonicalPath="/"
        jsonLd={[softwareSchema, faqSchema]}
      />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold shadow-xs">
              SB
            </span>
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
              <span>{t("common.appName", "Seat Booking")}</span>
            </span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Live Demo
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.features")}
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.howItWorks")}
            </a>
            <a href="#calculator" className="text-muted-foreground hover:text-foreground transition-colors">
              ROI Calculator
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("landing.landingNav.pricing")}
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/login">{t("header.signIn")}</Link>
            </Button>
            <Button size="sm" asChild className="hidden md:inline-flex shadow-xs">
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
                      SB
                    </span>
                    {t("common.appName")}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
                  <a
                    href="#demo"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    Live Demo
                  </a>
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
                    href="#calculator"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    ROI Calculator
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 transition-colors"
                  >
                    {t("landing.landingNav.pricing")}
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

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* Animated Background Aura */}
        <div className="animate-pulse-glow pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[750px] -translate-x-1/2 rounded-full bg-linear-to-tr from-primary/25 via-sky-500/20 to-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <Badge variant="secondary" className="gap-1.5 border px-3.5 py-1.5 text-xs font-semibold shadow-xs animate-fade-in-up">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <span>{t("landing.badge", "Next-Gen Restaurant Reservation & Floor Plan Engine")}</span>
          </Badge>

          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl sm:leading-[1.12] animate-fade-in-up animate-delay-100">
            Run a <span className="animate-gradient-text">smoother service</span>, from booking to the last table turned.
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg text-balance animate-fade-in-up animate-delay-200">
            {t(
              "landing.heroSubtitle",
              "Seat Booking gives restaurants a live interactive 2D floor plan, real-time booking timeline, guest CRM, and 24/7 online reservations — so your front-of-house is always in sync.",
            )}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3.5 animate-fade-in-up animate-delay-300">
            <Button size="lg" className="gap-2 text-sm font-semibold shadow-md sm:h-12 sm:px-7 hover:scale-105 transition-all duration-200" asChild>
              <Link to="/signup">
                {t("landing.heroCtaPrimary", "Start Free Trial")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-sm font-semibold sm:h-12 sm:px-6 hover:scale-105 transition-all duration-200" asChild>
              <a href="#demo">
                <Play className="size-4 fill-current text-primary" />
                <span>Watch Interactive Tour</span>
              </a>
            </Button>
          </div>

          {/* Quick trust metrics */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in-up animate-delay-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-emerald-500" /> 5-minute setup
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Interactive Hero Showcase & Video Demo Container               */}
          {/* ------------------------------------------------------------- */}
          <div id="demo" className="relative mt-8 w-full max-w-5xl animate-fade-in-up animate-delay-400">
            {/* Floating Glassmorphism Badges */}
            <div className="animate-float pointer-events-none absolute -top-5 -left-4 z-20 hidden rounded-xl border bg-background/90 p-3 shadow-xl backdrop-blur-md sm:flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Live Floor Sync</p>
                <p className="text-[11px] text-muted-foreground">Table 4 Seated • 4 Guests</p>
              </div>
            </div>

            <div className="animate-float-reverse pointer-events-none absolute -bottom-6 -right-4 z-20 hidden rounded-xl border bg-background/90 p-3 shadow-xl backdrop-blur-md sm:flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="size-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">98.4% Table Occupancy</p>
                <p className="text-[11px] text-muted-foreground">+38 Online Bookings Today</p>
              </div>
            </div>

            <Card className="overflow-hidden border-2 shadow-2xl transition-all duration-300 hover:shadow-primary/10 card-hover-effect">
              {/* Browser Window Chrome */}
              <div className="flex flex-wrap items-center justify-between border-b bg-muted/50 px-4 py-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-3 rounded-full bg-destructive/80" />
                    <span className="size-3 rounded-full bg-yellow-500/80" />
                    <span className="size-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:inline-block ml-2 font-mono">
                    https://seatbooking.com/demo
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 rounded-lg bg-background/80 p-1 border text-xs font-medium">
                  <button
                    onClick={() => setActiveTab("video")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                      activeTab === "video"
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>Product Reel</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("floorplan")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                      activeTab === "floorplan"
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="size-3.5" />
                    <span>Interactive Floor Plan</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                      activeTab === "analytics"
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BarChart3 className="size-3.5" />
                    <span>Live Metrics</span>
                  </button>
                </div>
              </div>

              <CardContent className="p-0">
                {/* ----------------- TAB 1: PRODUCT VIDEO REEL ----------------- */}
                {activeTab === "video" && (
                  <div className="relative min-h-[380px] sm:min-h-[460px] bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
                    {/* Simulated Background Motion Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
                    <div className="absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl animate-pulse" />

                    {/* Top Video Overlay Bar */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-bold tracking-wide uppercase text-red-400">
                          Interactive Preview
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 bg-slate-900/80">
                        HD 1080p • 60 FPS
                      </Badge>
                    </div>

                    {/* Middle: Video Visual Graphic */}
                    <div className="relative z-10 my-auto grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-2 text-left space-y-3">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs">
                          Floor Plan Designer &amp; Live Booking Flow
                        </Badge>
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                          Watch how restaurants seat 20% more guests in real time.
                        </h3>
                        <p className="text-sm text-slate-300 line-clamp-2">
                          Intuitive drag-and-drop table layouts, real-time sync with host stands, and instant online booking confirmations for diners.
                        </p>

                        {/* Interactive Chapters */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {["2D Canvas Builder", "Guest CRM & Allergies", "SMS / Email Confirmations"].map((chip) => (
                            <span
                              key={chip}
                              className="rounded-md bg-slate-800/80 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                            >
                              ✓ {chip}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Mini Live Graphic Card */}
                      <div className="hidden md:flex flex-col gap-2 rounded-xl bg-slate-900/90 border border-slate-800 p-4 text-left shadow-2xl backdrop-blur-md">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Live Host Stream</span>
                          <span className="text-emerald-400">● Synced</span>
                        </div>
                        <div className="rounded-lg bg-slate-800/80 p-2.5 border border-slate-700">
                          <p className="text-xs font-semibold text-white">Table 4 (VIP Booth)</p>
                          <p className="text-[11px] text-slate-300">Party of 4 • Seated</p>
                          <div className="mt-1.5 flex gap-1">
                            <span className="text-[10px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded">
                              Tasting Menu
                            </span>
                            <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded">
                              Paid
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-800/40 p-2 border border-slate-700/50">
                          <p className="text-[11px] font-medium text-slate-300">Next: 19:30 Table 2 (Marcus V.)</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Custom Video Controls */}
                    <div className="relative z-10 flex flex-col gap-2 pt-4 border-t border-slate-800/80">
                      {/* Timeline Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer">
                        <div
                          className="bg-primary h-full transition-all duration-200 rounded-full"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex size-7 items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-colors"
                          >
                            {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current ml-0.5" />}
                          </button>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                          </button>
                          <span className="text-[11px] font-mono">00:{videoProgress < 10 ? `0${videoProgress}` : videoProgress} / 01:00</span>
                        </div>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          Click any tab to test the interactive floor plan directly
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- TAB 2: INTERACTIVE LIVE FLOOR PLAN ----------------- */}
                {activeTab === "floorplan" && (
                  <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/40">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activeFloor === "main" ? "Main Dining Room (Ground Floor)" : "Rooftop Terrace"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Click any table to view live booking details:</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={activeFloor === "main" ? "default" : "outline"}
                          onClick={() => setActiveFloor("main")}
                          className="h-7 text-xs"
                        >
                          Main Floor
                        </Button>
                        <Button
                          size="sm"
                          variant={activeFloor === "terrace" ? "default" : "outline"}
                          onClick={() => setActiveFloor("terrace")}
                          className="h-7 text-xs"
                        >
                          Terrace
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* 2D Canvas Area */}
                      <div className="lg:col-span-2 relative min-h-[300px] sm:min-h-[340px] rounded-xl border bg-background p-4 flex items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

                        {/* Interactive Tables */}
                        {INITIAL_TABLES.map((table) => {
                          const isSelected = selectedTable.id === table.id
                          let statusBg = "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          if (table.status === "RESERVED") {
                            statusBg = "bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400"
                          } else if (table.status === "SEATED") {
                            statusBg = "bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400"
                          }

                          return (
                            <button
                              key={table.id}
                              onClick={() => setSelectedTable(table)}
                              style={{ left: `${table.x}%`, top: `${table.y}%` }}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 font-medium transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-xs shadow-md ${
                                table.shape === "circle" ? "size-20 rounded-full" : "w-24 h-16 rounded-lg"
                              } ${statusBg} ${
                                isSelected ? "ring-4 ring-primary ring-offset-2 scale-110 z-10" : "hover:scale-105"
                              }`}
                            >
                              <span className="font-bold">{table.name}</span>
                              <span className="text-[10px] opacity-80">{table.capacity} seats</span>
                              <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                                {table.status}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Host Inspection Details Sidebar */}
                      <div className="rounded-xl border bg-card p-4 text-left flex flex-col justify-between shadow-xs">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <div>
                              <h4 className="font-bold text-base">{selectedTable.name}</h4>
                              <p className="text-xs text-muted-foreground">Capacity: {selectedTable.capacity} Guests</p>
                            </div>
                            <Badge
                              variant={
                                selectedTable.status === "AVAILABLE"
                                  ? "secondary"
                                  : selectedTable.status === "RESERVED"
                                    ? "default"
                                    : "destructive"
                              }
                            >
                              {selectedTable.status}
                            </Badge>
                          </div>

                          {selectedTable.status !== "AVAILABLE" ? (
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Guest Name:</span>
                                <p className="font-semibold text-sm">{selectedTable.guestName}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time Slot:</span>
                                <p className="font-semibold">{selectedTable.time} (Tonight)</p>
                              </div>
                              {selectedTable.tags && selectedTable.tags.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">Guest Notes &amp; Dietary:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedTable.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-[11px] bg-accent/50">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                              <p className="font-medium text-emerald-600 dark:text-emerald-400">● Table is Free</p>
                              <p className="mt-1">Ready for online reservation or walk-in seating.</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t">
                          <Button size="sm" className="w-full text-xs hover:scale-102 transition-all" asChild>
                            <Link to="/signup">Try Customizing Your Floor Plan →</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------- TAB 3: LIVE METRICS & ANALYTICS ----------------- */}
                {activeTab === "analytics" && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="rounded-xl border bg-card p-4 text-left card-hover-effect">
                        <p className="text-xs text-muted-foreground font-medium">Tonight&apos;s Covers</p>
                        <p className="text-2xl font-bold mt-1 text-primary">142 Guests</p>
                        <p className="text-xs text-emerald-600 font-medium mt-1">↑ +18% vs Last Week</p>
                      </div>
                      <div className="rounded-xl border bg-card p-4 text-left card-hover-effect">
                        <p className="text-xs text-muted-foreground font-medium">Table Turn Rate</p>
                        <p className="text-2xl font-bold mt-1 text-primary">1.8 Turns</p>
                        <p className="text-xs text-muted-foreground mt-1">Avg 78 mins / table</p>
                      </div>
                      <div className="rounded-xl border bg-card p-4 text-left card-hover-effect">
                        <p className="text-xs text-muted-foreground font-medium">Online Bookings</p>
                        <p className="text-2xl font-bold mt-1 text-primary">86%</p>
                        <p className="text-xs text-sky-600 font-medium mt-1">via 24/7 Public Link</p>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 text-left card-hover-effect">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Hourly Seating Demand Distribution
                      </h4>
                      <div className="flex items-end gap-2 h-28 pt-4">
                        {[
                          { time: "17:00", val: 30 },
                          { time: "18:00", val: 65 },
                          { time: "19:00", val: 100 },
                          { time: "20:00", val: 92 },
                          { time: "21:00", val: 70 },
                          { time: "22:00", val: 40 },
                        ].map((bar) => (
                          <div key={bar.time} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <div
                              style={{ height: `${bar.val}%` }}
                              className="w-full bg-primary/85 rounded-t-md hover:bg-primary transition-all cursor-pointer"
                            />
                            <span className="text-[10px] text-muted-foreground">{bar.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Quick Stats Strip */}
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5 border-t bg-muted/20">
                  {[
                    { label: t("landing.demo.tonightsCovers", "Tonight's covers"), value: "142", icon: UtensilsCrossed },
                    { label: t("landing.demo.reservations", "Active Bookings"), value: "48", icon: CalendarClock },
                    { label: t("landing.demo.tablesOccupied", "Floor Occupancy"), value: "22 / 24", icon: LayoutGrid },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card flex items-center gap-3 rounded-lg border p-3.5 shadow-2xs card-hover-effect">
                      <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                        <stat.icon className="size-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-muted-foreground text-xs">{stat.label}</p>
                        <p className="text-lg font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <ScrollReveal direction="up" threshold={0.1}>
            <p className="text-muted-foreground text-center text-xs font-semibold tracking-wider uppercase">
              {t("landing.trust.title", "Trusted by modern restaurants, bistros, and hospitality groups")}
            </p>
            <div className="text-muted-foreground/75 mt-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-3 text-base sm:text-lg font-bold">
              <span className="hover:text-foreground transition-colors cursor-default">Lumen Bistro</span>
              <span className="hover:text-foreground transition-colors cursor-default">The Copper Fork</span>
              <span className="hover:text-foreground transition-colors cursor-default">Nair &amp; Co.</span>
              <span className="hover:text-foreground transition-colors cursor-default">Harbor House</span>
              <span className="hover:text-foreground transition-colors cursor-default">Marchetti&apos;s</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-2">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.featuresSection.title", "Everything your front-of-house team needs")}
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">
            {t("landing.featuresSection.subtitle", "One unified platform to design your floor plan, manage bookings, and understand your diners.")}
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuresList.map((feature, index) => {
            const Icon = featureIcons[index] ?? LayoutGrid
            return (
              <ScrollReveal key={feature.title} delay={index * 100} direction="up" className="h-full">
                <Card className="h-full border card-hover-effect">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-bold text-base">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* Interactive ROI / Capacity Calculator */}
      <section id="calculator" className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center mb-12">
            <Badge variant="secondary" className="mb-2">ROI Calculator</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              See what Seat Booking does for your bottom line
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Slide to match your dining room size and see your estimated revenue boost.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150}>
            <div className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 sm:p-10 shadow-lg card-hover-effect">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6 text-left">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold">Dining Room Tables:</label>
                      <span className="text-xl font-bold text-primary">{calculatorTables} Tables</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={calculatorTables}
                      onChange={(e) => setCalculatorTables(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                      <span>5 tables (Cozy cafe)</span>
                      <span>80 tables (Large venue)</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Eliminates double-bookings with live conflict checks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Cuts guest no-shows by 50% with automated email confirmations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>Takes bookings 24/7 while your phone lines are closed</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-primary text-primary-foreground p-6 text-left flex flex-col justify-between space-y-6 shadow-md card-hover-effect">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80 font-bold">Estimated Monthly Impact</p>
                    <p className="text-4xl sm:text-5xl font-extrabold mt-2 tracking-tight">
                      +${estimatedAddedRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs opacity-90 mt-1">additional estimated monthly gross revenue</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-primary-foreground/20 pt-4">
                    <div>
                      <p className="text-2xl font-bold">+{extraMonthlyCovers}</p>
                      <p className="text-xs opacity-80">Extra Monthly Covers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">~{hoursSavedPerWeek} hrs</p>
                      <p className="text-xs opacity-80">Saved / Week at Host Stand</p>
                    </div>
                  </div>

                  <Button variant="secondary" className="w-full font-bold shadow-xs hover:scale-102 transition-all" asChild>
                    <Link to="/signup">Start Free Today →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-2">Simple Setup</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.howItWorks.title", "Up and running in three simple steps")}
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">
            {t("landing.howItWorks.subtitle", "No lengthy onboarding — most restaurants are taking bookings the same day.")}
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 150} direction="up">
              <div className="relative flex flex-col gap-4 text-left p-6 rounded-xl border bg-card card-hover-effect h-full">
                <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl text-base font-bold shadow-xs">
                  0{index + 1}
                </span>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-y bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-2">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("landing.testimonials.title", "Loved by restaurant teams worldwide")}
            </h2>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={testimonial.name} delay={index * 120} direction="up" className="h-full">
                <Card className="h-full border shadow-xs card-hover-effect">
                  <CardContent className="flex h-full flex-col gap-4 p-6 text-left">
                    <div className="flex gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm italic leading-relaxed text-foreground/90">&ldquo;{testimonial.quote}&rdquo;</p>
                    <div className="mt-auto pt-4 border-t">
                      <p className="text-sm font-bold">{testimonial.name}</p>
                      <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-2">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("landing.pricing.title", "Simple, transparent pricing")}
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">
            {t("landing.pricing.subtitle", "Start free. Upgrade when your restaurant is ready to grow.")}
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const highlighted = index === 1
            return (
              <ScrollReveal key={plan.name} delay={index * 120} direction="up" className="h-full">
                <Card
                  className={`relative flex flex-col justify-between card-hover-effect h-full ${
                    highlighted ? "border-primary shadow-xl lg:-translate-y-2 border-2" : "border shadow-xs"
                  }`}
                >
                  {highlighted && (
                    <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground font-bold text-xs">
                      {t("landing.pricing.mostPopular", "Most Popular")}
                    </Badge>
                  )}
                  <CardContent className="flex flex-1 flex-col gap-5 p-6 text-left">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>}
                    </div>
                    <ul className="flex flex-1 flex-col gap-2.5 text-sm pt-2 border-t">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-4 font-semibold shadow-xs hover:scale-102 transition-all"
                      variant={highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/signup">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <ScrollReveal direction="up" delay={100}>
          <Card className="bg-primary text-primary-foreground overflow-hidden shadow-2xl rounded-2xl card-hover-effect">
            <CardContent className="flex flex-col items-center gap-5 py-14 px-6 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl max-w-xl">
                {t("landing.ctaBanner.title", "Ready to transform your dining room service?")}
              </h2>
              <p className="max-w-xl text-sm sm:text-base opacity-90 leading-relaxed">
                {t(
                  "landing.ctaBanner.subtitle",
                  "Join hundreds of restaurant managers who seat guests faster and eliminate no-shows with Seat Booking.",
                )}
              </p>
              <Button size="lg" variant="secondary" className="gap-2 font-bold shadow-md h-12 px-8 mt-2 hover:scale-105 transition-all" asChild>
                <Link to="/signup">
                  {t("landing.ctaBanner.button", "Get Started Free Today")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
              SB
            </span>
            <span className="text-sm font-bold">{t("common.appName", "Seat Booking")}</span>
          </div>
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {t("common.appName", "Seat Booking")}. {t("landing.footer.rights", "All rights reserved.")}
          </p>
        </div>
      </footer>
    </div>
  )
}
