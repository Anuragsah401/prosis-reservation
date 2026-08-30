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
  ExternalLink,
  Clock,
  Smartphone,
  RefreshCw,
} from "lucide-react"

type SettingsSection =
  | "profile"
  | "reservations"
  | "notifications"
  | "tables"
  | "screensaver"
  | "app"
  | "team"
  | "billing"
  | "security"

function useSectionsList(t: (key: string) => string): { id: SettingsSection; label: string; icon: typeof Store }[] {
  return [
    { id: "profile", label: t("pages.settings.nav.profile"), icon: Store },
    { id: "reservations", label: t("pages.settings.nav.reservations"), icon: CalendarClock },
    { id: "notifications", label: t("pages.settings.nav.notifications"), icon: Bell },
    { id: "tables", label: t("pages.settings.nav.tables"), icon: LayoutGrid },
    { id: "screensaver", label: t("pages.settings.nav.screensaver"), icon: Monitor },
    { id: "app", label: t("pages.settings.nav.app") || "Desktop & Mobile App (PWA)", icon: Smartphone },
    { id: "team", label: t("pages.settings.nav.team"), icon: Users },
    { id: "billing", label: t("pages.settings.nav.billing"), icon: CreditCard },
    { id: "security", label: t("pages.settings.nav.security"), icon: ShieldCheck },
  ]
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
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.settings.profile.title")}</CardTitle>
        <CardDescription>{t("pages.settings.profile.description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="flex flex-col gap-5">
          {profile && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{t("pages.settings.profile.bookingPage")}:</span>
                <span className="text-muted-foreground font-mono">/restaurant/{profile.id}/book</span>
              </div>
              <a
                href={`/restaurant/${profile.id}/book`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>{t("pages.settings.profile.viewBookingPage")}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}

          <LogoUpload
            value={logoUrl}
            onChange={setLogoUrl}
            label={t("pages.settings.profile.logo", "Restaurant Logo")}
            description={t("pages.settings.profile.logoDesc", "Displayed on your booking page, dashboard header, and confirmation receipts.")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-name">{t("pages.settings.profile.name")}</Label>
              <Input
                id="restaurant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Seat Booking"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-slug">{t("pages.settings.profile.slug")}</Label>
              <Input
                id="restaurant-slug"
                value={profile?.slug ?? ""}
                disabled
                className="bg-muted/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-email">{t("pages.settings.profile.email")}</Label>
              <Input
                id="restaurant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@restaurant.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="restaurant-phone">{t("pages.settings.profile.phone")}</Label>
              <Input
                id="restaurant-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="restaurant-address">{t("pages.settings.profile.address")}</Label>
            <Input
              id="restaurant-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Springfield"
            />
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              <span>{t("pages.settings.profile.openingHours")}</span>
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="opening-time">{t("pages.settings.profile.openingTime")}</Label>
                <Input
                  id="opening-time"
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  step={900}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="closing-time">{t("pages.settings.profile.closingTime")}</Label>
                <Input
                  id="closing-time"
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  step={900}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">{t("pages.settings.profile.timezone")}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language">{t("settings.language.label")}</Label>
              <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t("settings.language.description")}</p>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetToCurrent} disabled={isSaving}>
            {t("pages.settings.cancel")}
          </Button>
          <Button type="submit" disabled={isSaving || !profile}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {t("pages.settings.saveChanges")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function ReservationSettingsSection() {
  const { t } = useTranslation()
  const [onlineBooking, setOnlineBooking] = useState(true)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [waitlist, setWaitlist] = useState(true)
  const [allowSameDay, setAllowSameDay] = useState(true)
  const s = "pages.settings.reservationsSection"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>
          {t(`${s}.description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="default-duration">{t(`${s}.defaultDuration`)}</Label>
            <Select defaultValue="90">
              <SelectTrigger id="default-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 {t(`${s}.minutes`)}</SelectItem>
                <SelectItem value="45">45 {t(`${s}.minutes`)}</SelectItem>
                <SelectItem value="60">1 {t(`${s}.hour`)}</SelectItem>
                <SelectItem value="90">1.5 {t(`${s}.hours`)}</SelectItem>
                <SelectItem value="120">2 {t(`${s}.hours`)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="buffer-time">{t(`${s}.bufferTime`)}</Label>
            <Select defaultValue="15">
              <SelectTrigger id="buffer-time" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t(`${s}.noBuffer`)}</SelectItem>
                <SelectItem value="10">10 {t(`${s}.minutes`)}</SelectItem>
                <SelectItem value="15">15 {t(`${s}.minutes`)}</SelectItem>
                <SelectItem value="30">30 {t(`${s}.minutes`)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="max-party">{t(`${s}.maxParty`)}</Label>
            <Input id="max-party" type="number" min={1} defaultValue={12} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="advance-notice">{t(`${s}.advanceNotice`)}</Label>
            <Select defaultValue="60">
              <SelectTrigger id="advance-notice" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t(`${s}.none`)}</SelectItem>
                <SelectItem value="30">30 {t(`${s}.minutes`)}</SelectItem>
                <SelectItem value="60">1 {t(`${s}.hour`)}</SelectItem>
                <SelectItem value="120">2 {t(`${s}.hours`)}</SelectItem>
                <SelectItem value="1440">1 {t(`${s}.day`)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-window">{t(`${s}.bookingWindow`)}</Label>
            <Select defaultValue="60">
              <SelectTrigger id="booking-window" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 {t(`${s}.days`)}</SelectItem>
                <SelectItem value="60">60 {t(`${s}.days`)}</SelectItem>
                <SelectItem value="90">90 {t(`${s}.days`)}</SelectItem>
                <SelectItem value="365">1 {t(`${s}.year`)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancellation-window">{t(`${s}.cancellationWindow`)}</Label>
            <Select defaultValue="120">
              <SelectTrigger id="cancellation-window" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t(`${s}.noCancellations`)}</SelectItem>
                <SelectItem value="60">1 {t(`${s}.hour`)} {t(`${s}.beforeSuffix`)}</SelectItem>
                <SelectItem value="120">2 {t(`${s}.hours`)} {t(`${s}.beforeSuffix`)}</SelectItem>
                <SelectItem value="1440">1 {t(`${s}.day`)} {t(`${s}.beforeSuffix`)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.onlineBooking`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.onlineBookingDesc`)}
              </p>
            </div>
            <Switch checked={onlineBooking} onCheckedChange={setOnlineBooking} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.autoConfirm`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.autoConfirmDesc`)}
              </p>
            </div>
            <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.waitlist`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.waitlistDesc`)}
              </p>
            </div>
            <Switch checked={waitlist} onCheckedChange={setWaitlist} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.sameDay`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.sameDayDesc`)}
              </p>
            </div>
            <Switch checked={allowSameDay} onCheckedChange={setAllowSameDay} />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-policy">{t(`${s}.policyLabel`)}</Label>
          <Textarea
            id="booking-policy"
            rows={4}
            placeholder={t(`${s}.policyPlaceholder`)}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
    </Card>
  )
}

function NotificationsSection() {
  const { t } = useTranslation()
  const [emailConfirmations, setEmailConfirmations] = useState(true)
  const [smsReminders, setSmsReminders] = useState(false)
  const [staffAlerts, setStaffAlerts] = useState(true)
  const s = "pages.settings.notificationsSection"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>{t(`${s}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.emailConfirmations`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.emailConfirmationsDesc`)}
              </p>
            </div>
            <Switch checked={emailConfirmations} onCheckedChange={setEmailConfirmations} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.smsReminders`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.smsRemindersDesc`)}
              </p>
            </div>
            <Switch checked={smsReminders} onCheckedChange={setSmsReminders} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.staffAlerts`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.staffAlertsDesc`)}
              </p>
            </div>
            <Switch checked={staffAlerts} onCheckedChange={setStaffAlerts} />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-lead-time">{t(`${s}.reminderLeadTime`)}</Label>
          <Select defaultValue="120">
            <SelectTrigger id="reminder-lead-time" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 {t("pages.settings.reservationsSection.hour")} {t("pages.settings.reservationsSection.beforeSuffix")}</SelectItem>
              <SelectItem value="120">2 {t("pages.settings.reservationsSection.hours")} {t("pages.settings.reservationsSection.beforeSuffix")}</SelectItem>
              <SelectItem value="1440">1 {t("pages.settings.reservationsSection.day")} {t("pages.settings.reservationsSection.beforeSuffix")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
    </Card>
  )
}

function TablesSection() {
  const { t } = useTranslation()
  const [autoAssign, setAutoAssign] = useState(true)
  const [allowOverbooking, setAllowOverbooking] = useState(false)
  const s = "pages.settings.tablesSection"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>{t(`${s}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="table-turnover">{t(`${s}.turnover`)}</Label>
            <Select defaultValue="90">
              <SelectTrigger id="table-turnover" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 {t("pages.settings.reservationsSection.minutes")}</SelectItem>
                <SelectItem value="60">1 {t("pages.settings.reservationsSection.hour")}</SelectItem>
                <SelectItem value="90">1.5 {t("pages.settings.reservationsSection.hours")}</SelectItem>
                <SelectItem value="120">2 {t("pages.settings.reservationsSection.hours")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cleaning-buffer">{t(`${s}.cleaningBuffer`)}</Label>
            <Select defaultValue="10">
              <SelectTrigger id="cleaning-buffer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("pages.settings.reservationsSection.none")}</SelectItem>
                <SelectItem value="10">10 {t("pages.settings.reservationsSection.minutes")}</SelectItem>
                <SelectItem value="15">15 {t("pages.settings.reservationsSection.minutes")}</SelectItem>
                <SelectItem value="20">20 {t("pages.settings.reservationsSection.minutes")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.autoAssign`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.autoAssignDesc`)}
              </p>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t(`${s}.overbooking`)}</p>
              <p className="text-muted-foreground text-sm">
                {t(`${s}.overbookingDesc`)}
              </p>
            </div>
            <Switch checked={allowOverbooking} onCheckedChange={setAllowOverbooking} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
    </Card>
  )
}

function TeamSection() {
  const { t } = useTranslation()
  const s = "pages.settings.teamSection"
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>{t(`${s}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">{t(`${s}.inviteByEmail`)}</Label>
            <Input id="invite-email" type="email" placeholder="teammate@restaurant.com" />
          </div>
          <div className="flex flex-col gap-2 sm:justify-end">
            <Label className="sm:invisible">{t(`${s}.invite`)}</Label>
            <Button>{t(`${s}.sendInvite`)}</Button>
          </div>
        </div>
        <Separator />
        <p className="text-muted-foreground text-sm">
          {t(`${s}.empty`)}
        </p>
      </CardContent>
    </Card>
  )
}

function BillingSection() {
  const { t } = useTranslation()
  const s = "pages.settings.billingSection"
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>{t(`${s}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">{t(`${s}.currentPlan`)}</p>
            <p className="text-muted-foreground text-sm">{t(`${s}.freeTrial`)}</p>
          </div>
          <Button variant="outline">{t(`${s}.upgradePlan`)}</Button>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-email">{t(`${s}.billingEmail`)}</Label>
          <Input id="billing-email" type="email" placeholder="billing@restaurant.com" />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
    </Card>
  )
}

function SecuritySection() {
  const { t } = useTranslation()
  const [twoFactor, setTwoFactor] = useState(false)
  const s = "pages.settings.securitySection"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`${s}.title`)}</CardTitle>
        <CardDescription>{t(`${s}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">{t(`${s}.currentPassword`)}</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">{t(`${s}.newPassword`)}</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t(`${s}.twoFactor`)}</p>
            <p className="text-muted-foreground text-sm">
              {t(`${s}.twoFactorDesc`)}
            </p>
          </div>
          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
    </Card>
  )
}

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
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Desktop & Mobile App (PWA)</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Install Seat Booking directly on your iPad, Android tablet, phone, Mac, or PC for a standalone kiosk and POS experience.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/20">
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

            <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/20">
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
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-foreground">Install Standalone App</span>
                <span className="text-muted-foreground text-xs mt-0.5 max-w-md">
                  Removes the browser address bar, back buttons, and browser tabs for a clean POS, floor plan, and standby kiosk display.
                </span>
              </div>
              <PWAInstallButton
                variant="default"
                size="default"
                className="rounded-xl font-semibold shadow-xs shrink-0"
              />
            </div>
          )}

          {/* Platform Instructions */}
          <div className="rounded-2xl border p-4 bg-card space-y-3">
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
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get("section") as SettingsSection | null
  const isValidSection = (s: string | null): s is SettingsSection =>
    Boolean(s && ["profile", "reservations", "notifications", "tables", "screensaver", "app", "team", "billing", "security"].includes(s))

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

  const sectionsList = useSectionsList(t)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pages.settings.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.settings.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sectionsList.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="max-w-2xl">
          {activeSection === "profile" && <RestaurantProfileSection />}
          {activeSection === "reservations" && <ReservationSettingsSection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "tables" && <TablesSection />}
          {activeSection === "screensaver" && <ScreenSaverSettingsSection />}
          {activeSection === "app" && <PWASettingsSection />}
          {activeSection === "team" && <TeamSection />}
          {activeSection === "billing" && <BillingSection />}
          {activeSection === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}
