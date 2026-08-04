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

const sections: { id: SettingsSection; label: string; icon: typeof Store }[] = [
  { id: "profile", label: "Restaurant Profile", icon: Store },
  { id: "reservations", label: "Reservation Settings", icon: CalendarClock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "tables", label: "Tables & Floor Plan", icon: LayoutGrid },
  { id: "team", label: "Team & Access", icon: Users },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
]

function RestaurantProfileSection() {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurant Profile</CardTitle>
        <CardDescription>Basic information about your restaurant.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Restaurant name</Label>
            <Input id="name" placeholder="Prosisit Table" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="prosisit-table" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="hello@restaurant.com" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" placeholder="+1 555 0100" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="123 Main St, Springfield" />
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
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
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

function ReservationSettingsSection() {
  const [onlineBooking, setOnlineBooking] = useState(true)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [waitlist, setWaitlist] = useState(true)
  const [allowSameDay, setAllowSameDay] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservation Settings</CardTitle>
        <CardDescription>
          Control how bookings are made, confirmed, and managed across your restaurant.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="default-duration">Default reservation duration</Label>
            <Select defaultValue="90">
              <SelectTrigger id="default-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="buffer-time">Buffer time between reservations</Label>
            <Select defaultValue="15">
              <SelectTrigger id="buffer-time" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No buffer</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="max-party">Maximum party size</Label>
            <Input id="max-party" type="number" min={1} defaultValue={12} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="advance-notice">Minimum advance notice</Label>
            <Select defaultValue="60">
              <SelectTrigger id="advance-notice" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="1440">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-window">Booking window (how far ahead guests can book)</Label>
            <Select defaultValue="60">
              <SelectTrigger id="booking-window" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cancellation-window">Free cancellation window</Label>
            <Select defaultValue="120">
              <SelectTrigger id="cancellation-window" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No cancellations allowed</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="120">2 hours before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Accept online bookings</p>
              <p className="text-muted-foreground text-sm">
                Allow guests to reserve a table from your public booking page.
              </p>
            </div>
            <Switch checked={onlineBooking} onCheckedChange={setOnlineBooking} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Auto-confirm reservations</p>
              <p className="text-muted-foreground text-sm">
                Automatically confirm new bookings instead of leaving them pending.
              </p>
            </div>
            <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Enable waitlist</p>
              <p className="text-muted-foreground text-sm">
                Let guests join a waitlist when their preferred time is fully booked.
              </p>
            </div>
            <Switch checked={waitlist} onCheckedChange={setWaitlist} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Allow same-day bookings</p>
              <p className="text-muted-foreground text-sm">
                Let guests book a table for later today, subject to advance notice above.
              </p>
            </div>
            <Switch checked={allowSameDay} onCheckedChange={setAllowSameDay} />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-policy">Booking policy (shown to guests)</Label>
          <Textarea
            id="booking-policy"
            rows={4}
            placeholder="e.g. Reservations are held for 15 minutes past the booking time. Parties of 6+ require a credit card to hold the table."
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

function NotificationsSection() {
  const [emailConfirmations, setEmailConfirmations] = useState(true)
  const [smsReminders, setSmsReminders] = useState(false)
  const [staffAlerts, setStaffAlerts] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose how you and your guests are notified about bookings.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email confirmations to guests</p>
              <p className="text-muted-foreground text-sm">
                Send a confirmation email whenever a reservation is made or changed.
              </p>
            </div>
            <Switch checked={emailConfirmations} onCheckedChange={setEmailConfirmations} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">SMS reminders to guests</p>
              <p className="text-muted-foreground text-sm">
                Text guests a reminder before their reservation time.
              </p>
            </div>
            <Switch checked={smsReminders} onCheckedChange={setSmsReminders} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">New booking alerts for staff</p>
              <p className="text-muted-foreground text-sm">
                Notify the front-desk team when a new reservation comes in.
              </p>
            </div>
            <Switch checked={staffAlerts} onCheckedChange={setStaffAlerts} />
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-lead-time">Guest reminder lead time</Label>
          <Select defaultValue="120">
            <SelectTrigger id="reminder-lead-time" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 hour before</SelectItem>
              <SelectItem value="120">2 hours before</SelectItem>
              <SelectItem value="1440">1 day before</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

function TablesSection() {
  const [autoAssign, setAutoAssign] = useState(true)
  const [allowOverbooking, setAllowOverbooking] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tables & Floor Plan</CardTitle>
        <CardDescription>Defaults used when seating and assigning guests to tables.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="table-turnover">Default table turnover time</Label>
            <Select defaultValue="90">
              <SelectTrigger id="table-turnover" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cleaning-buffer">Cleaning buffer after each seating</Label>
            <Select defaultValue="10">
              <SelectTrigger id="cleaning-buffer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Auto-assign best available table</p>
              <p className="text-muted-foreground text-sm">
                Automatically pick a table based on party size and availability.
              </p>
            </div>
            <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Allow overbooking tables</p>
              <p className="text-muted-foreground text-sm">
                Permit staff to double-book a table when the floor is full (not recommended).
              </p>
            </div>
            <Switch checked={allowOverbooking} onCheckedChange={setAllowOverbooking} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

function TeamSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team & Access</CardTitle>
        <CardDescription>Invite staff and manage what they can see and do.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Invite by email</Label>
            <Input id="invite-email" type="email" placeholder="teammate@restaurant.com" />
          </div>
          <div className="flex flex-col gap-2 sm:justify-end">
            <Label className="sm:invisible">Invite</Label>
            <Button>Send invite</Button>
          </div>
        </div>
        <Separator />
        <p className="text-muted-foreground text-sm">
          No team members invited yet. Invited staff will appear here with their role and access level.
        </p>
      </CardContent>
    </Card>
  )
}

function BillingSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Plan</CardTitle>
        <CardDescription>Manage your subscription and payment details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Current plan</p>
            <p className="text-muted-foreground text-sm">Free trial</p>
          </div>
          <Button variant="outline">Upgrade plan</Button>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label htmlFor="billing-email">Billing email</Label>
          <Input id="billing-email" type="email" placeholder="billing@restaurant.com" />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

function SecuritySection() {
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Protect your account and restaurant data.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" placeholder="••••••••" />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Two-factor authentication</p>
            <p className="text-muted-foreground text-sm">
              Require a verification code in addition to your password.
            </p>
          </div>
          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  )
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your restaurant profile, reservation rules, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {sections.map((section) => {
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
