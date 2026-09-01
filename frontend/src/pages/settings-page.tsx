import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { supportedLanguages } from "@/i18n"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { LogoUpload } from "@/components/ui/logo-upload"
import { authClient } from "@/features/auth/auth-client"
import {
  updateRestaurantProfile,
  minutesToTimeString,
  timeStringToMinutes,
  type RestaurantProfile,
} from "@/features/restaurant/restaurant-api"
import { ScreenSaverSettingsSection } from "@/features/screensaver/screensaver-settings-section"
import { Badge } from "@/components/ui/badge"
import { usePWA } from "@/hooks/use-pwa"
import { PWAInstallButton } from "@/components/pwa-install-dialog"
import {
  Store,
  CalendarClock,
  Bell,
  LayoutGrid,
  Monitor,
  Users,
  CreditCard,
  ShieldCheck,
  Loader2,
  Clock,
  Smartphone,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Key,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  Laptop,
} from "lucide-react"

export type SettingsSection =
  | "profile"
  | "reservations"
  | "notifications"
  | "tables"
  | "screensaver"
  | "app"
  | "team"
  | "billing"
  | "security"

interface NavItem {
  id: SettingsSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavCategory {
  title: string
  items: NavItem[]
}

const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen (CET/CEST)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul (TRT)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
]

// ==========================================
// 1. Restaurant Profile Section
// ==========================================
function RestaurantProfileSection() {
  const { t, i18n } = useTranslation()
  const { profile, loading, refresh } = useRestaurant()
  const user = authClient.getUser()
  const effectiveProfile = profile || (user?.restaurant as RestaurantProfile | undefined) || null

  const [name, setName] = useState(effectiveProfile?.name ?? "")
  const [email, setEmail] = useState(effectiveProfile?.email ?? "")
  const [phone, setPhone] = useState(effectiveProfile?.phone ?? "")
  const [address, setAddress] = useState(effectiveProfile?.address ?? "")
  const [logoUrl, setLogoUrl] = useState<string | null>(effectiveProfile?.logoUrl ?? null)
  const [timezone, setTimezone] = useState(effectiveProfile?.timezone ?? "UTC")
  const [openingTime, setOpeningTime] = useState(
    effectiveProfile?.openingTime != null ? minutesToTimeString(effectiveProfile.openingTime) : "11:00",
  )
  const [closingTime, setClosingTime] = useState(
    effectiveProfile?.closingTime != null ? minutesToTimeString(effectiveProfile.closingTime) : "23:00",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (effectiveProfile) {
      setName(effectiveProfile.name ?? "")
      setEmail(effectiveProfile.email ?? "")
      setPhone(effectiveProfile.phone ?? "")
      setAddress(effectiveProfile.address ?? "")
      setLogoUrl(effectiveProfile.logoUrl ?? null)
      setTimezone(effectiveProfile.timezone ?? "UTC")
      setOpeningTime(effectiveProfile.openingTime != null ? minutesToTimeString(effectiveProfile.openingTime) : "11:00")
      setClosingTime(effectiveProfile.closingTime != null ? minutesToTimeString(effectiveProfile.closingTime) : "23:00")
      setError(null)
    }
  }, [effectiveProfile])

  function resetToCurrent() {
    if (effectiveProfile) {
      setName(effectiveProfile.name ?? "")
      setEmail(effectiveProfile.email ?? "")
      setPhone(effectiveProfile.phone ?? "")
      setAddress(effectiveProfile.address ?? "")
      setLogoUrl(effectiveProfile.logoUrl ?? null)
      setTimezone(effectiveProfile.timezone ?? "UTC")
      setOpeningTime(effectiveProfile.openingTime != null ? minutesToTimeString(effectiveProfile.openingTime) : "11:00")
      setClosingTime(effectiveProfile.closingTime != null ? minutesToTimeString(effectiveProfile.closingTime) : "23:00")
      setError(null)
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const targetId = profile?.id || effectiveProfile?.id || user?.restaurantId
    if (!targetId) {
      toast.error(t("pages.settings.profile.saveError", "No restaurant associated with this account"))
      return
    }

    if (!name.trim()) {
      setError(t("pages.settings.profile.nameRequired", "Restaurant name is required"))
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await updateRestaurantProfile(targetId, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        logoUrl: logoUrl || null,
        timezone,
        openingTime: timeStringToMinutes(openingTime),
        closingTime: timeStringToMinutes(closingTime),
      })
      toast.success(t("pages.settings.profile.saveSuccess", "Restaurant profile updated successfully"))
      refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("pages.settings.profile.saveError", "Failed to update restaurant profile")
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading && !effectiveProfile) {
    return (
      <Card className="rounded-2xl border-border/80">
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg font-semibold">{t("pages.settings.profile.title", "Restaurant Profile")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              {t("pages.settings.profile.description", "Manage public branding, address, service hours, and contact details.")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active & Accepting Bookings</span>
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="flex flex-col gap-5 pt-0">
          {/* Logo Upload */}
          <LogoUpload
            value={logoUrl}
            onChange={setLogoUrl}
            label={t("pages.settings.profile.logo", "Restaurant Brand Logo")}
            description={t("pages.settings.profile.logoDesc", "Displayed on your booking page, dashboard header, and confirmation receipts.")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-name" className="text-xs font-semibold">
                {t("pages.settings.profile.name", "Restaurant Name")}
              </Label>
              <Input
                id="restaurant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trattoria Bella"
                required
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-slug" className="text-xs font-semibold">
                {t("pages.settings.profile.slug", "Slug & Identifier")}
              </Label>
              <Input
                id="restaurant-slug"
                value={effectiveProfile?.slug ?? ""}
                disabled
                className="bg-muted/50 cursor-not-allowed rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-email" className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="size-3 text-muted-foreground" />
                <span>{t("pages.settings.profile.email", "Contact Email")}</span>
              </Label>
              <Input
                id="restaurant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reservations@restaurant.com"
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-phone" className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="size-3 text-muted-foreground" />
                <span>{t("pages.settings.profile.phone", "Phone Number")}</span>
              </Label>
              <Input
                id="restaurant-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="restaurant-address" className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="size-3 text-muted-foreground" />
              <span>{t("pages.settings.profile.address", "Street Address & City")}</span>
            </Label>
            <Input
              id="restaurant-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Østergade 12, 1100 København K"
              className="rounded-xl"
            />
          </div>

          <Separator className="my-1" />

          {/* Opening & Service Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                <span>{t("pages.settings.profile.openingHours", "Daily Service Hours")}</span>
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {openingTime} – {closingTime}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="opening-time" className="text-xs font-medium text-muted-foreground">
                  {t("pages.settings.profile.openingTime", "Opening Time (First Seating)")}
                </Label>
                <Input
                  id="opening-time"
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  step={900}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="closing-time" className="text-xs font-medium text-muted-foreground">
                  {t("pages.settings.profile.closingTime", "Closing Time (Last Seating)")}
                </Label>
                <Input
                  id="closing-time"
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  step={900}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <Separator className="my-1" />

          {/* Timezone & Language */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone" className="text-xs font-semibold">
                {t("pages.settings.profile.timezone", "Timezone")}
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" className="w-full rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language" className="text-xs font-semibold">
                {t("settings.language.label", "Staff Interface Language")}
              </Label>
              <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                <SelectTrigger id="language" className="w-full rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      {lang.nativeLabel} ({lang.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-destructive text-xs font-medium">{error}</p>}
        </CardContent>

        <CardFooter className="justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={resetToCurrent} disabled={isSaving} className="rounded-xl text-xs">
            {t("pages.settings.cancel", "Cancel")}
          </Button>
          <Button type="submit" disabled={isSaving || !effectiveProfile} className="rounded-xl text-xs font-semibold">
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            {t("pages.settings.saveChanges", "Save Changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ==========================================
// 2. Reservation Policies Section
// ==========================================
function ReservationSettingsSection() {
  const { t } = useTranslation()
  const s = "pages.settings.reservationsSection"

  const [duration, setDuration] = useState(() => localStorage.getItem("prosisit:settings:duration") || "90")
  const [bufferTime, setBufferTime] = useState(() => localStorage.getItem("prosisit:settings:buffer") || "15")
  const [maxParty, setMaxParty] = useState(() => Number(localStorage.getItem("prosisit:settings:maxParty")) || 12)
  const [advanceNotice, setAdvanceNotice] = useState(() => localStorage.getItem("prosisit:settings:advance") || "60")
  const [bookingWindow, setBookingWindow] = useState(() => localStorage.getItem("prosisit:settings:window") || "60")
  const [cancellationWindow, setCancellationWindow] = useState(() => localStorage.getItem("prosisit:settings:cancelWindow") || "120")
  const [onlineBooking, setOnlineBooking] = useState(() => localStorage.getItem("prosisit:settings:online") !== "false")
  const [autoConfirm, setAutoConfirm] = useState(() => localStorage.getItem("prosisit:settings:autoConfirm") === "true")
  const [waitlist, setWaitlist] = useState(() => localStorage.getItem("prosisit:settings:waitlist") !== "false")
  const [allowSameDay, setAllowSameDay] = useState(() => localStorage.getItem("prosisit:settings:sameDay") !== "false")
  const [policyText, setPolicyText] = useState(() => localStorage.getItem("prosisit:settings:policy") || "We hold reservations for up to 15 minutes past booking time. Cancellations requested at least 2 hours in advance are completely free.")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem("prosisit:settings:duration", duration)
    localStorage.setItem("prosisit:settings:buffer", bufferTime)
    localStorage.setItem("prosisit:settings:maxParty", String(maxParty))
    localStorage.setItem("prosisit:settings:advance", advanceNotice)
    localStorage.setItem("prosisit:settings:window", bookingWindow)
    localStorage.setItem("prosisit:settings:cancelWindow", cancellationWindow)
    localStorage.setItem("prosisit:settings:online", String(onlineBooking))
    localStorage.setItem("prosisit:settings:autoConfirm", String(autoConfirm))
    localStorage.setItem("prosisit:settings:waitlist", String(waitlist))
    localStorage.setItem("prosisit:settings:sameDay", String(allowSameDay))
    localStorage.setItem("prosisit:settings:policy", policyText)

    setTimeout(() => {
      setSaving(false)
      toast.success("Reservation policies saved successfully")
    }, 400)
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Reservation Policies & Timing")}</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-0.5">
          {t(`${s}.description`, "Control table duration, turnover buffers, advance limits, and online booking rules.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="default-duration" className="text-xs font-semibold">{t(`${s}.defaultDuration`, "Default Table Duration")}</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="default-duration" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30" className="text-xs">30 minutes</SelectItem>
                <SelectItem value="45" className="text-xs">45 minutes</SelectItem>
                <SelectItem value="60" className="text-xs">1 hour (60 min)</SelectItem>
                <SelectItem value="90" className="text-xs">1.5 hours (90 min - Standard)</SelectItem>
                <SelectItem value="120" className="text-xs">2 hours (120 min)</SelectItem>
                <SelectItem value="150" className="text-xs">2.5 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="buffer-time" className="text-xs font-semibold">{t(`${s}.bufferTime`, "Turnover Cleaning Buffer")}</Label>
            <Select value={bufferTime} onValueChange={setBufferTime}>
              <SelectTrigger id="buffer-time" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">No buffer (Immediate)</SelectItem>
                <SelectItem value="10" className="text-xs">10 minutes</SelectItem>
                <SelectItem value="15" className="text-xs">15 minutes (Recommended)</SelectItem>
                <SelectItem value="30" className="text-xs">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="max-party" className="text-xs font-semibold">{t(`${s}.maxParty`, "Max Online Party Size")}</Label>
            <Input
              id="max-party"
              type="number"
              min={1}
              max={50}
              value={maxParty}
              onChange={(e) => setMaxParty(Number(e.target.value))}
              className="rounded-xl text-xs"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="advance-notice" className="text-xs font-semibold">{t(`${s}.advanceNotice`, "Minimum Advance Notice")}</Label>
            <Select value={advanceNotice} onValueChange={setAdvanceNotice}>
              <SelectTrigger id="advance-notice" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">Immediate (Walk-in & same minute)</SelectItem>
                <SelectItem value="30" className="text-xs">30 minutes before</SelectItem>
                <SelectItem value="60" className="text-xs">1 hour before</SelectItem>
                <SelectItem value="120" className="text-xs">2 hours before</SelectItem>
                <SelectItem value="1440" className="text-xs">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-window" className="text-xs font-semibold">{t(`${s}.bookingWindow`, "Future Booking Window")}</Label>
            <Select value={bookingWindow} onValueChange={setBookingWindow}>
              <SelectTrigger id="booking-window" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30" className="text-xs">30 days in advance</SelectItem>
                <SelectItem value="60" className="text-xs">60 days (2 months)</SelectItem>
                <SelectItem value="90" className="text-xs">90 days (1 quarter)</SelectItem>
                <SelectItem value="365" className="text-xs">1 full year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancellation-window" className="text-xs font-semibold">{t(`${s}.cancellationWindow`, "Free Cancellation Window")}</Label>
            <Select value={cancellationWindow} onValueChange={setCancellationWindow}>
              <SelectTrigger id="cancellation-window" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">No cancellations online</SelectItem>
                <SelectItem value="60" className="text-xs">Up to 1 hour before</SelectItem>
                <SelectItem value="120" className="text-xs">Up to 2 hours before</SelectItem>
                <SelectItem value="1440" className="text-xs">Up to 24 hours before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-1" />

        {/* Feature Switches */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.onlineBooking`, "Public Online Booking")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.onlineBookingDesc`, "Allow customers to book tables through your live booking link.")}
              </p>
            </div>
            <Switch checked={onlineBooking} onCheckedChange={setOnlineBooking} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.autoConfirm`, "Automatic Booking Confirmation")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.autoConfirmDesc`, "Automatically confirm bookings when table availability matches.")}
              </p>
            </div>
            <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.waitlist`, "Waitlist Support")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.waitlistDesc`, "Allow guests to join a standby waitlist if fully booked.")}
              </p>
            </div>
            <Switch checked={waitlist} onCheckedChange={setWaitlist} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.sameDay`, "Same-Day Bookings")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.sameDayDesc`, "Allow guests to make reservations for the current day.")}
              </p>
            </div>
            <Switch checked={allowSameDay} onCheckedChange={setAllowSameDay} />
          </div>
        </div>

        <Separator className="my-1" />

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-policy" className="text-xs font-semibold">{t(`${s}.policyLabel`, "Customer Booking & Cancellation Policy")}</Label>
          <Textarea
            id="booking-policy"
            rows={3}
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder={t(`${s}.policyPlaceholder`, "Enter terms shown to customers during booking confirmation.")}
            className="rounded-xl text-xs leading-relaxed"
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-semibold">
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          <span>{t("pages.settings.saveChanges", "Save Changes")}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ==========================================
// 3. Notifications Section
// ==========================================
function NotificationsSection() {
  const { t } = useTranslation()
  const s = "pages.settings.notificationsSection"

  const [emailConfirmations, setEmailConfirmations] = useState(() => localStorage.getItem("prosisit:notify:email") !== "false")
  const [smsReminders, setSmsReminders] = useState(() => localStorage.getItem("prosisit:notify:sms") === "true")
  const [staffAlerts, setStaffAlerts] = useState(() => localStorage.getItem("prosisit:notify:staff") !== "false")
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem("prosisit:notify:sound") !== "false")
  const [reminderLeadTime, setReminderLeadTime] = useState(() => localStorage.getItem("prosisit:notify:lead") || "120")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem("prosisit:notify:email", String(emailConfirmations))
    localStorage.setItem("prosisit:notify:sms", String(smsReminders))
    localStorage.setItem("prosisit:notify:staff", String(staffAlerts))
    localStorage.setItem("prosisit:notify:sound", String(soundAlerts))
    localStorage.setItem("prosisit:notify:lead", reminderLeadTime)

    setTimeout(() => {
      setSaving(false)
      toast.success("Notification preferences saved")
    }, 400)
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Notifications & Alerts")}</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-0.5">
          {t(`${s}.description`, "Manage transactional confirmation emails, reminder schedules, and staff audio alerts.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.emailConfirmations`, "Customer Email Confirmations")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.emailConfirmationsDesc`, "Automatically send rich HTML confirmation emails with table selection.")}
              </p>
            </div>
            <Switch checked={emailConfirmations} onCheckedChange={setEmailConfirmations} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.staffAlerts`, "Live Staff Dashboard Alerts")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.staffAlertsDesc`, "Show instant toast notifications when customers book or cancel online.")}
              </p>
            </div>
            <Switch checked={staffAlerts} onCheckedChange={setStaffAlerts} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">Sound Notifications on New Booking</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                Play a subtle chime on staff tablets and POS screens when a new reservation arrives.
              </p>
            </div>
            <Switch checked={soundAlerts} onCheckedChange={setSoundAlerts} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.smsReminders`, "SMS Reminders & Status Updates")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.smsRemindersDesc`, "Send automated SMS fallback to guests without an email on file.")}
              </p>
            </div>
            <Switch checked={smsReminders} onCheckedChange={setSmsReminders} />
          </div>
        </div>

        <Separator className="my-1" />

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-lead-time" className="text-xs font-semibold">{t(`${s}.reminderLeadTime`, "Automated Booking Reminder Lead Time")}</Label>
          <Select value={reminderLeadTime} onValueChange={setReminderLeadTime}>
            <SelectTrigger id="reminder-lead-time" className="w-full sm:w-72 rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60" className="text-xs">1 hour before arrival</SelectItem>
              <SelectItem value="120" className="text-xs">2 hours before arrival (Standard)</SelectItem>
              <SelectItem value="240" className="text-xs">4 hours before arrival</SelectItem>
              <SelectItem value="1440" className="text-xs">24 hours before (1 day prior)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-semibold">
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          <span>{t("pages.settings.saveChanges", "Save Changes")}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ==========================================
// 4. Tables & Floor Plan Settings Section
// ==========================================
function TablesSection() {
  const { t } = useTranslation()
  const s = "pages.settings.tablesSection"

  const [turnover, setTurnover] = useState(() => localStorage.getItem("prosisit:tables:turnover") || "90")
  const [cleaningBuffer, setCleaningBuffer] = useState(() => localStorage.getItem("prosisit:tables:cleaning") || "10")
  const [autoAssign, setAutoAssign] = useState(() => localStorage.getItem("prosisit:tables:autoAssign") !== "false")
  const [allowOverbooking, setAllowOverbooking] = useState(() => localStorage.getItem("prosisit:tables:overbooking") === "true")
  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem("prosisit:tables:turnover", turnover)
    localStorage.setItem("prosisit:tables:cleaning", cleaningBuffer)
    localStorage.setItem("prosisit:tables:autoAssign", String(autoAssign))
    localStorage.setItem("prosisit:tables:overbooking", String(allowOverbooking))

    setTimeout(() => {
      setSaving(false)
      toast.success("Table management rules saved")
    }, 400)
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Floor Plan & Table Management")}</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-0.5">
          {t(`${s}.description`, "Configure automatic seating optimization, turnover calculations, and floor capacity rules.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="table-turnover" className="text-xs font-semibold">{t(`${s}.turnover`, "Average Table Turnover")}</Label>
            <Select value={turnover} onValueChange={setTurnover}>
              <SelectTrigger id="table-turnover" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45" className="text-xs">45 minutes (Quick bistro)</SelectItem>
                <SelectItem value="60" className="text-xs">1 hour (Casual dining)</SelectItem>
                <SelectItem value="90" className="text-xs">1.5 hours (Full service)</SelectItem>
                <SelectItem value="120" className="text-xs">2 hours (Fine dining tasting)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cleaning-buffer" className="text-xs font-semibold">{t(`${s}.cleaningBuffer`, "Table Reset & Sanitization Time")}</Label>
            <Select value={cleaningBuffer} onValueChange={setCleaningBuffer}>
              <SelectTrigger id="cleaning-buffer" className="w-full rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">Immediate (0 min)</SelectItem>
                <SelectItem value="5" className="text-xs">5 minutes</SelectItem>
                <SelectItem value="10" className="text-xs">10 minutes (Standard)</SelectItem>
                <SelectItem value="15" className="text-xs">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-1" />

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.autoAssign`, "Smart Table Auto-Assignment")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.autoAssignDesc`, "Automatically match party sizes to the best available table on the floor plan.")}
              </p>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.overbooking`, "Capacity Tolerance & Standby Buffer")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.overbookingDesc`, "Allow +5% buffer capacity for peak shift walk-ins.")}
              </p>
            </div>
            <Switch checked={allowOverbooking} onCheckedChange={setAllowOverbooking} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t pt-4">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl text-xs font-semibold">
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          <span>{t("pages.settings.saveChanges", "Save Changes")}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ==========================================
// 5. Team & Staff Management Section
// ==========================================
interface TeamMember {
  id: string
  name: string
  email: string
  role: "Owner" | "Manager" | "Host" | "Server"
  active: boolean
}

function TeamSection() {
  const { t } = useTranslation()
  const user = authClient.getUser()
  const s = "pages.settings.teamSection"

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"Manager" | "Host" | "Server">("Host")
  const [team, setTeam] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem("prosisit:team:roster")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return [
      {
        id: "owner-1",
        name: user?.name || "Restaurant Manager",
        email: user?.email || "owner@restaurant.com",
        role: "Owner",
        active: true,
      },
      {
        id: "staff-2",
        name: "Elena Rostova",
        email: "elena@restaurant.com",
        role: "Host",
        active: true,
      },
      {
        id: "staff-3",
        name: "Marcus Lind",
        email: "marcus@restaurant.com",
        role: "Server",
        active: true,
      },
    ]
  })

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error("Please enter a valid staff email address")
      return
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      active: true,
    }

    const updated = [...team, newMember]
    setTeam(updated)
    localStorage.setItem("prosisit:team:roster", JSON.stringify(updated))
    setInviteEmail("")
    toast.success(`Invitation dispatched to ${newMember.email} with ${newMember.role} access!`)
  }

  const handleRoleChange = (id: string, newRole: TeamMember["role"]) => {
    const updated = team.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    setTeam(updated)
    localStorage.setItem("prosisit:team:roster", JSON.stringify(updated))
    toast.success(`Staff role updated to ${newRole}`)
  }

  const handleRemoveMember = (id: string, name: string) => {
    const updated = team.filter((m) => m.id !== id)
    setTeam(updated)
    localStorage.setItem("prosisit:team:roster", JSON.stringify(updated))
    toast.info(`${name} removed from restaurant staff roster`)
  }

  const handleSwitchSimulatorRole = (role: "Owner" | "Manager" | "Host" | "Server") => {
    authClient.updateUser({
      role: {
        id: `role-${role.toLowerCase()}`,
        name: role,
        permissions: role === "Owner" || role === "Manager" ? ["*"] : ["dashboard:read", "reservations:manage", "customers:read"],
      },
    })
    toast.success(`Active user role switched to "${role}". Navigation permissions updated!`)
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Team & Access Permissions")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              {t(`${s}.description`, "Role Manager has full access; other assigned roles (Host, Server) can only access Dashboard, Reservations, and Customers.")}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-semibold py-1 px-2.5">
            {team.length} Team Members
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {/* Role Permissions Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-primary" />
                Manager & Owner
              </span>
              <Badge className="text-[10px] bg-primary text-primary-foreground">Full Access</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Can access the whole app: Floor Plan Designer, Analytics & Reports, System Settings, Team Access, and Billing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" />
                Host & Server
              </span>
              <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                Front-of-House
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Can <strong>only</strong> access Dashboard, Reservations Board, Customer Directory, Notifications, and Profile.
            </p>
          </div>
        </div>

        {/* Live Role Preview Switcher for Testing */}
        <div className="p-3.5 rounded-xl border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-foreground">Role Simulator (Test Permissions)</span>
            <p className="text-[11px] text-muted-foreground">
              Switch your active role to immediately preview what Host vs Manager accounts see.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {(["Owner", "Manager", "Host", "Server"] as const).map((r) => (
              <Button
                key={r}
                type="button"
                variant={(user?.role?.name || "Owner") === r ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchSimulatorRole(r)}
                className="h-7 text-xs px-2.5 rounded-lg"
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSendInvite} className="p-3.5 rounded-xl border border-border/80 bg-muted/10 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <Label htmlFor="invite-email" className="text-xs font-semibold">{t(`${s}.inviteByEmail`, "Invite New Team Member")}</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@restaurant.com"
              className="rounded-xl text-xs bg-background"
            />
          </div>
          <div className="w-full sm:w-44 flex flex-col gap-1.5">
            <Label htmlFor="invite-role" className="text-xs font-semibold">Assigned Role</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
              <SelectTrigger id="invite-role" className="rounded-xl text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manager" className="text-xs">Manager (Full Access)</SelectItem>
                <SelectItem value="Host" className="text-xs">Host (Operations Only)</SelectItem>
                <SelectItem value="Server" className="text-xs">Server (Operations Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="rounded-xl text-xs font-semibold gap-1.5 shrink-0">
            <Plus className="size-3.5" />
            <span>{t(`${s}.sendInvite`, "Send Invite")}</span>
          </Button>
        </form>

        <Separator className="my-1" />

        {/* Member List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Staff Roster
          </span>
          <div className="divide-y rounded-xl border bg-card overflow-hidden">
            {team.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 gap-3 text-xs flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">{member.name}</span>
                    <span className="text-muted-foreground text-[11px] truncate">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                  {member.role === "Owner" ? (
                    <Badge className="text-[10px] font-semibold py-0.5 bg-primary text-primary-foreground">
                      Owner
                    </Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val as TeamMember["role"])}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manager" className="text-xs">Manager</SelectItem>
                        <SelectItem value="Host" className="text-xs">Host</SelectItem>
                        <SelectItem value="Server" className="text-xs">Server</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {member.role !== "Owner" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Revoke access"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// 6. Billing & Subscription Section
// ==========================================
function BillingSection() {
  const { t } = useTranslation()
  const s = "pages.settings.billingSection"

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Subscription & Billing")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              {t(`${s}.description`, "Manage your restaurant tier, usage allowances, and tax invoice history.")}
            </CardDescription>
          </div>
          <Badge className="bg-primary text-primary-foreground text-xs py-1 px-2.5">
            Active Restaurant Pro
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {/* Tier Card */}
        <div className="p-4 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 via-card to-background flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Pro Business Plan</span>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                Auto-renews
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Includes unlimited floor plan editing, real-time live sync, SMS/email confirmation sender, and unlimited staff seats.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold shrink-0">
            {t(`${s}.upgradePlan`, "Manage Billing Portal")}
          </Button>
        </div>

        {/* Usage Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium">Monthly Reservations</span>
            <span className="text-lg font-bold text-foreground">Unlimited</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">No cover fees</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium">Floor Plan Tables</span>
            <span className="text-lg font-bold text-foreground">50 Tables</span>
            <span className="text-[10px] text-muted-foreground">Unlimited sections & floors</span>
          </div>

          <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-medium">Kiosk Standalone Screens</span>
            <span className="text-lg font-bold text-foreground">Unlimited</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Multi-iPad POS enabled</span>
          </div>
        </div>

        <Separator className="my-1" />

        {/* Invoices List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Tax Receipts
          </span>
          <div className="divide-y rounded-xl border bg-card overflow-hidden text-xs">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <span className="font-semibold">Invoice #SB-2026-08</span>
                  <p className="text-[11px] text-muted-foreground">August 1, 2026 • Visa •••• 4242</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Download className="size-3" />
                <span>PDF</span>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <span className="font-semibold">Invoice #SB-2026-07</span>
                  <p className="text-[11px] text-muted-foreground">July 1, 2026 • Visa •••• 4242</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Download className="size-3" />
                <span>PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==========================================
// 7. Security & Password Section
// ==========================================
function SecuritySection() {
  const { t } = useTranslation()
  const user = authClient.getUser()
  const s = "pages.settings.securitySection"

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactor, setTwoFactor] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsUpdating(true)
    setTimeout(() => {
      setIsUpdating(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Account password updated successfully!")
    }, 600)
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{t(`${s}.title`, "Account Security & Credentials")}</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-0.5">
          {t(`${s}.description`, "Manage your master administrator password, active sessions, and multi-factor security.")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handlePasswordChange}>
        <CardContent className="flex flex-col gap-5 pt-0">
          {/* Account Overview */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20 text-xs">
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-primary" />
              <div>
                <span className="font-semibold text-foreground">Signed in as {user?.name || "Administrator"}</span>
                <p className="text-muted-foreground text-[11px]">{user?.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
              Admin Session
            </Badge>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Key className="size-3.5" />
              Change Master Password
            </span>

            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password" className="text-xs font-semibold">{t(`${s}.currentPassword`, "Current Password")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password" className="text-xs font-semibold">{t(`${s}.newPassword`, "New Password")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password" className="text-xs font-semibold">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <Separator className="my-1" />

          {/* 2FA */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border bg-muted/20">
            <div>
              <p className="text-xs sm:text-sm font-semibold">{t(`${s}.twoFactor`, "Two-Factor Authentication (2FA)")}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">
                {t(`${s}.twoFactorDesc`, "Require an authenticator code on unrecognized staff devices.")}
              </p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
          </div>

          {/* Active Sessions */}
          <div className="p-3.5 rounded-xl border bg-card space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Authorized Devices
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <Laptop className="size-4 text-muted-foreground" />
                <div>
                  <span className="font-semibold">Current Browser Session</span>
                  <p className="text-[11px] text-muted-foreground">Active now • macOS / Chrome</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                This Device
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2 border-t pt-4">
          <Button type="submit" disabled={isUpdating || !newPassword} className="rounded-xl text-xs font-semibold">
            {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
            <span>Update Password</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ==========================================
// 8. Desktop & Mobile PWA App Section
// ==========================================
function PWASettingsSection() {
  const { isInstalled, isOnline } = usePWA()
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  const handleCheckUpdate = () => {
    setCheckingUpdate(true)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().then(() => {
            setTimeout(() => {
              setCheckingUpdate(false)
              toast.success("Seat Booking is running the latest version!")
            }, 600)
          })
        } else {
          setCheckingUpdate(false)
          toast.success("App cache is up to date.")
        }
      })
    } else {
      setCheckingUpdate(false)
    }
  }

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Smartphone className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Desktop & Mobile App (PWA)</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Install Seat Booking directly on your iPad, Android tablet, phone, Mac, or PC for a standalone kiosk and POS experience.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs pt-0">
        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">App Display Mode</span>
              <span className="text-muted-foreground text-[11px] mt-0.5">
                {isInstalled ? "Standalone App Window" : "Web Browser Window"}
              </span>
            </div>
            <Badge variant={isInstalled ? "default" : "outline"} className="text-[10px]">
              {isInstalled ? "Standalone Installed" : "In Browser"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Offline Resiliency</span>
              <span className="text-muted-foreground text-[11px] mt-0.5">
                {isOnline ? "Online & Synchronized" : "Working Offline (Cached)"}
              </span>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"} className="text-[10px]">
              {isOnline ? "Connected" : "Offline"}
            </Badge>
          </div>
        </div>

        {/* Quick Install Action if not installed */}
        {!isInstalled && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground">Install Standalone Kiosk App</span>
              <span className="text-muted-foreground text-xs mt-0.5 max-w-md">
                Removes the browser address bar, back buttons, and browser tabs for a clean POS, floor plan, and standby kiosk display.
              </span>
            </div>
            <PWAInstallButton
              variant="default"
              size="default"
              className="rounded-xl font-semibold shadow-xs shrink-0 text-xs"
            />
          </div>
        )}

        {/* Platform Instructions */}
        <div className="rounded-xl border p-4 bg-card space-y-3">
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Installation by Device
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1 p-3 rounded-xl border bg-muted/30">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary inline-block shrink-0" />
                iPad & iPhone (iOS Safari)
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tap the <strong>Share</strong> icon in Safari toolbar, scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-xl border bg-muted/30">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary inline-block shrink-0" />
                Android & Tablets (Chrome / Edge)
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tap the 3-dots menu in Chrome and choose <strong>Install App</strong> or <strong>Add to Home Screen</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-xl border bg-muted/30">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary inline-block shrink-0" />
                Mac (Safari / Chrome)
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                In Safari: Choose <strong>File → Add to Dock</strong>. In Chrome: Click the install icon in the URL address bar.
              </p>
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-xl border bg-muted/30">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary inline-block shrink-0" />
                Windows PC (Edge / Chrome)
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Click the <strong>Install</strong> icon in the right side of the URL bar to launch as a standalone desktop app.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t p-4 bg-muted/10">
        <span className="text-xs text-muted-foreground">
          Service Worker active • Version 1.0.0
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCheckUpdate}
          disabled={checkingUpdate}
          className="rounded-xl gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={cn("size-3.5", checkingUpdate && "animate-spin")} />
          <span>{checkingUpdate ? "Checking…" : "Check for Updates"}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ==========================================
// 9. Main Settings Page Component
// ==========================================
export function SettingsPage() {
  const { t } = useTranslation()
  const { profile } = useRestaurant()
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get("section") as SettingsSection | null

  const isValidSection = (s: string | null): s is SettingsSection =>
    Boolean(
      s &&
        [
          "profile",
          "reservations",
          "notifications",
          "tables",
          "screensaver",
          "app",
          "team",
          "billing",
          "security",
        ].includes(s),
    )

  const [activeSection, setActiveSection] = useState<SettingsSection>(() =>
    isValidSection(sectionParam) ? sectionParam : "profile",
  )

  useEffect(() => {
    if (isValidSection(sectionParam) && sectionParam !== activeSection) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam, activeSection])

  function handleSectionChange(sectionId: SettingsSection) {
    setActiveSection(sectionId)
    setSearchParams({ section: sectionId }, { replace: true })
  }

  const categories: NavCategory[] = [
    {
      title: "General",
      items: [
        { id: "profile", label: t("pages.settings.nav.profile", "Restaurant Profile"), icon: Store },
        { id: "reservations", label: t("pages.settings.nav.reservations", "Reservation Rules"), icon: CalendarClock },
        { id: "tables", label: t("pages.settings.nav.tables", "Floor & Tables"), icon: LayoutGrid },
      ],
    },
    {
      title: "Display & Standby",
      items: [
        { id: "screensaver", label: t("pages.settings.nav.screensaver", "Screen Saver Kiosk"), icon: Monitor },
        { id: "app", label: "Desktop & Mobile App", icon: Smartphone },
      ],
    },
    {
      title: "Operations & Admin",
      items: [
        { id: "notifications", label: t("pages.settings.nav.notifications", "Notifications"), icon: Bell },
        { id: "team", label: t("pages.settings.nav.team", "Team & Staff"), icon: Users },
        { id: "billing", label: t("pages.settings.nav.billing", "Plan & Billing"), icon: CreditCard },
        { id: "security", label: t("pages.settings.nav.security", "Security & Account"), icon: ShieldCheck },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-4 max-w-5xl lg:h-[calc(100vh-6.5rem)]">
      {/* Settings Main Heading - Pinned at top, never scrolls away */}
      <div className="shrink-0 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("pages.settings.title", "Settings & Configuration")}
          </h1>
          {profile?.name && (
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2 bg-primary/10 text-primary border-primary/20">
              {profile.name}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          {t("pages.settings.subtitle", "Manage restaurant profile, service hours, booking rules, team access, and display kiosks.")}
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] flex-1 min-h-0">
        {/* Navigation Sidebar: Pinned in view */}
        <aside className="sticky top-0 lg:static z-20 shrink-0">
          {/* Mobile Horizontal Pill Scroll - Sticky on mobile */}
          <div className="flex lg:hidden overflow-x-auto gap-1.5 py-2 -mx-4 px-4 scrollbar-none bg-background/95 backdrop-blur-md border-b border-border/70 shadow-2xs">
            {categories.flatMap((cat) => cat.items).map((item) => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSectionChange(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* Desktop Categorized Vertical Sidebar - Pinned in view */}
          <nav className="hidden lg:flex flex-col gap-3 p-2.5 rounded-2xl border border-border/80 bg-card shadow-xs max-h-[calc(100vh-12.5rem)] overflow-y-auto scrollbar-thin">
            {categories.map((cat, idx) => (
              <div key={cat.title} className="flex flex-col gap-1">
                {idx > 0 && <Separator className="my-1" />}
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {cat.title}
                </span>
                {cat.items.map((item) => {
                  const Icon = item.icon
                  const active = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Pane - Independent scrollable view */}
        <div className="min-w-0 flex-1 lg:overflow-y-auto lg:max-h-[calc(100vh-12.5rem)] pr-1.5 pb-8 scrollbar-thin">
          <div key={activeSection} className="animate-in fade-in duration-150">
            {activeSection === "profile" && <RestaurantProfileSection />}
            {activeSection === "reservations" && <ReservationSettingsSection />}
            {activeSection === "tables" && <TablesSection />}
            {activeSection === "screensaver" && <ScreenSaverSettingsSection />}
            {activeSection === "app" && <PWASettingsSection />}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "team" && <TeamSection />}
            {activeSection === "billing" && <BillingSection />}
            {activeSection === "security" && <SecuritySection />}
          </div>
        </div>
      </div>
    </div>
  )
}
