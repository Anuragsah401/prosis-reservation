import { useEffect, useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { QRCodeSVG } from "qrcode.react"
import {
  Sparkles,
  Clock,
  MapPin,
  UtensilsCrossed,
  Store,
  CheckCircle2,
  CalendarCheck,
  X,
  QrCode,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { authClient } from "@/features/auth/auth-client"
import { useScreenSaver } from "./screensaver-context"
import { type ScreenSaverTheme } from "./screensaver-types"
import { cn } from "@/lib/utils"

const THEME_STYLES: Record<
  ScreenSaverTheme,
  {
    bg: string
    accentGlow1: string
    accentGlow2: string
    border: string
    tagBg: string
    textHighlight: string
  }
> = {
  midnight: {
    bg: "from-[#070b14] via-[#0b1329] to-[#040711]",
    accentGlow1: "bg-blue-600/25",
    accentGlow2: "bg-indigo-500/20",
    border: "border-blue-500/30",
    tagBg: "bg-blue-500/15 border-blue-500/30 text-blue-300",
    textHighlight: "from-blue-400 via-indigo-200 to-sky-400",
  },
  aurora: {
    bg: "from-[#04130c] via-[#071f16] to-[#020b07]",
    accentGlow1: "bg-emerald-500/25",
    accentGlow2: "bg-teal-500/20",
    border: "border-emerald-500/30",
    tagBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    textHighlight: "from-emerald-400 via-teal-200 to-green-400",
  },
  gold: {
    bg: "from-[#140e05] via-[#21160a] to-[#0c0803]",
    accentGlow1: "bg-amber-500/25",
    accentGlow2: "bg-orange-500/20",
    border: "border-amber-500/30",
    tagBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    textHighlight: "from-amber-400 via-yellow-200 to-orange-400",
  },
  bistro: {
    bg: "from-[#17060a] via-[#240a12] to-[#0d0205]",
    accentGlow1: "bg-rose-500/25",
    accentGlow2: "bg-pink-500/20",
    border: "border-rose-500/30",
    tagBg: "bg-rose-500/15 border-rose-500/30 text-rose-300",
    textHighlight: "from-rose-400 via-pink-200 to-red-400",
  },
}

const PROMO_SLIDES = [
  {
    tagline: "Instant Online Reservations",
    subtext: "Reserve your favorite table directly from any phone, tablet, or desktop in seconds.",
    icon: CalendarCheck,
  },
  {
    tagline: "Interactive Seating Selection",
    subtext: "Choose exactly where you'd like to sit with real-time floor plan layout visibility.",
    icon: Store,
  },
  {
    tagline: "Official SeatBooking.dk Partnership",
    subtext: "Experience Denmark's premier dining and table reservation network.",
    icon: Sparkles,
  },
]

export function ScreenSaverOverlay() {
  const { isActive, dismissScreenSaver, settings } = useScreenSaver()
  const { profile } = useRestaurant()
  const user = authClient.getUser()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSlide, setActiveSlide] = useState(0)

  const restaurantName = profile?.name || user?.restaurant?.name || "Our Restaurant"
  const restaurantId = profile?.id || user?.restaurantId || ""
  const theme = THEME_STYLES[settings.theme] || THEME_STYLES.midnight

  // Booking URL
  const bookingUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://seatbooking.dk"
    const origin = window.location.origin
    return restaurantId ? `${origin}/restaurant/${restaurantId}/book` : `${origin}`
  }, [restaurantId])

  // Live clock tick
  useEffect(() => {
    if (!isActive) return
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [isActive])

  // Auto-rotating promo slides
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [isActive])

  // Close on Escape key
  useEffect(() => {
    if (!isActive) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissScreenSaver()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, dismissScreenSaver])

  if (!isActive) return null

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentSlideData = PROMO_SLIDES[activeSlide]
  const SlideIcon = currentSlideData.icon

  return createPortal(
    <div
      onClick={dismissScreenSaver}
      className={cn(
        "fixed inset-0 z-[999999] w-screen h-screen min-h-svh flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer",
        "bg-gradient-to-br transition-all duration-700 text-white font-sans",
        theme.bg,
      )}
    >
      {/* Ambient Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "absolute -top-40 -left-40 size-[600px] rounded-full blur-[140px] animate-pulse transition-all duration-1000",
            theme.accentGlow1,
          )}
        />
        <div
          className={cn(
            "absolute -bottom-40 -right-40 size-[650px] rounded-full blur-[160px] animate-pulse transition-all duration-1000 delay-500",
            theme.accentGlow2,
          )}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Bar: Live Clock, Status Beacon & Exit Button */}
      <header className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Live Digital Clock */}
        {settings.showClock ? (
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
              <Clock className="size-4 text-white/70 animate-spin" style={{ animationDuration: "12s" }} />
              <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white">
                {formattedTime}
              </span>
              <span className="text-xs text-white/60 font-medium hidden sm:inline-block">
                • {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Center/Right: Live System Badge & Dismiss Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400 shadow-sm backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">LIVE RESERVATION DESK</span>
            <span className="sm:hidden">LIVE</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              dismissScreenSaver()
            }}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all shadow-md"
            aria-label="Exit screen saver"
            title="Close screen saver"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      {/* Main Centerpiece: Dual Brand Showcase & QR Booking Card */}
      <main className="relative z-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
        {/* Left Column (Co-Branding & Promo Messaging) - 7 Cols */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          {/* Partnership Header Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide backdrop-blur-md shadow-xs"
               style={{ backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" }}>
            <Sparkles className="size-3.5 text-amber-400 animate-pulse" />
            <span className="uppercase tracking-widest text-white/90">Exclusive Dining Partnership</span>
          </div>

          {/* Combined Brand Presentation */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Restaurant Logo / Avatar */}
              {profile?.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={restaurantName}
                  className="size-16 sm:size-20 rounded-2xl border-2 border-white/20 object-contain bg-white/10 p-2 shadow-2xl backdrop-blur-md"
                />
              ) : (
                <div className="size-16 sm:size-20 rounded-2xl border-2 border-white/20 bg-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
                  <UtensilsCrossed className="size-8 text-white" />
                </div>
              )}

              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  {restaurantName}
                </h1>
                {profile?.address && (
                  <p className="text-white/60 text-sm flex items-center gap-1.5 mt-1">
                    <MapPin className="size-3.5 text-white/50 shrink-0" />
                    <span>{profile.address}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Partnership Linking Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
              <span className="text-[11px] uppercase tracking-widest text-white/50 font-bold px-2">
                In Partnership With
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-white/20 via-white/10 to-transparent" />
            </div>

            {/* SeatBooking.dk Big Brand Presentation */}
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
                SB
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r bg-clip-text text-transparent", theme.textHighlight)}>
                    seatbooking.dk
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/80 uppercase">
                    Official Booking Engine
                  </span>
                </div>
                <p className="text-xs text-white/60 font-medium">
                  {settings.customHeadline || "Seamless Online Table Bookings & Real-Time Floor Management"}
                </p>
              </div>
            </div>
          </div>

          {/* Animated Promo Carousel Card */}
          <div className="relative mt-2 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <SlideIcon className="size-5 text-white" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight transition-all duration-300">
                  {currentSlideData.tagline}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-1 leading-relaxed transition-all duration-300">
                  {currentSlideData.subtext}
                </p>
              </div>
            </div>

            {/* Slide pagination dots */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/10">
              {PROMO_SLIDES.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    activeSlide === idx ? "w-6 bg-white shadow-sm" : "w-1.5 bg-white/25",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Instant QR Code Booking Kiosk) - 5 Cols */}
        {settings.showQrCode && (
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm rounded-3xl border-2 border-white/20 bg-white/10 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center group transition-transform hover:scale-[1.01]">
              {/* Card top badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold text-white mb-4 shadow-xs">
                <QrCode className="size-3.5" />
                <span>SCAN TO RESERVE A TABLE</span>
              </div>

              {/* High-Resolution QR Code with Logo Badge */}
              <div className="relative p-4 rounded-2xl bg-white shadow-2xl border-4 border-white/90">
                <QRCodeSVG
                  value={bookingUrl}
                  size={190}
                  level="H"
                  includeMargin={false}
                  imageSettings={
                    profile?.logoUrl
                      ? {
                          src: profile.logoUrl,
                          height: 38,
                          width: 38,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              {/* QR Instructions */}
              <div className="mt-4 flex flex-col items-center">
                <h4 className="text-base font-bold text-white tracking-tight">
                  Reserve from your phone
                </h4>
                <p className="text-xs text-white/70 mt-1 max-w-[240px]">
                  Point your camera to view available tables & secure your spot on <span className="text-white font-semibold underline">seatbooking.dk</span>
                </p>
              </div>

              {/* Feature Checkpoints */}
              <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-around text-[11px] text-white/80 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-400" /> Instant Confirm
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-400" /> Free Booking
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 flex items-center justify-between gap-4 text-xs text-white/60 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-white/60 animate-ping" />
          <span>Interactive Standby Display Active</span>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-white/80 backdrop-blur-md shadow-xs">
          <span>Press Escape or touch anywhere to resume</span>
          <ChevronRight className="size-3.5" />
        </div>
      </footer>
    </div>,
    document.body,
  )
}
