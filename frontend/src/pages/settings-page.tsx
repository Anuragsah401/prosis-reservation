import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import {
  Store,
  CalendarClock,
  Bell,
  LayoutGrid,
  Users,
  CreditCard,
  ShieldCheck,
} from "lucide-react"

type SettingsSection =
  | "profile"
  | "reservations"
  | "notifications"
  | "tables"
  | "team"
  | "billing"
  | "security"

function useSectionsList(t: (key: string) => string): { id: SettingsSection; label: string; icon: typeof Store }[] {
  return [
    { id: "profile", label: t("pages.settings.nav.profile"), icon: Store },
    { id: "reservations", label: t("pages.settings.nav.reservations"), icon: CalendarClock },
    { id: "notifications", label: t("pages.settings.nav.notifications"), icon: Bell },
    { id: "tables", label: t("pages.settings.nav.tables"), icon: LayoutGrid },
    { id: "team", label: t("pages.settings.nav.team"), icon: Users },
    { id: "billing", label: t("pages.settings.nav.billing"), icon: CreditCard },
    { id: "security", label: t("pages.settings.nav.security"), icon: ShieldCheck },
  ]
}

function RestaurantProfileSection() {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.settings.profile.title")}</CardTitle>
        <CardDescription>{t("pages.settings.profile.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("pages.settings.profile.name")}</Label>
            <Input id="name" placeholder="Prosisit Table" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">{t("pages.settings.profile.slug")}</Label>
            <Input id="slug" placeholder="prosisit-table" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("pages.settings.profile.email")}</Label>
            <Input id="email" type="email" placeholder="hello@restaurant.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">{t("pages.settings.profile.phone")}</Label>
            <Input id="phone" type="tel" placeholder="+1 555 0100" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">{t("pages.settings.profile.address")}</Label>
          <Input id="address" placeholder="123 Main St, Springfield" />
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">{t("pages.settings.profile.timezone")}</Label>
            <Input id="timezone" placeholder="UTC" />
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
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">{t("pages.settings.cancel")}</Button>
        <Button>{t("pages.settings.saveChanges")}</Button>
      </CardFooter>
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

export function SettingsPage() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")
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
                onClick={() => setActiveSection(section.id)}
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
          {activeSection === "team" && <TeamSection />}
          {activeSection === "billing" && <BillingSection />}
          {activeSection === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}
