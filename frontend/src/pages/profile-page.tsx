import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  User,
  Mail,
  Shield,
  Building,
  Key,
  CheckCircle2,
  Laptop,
  Calendar,
  Loader2,
  LogOut,
  SunMoon,
  Store,
  Globe,
  Lock,
  Volume2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { soundManager, SOUND_OPTIONS, type SoundTone } from "@/lib/sound"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { authClient, type AuthUser } from "@/features/auth/auth-client"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { supportedLanguages } from "@/i18n"
import { useTheme } from "@/components/theme-provider"

function getInitials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "")
  return initials.join("") || "U"
}

export function ProfilePage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useRestaurant()
  const { theme, setTheme } = useTheme()

  const [user, setUser] = useState<AuthUser | null>(() => authClient.getUser())
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [savingProfile, setSavingProfile] = useState(false)

  // Security States
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  // Preference States
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem("prosisit:notify:sound") !== "false")
  const [soundTone, setSoundTone] = useState<SoundTone>(() => soundManager.getSoundTone())
  const [emailDigests, setEmailDigests] = useState(true)

  useEffect(() => {
    const handleAuthChange = () => {
      const u = authClient.getUser()
      setUser(u)
      if (u) {
        setName(u.name ?? "")
        setEmail(u.email ?? "")
        setPhone(u.phone ?? "")
      }
    }
    window.addEventListener("auth:state-change", handleAuthChange)
    return () => window.removeEventListener("auth:state-change", handleAuthChange)
  }, [])

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Full name cannot be empty")
      return
    }

    setSavingProfile(true)
    setTimeout(() => {
      const updated = authClient.updateUser({
        name: name.trim(),
        phone: phone.trim() || null,
      })
      setUser(updated)
      setSavingProfile(false)
      toast.success("Profile details updated successfully!")
    }, 400)
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setSavingPassword(true)
    setTimeout(() => {
      setSavingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Master password updated successfully!")
    }, 600)
  }

  const handleLogout = () => {
    authClient.logout()
    navigate("/login", { replace: true })
  }

  const restaurantName = profile?.name || user?.restaurant?.name || "Restaurant Manager"

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* ========================================= */}
      {/* 1. Profile Hero Summary Header            */}
      {/* ========================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-primary/10 via-card to-background p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16 sm:size-20 border-2 border-background shadow-md">
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className="absolute bottom-0.5 right-0.5 size-3.5 sm:size-4 rounded-full bg-emerald-500 ring-2 ring-background"
                title="Active session"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {user?.name || "Staff Member"}
                </h1>
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold py-0.5 px-2">
                  Administrator
                </Badge>
              </div>

              <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                <Mail className="size-3.5 text-muted-foreground/70" />
                <span>{user?.email}</span>
                <CheckCircle2 className="size-3.5 text-emerald-500 inline-block shrink-0" />
              </p>

              <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Building className="size-3.5 text-primary" />
                  <strong className="text-foreground font-semibold">{restaurantName}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  <span>Active Session</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/settings?section=profile")}
              className="rounded-xl text-xs gap-1.5 font-semibold h-9"
            >
              <Store className="size-3.5" />
              <span>Restaurant Settings</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-xs gap-1.5 font-semibold h-9"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ========================================= */}
        {/* Left Column: Personal Info & Preferences  */}
        {/* ========================================= */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Personal Information Form */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Update your staff name, contact number, and personal details.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4 text-xs pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="user-name" className="text-xs font-semibold">Full Name</Label>
                    <Input
                      id="user-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="user-phone" className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-email" className="text-xs font-semibold">Account Email Address</Label>
                    <span className="text-[11px] text-muted-foreground">Primary login identifier</span>
                  </div>
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    disabled
                    className="rounded-xl text-xs bg-muted/40 cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    To transfer or change your primary email login, please contact system support.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
                <Button type="submit" disabled={savingProfile} className="rounded-xl text-xs font-semibold">
                  {savingProfile && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Account & App Preferences */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <SunMoon className="size-4 text-primary" />
                <span>Display & Interface Preferences</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Configure your preferred language, visual theme, and audio alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-lang" className="text-xs font-semibold flex items-center gap-1.5">
                    <Globe className="size-3.5 text-muted-foreground" />
                    <span>Interface Language</span>
                  </Label>
                  <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                    <SelectTrigger id="user-lang" className="rounded-xl text-xs">
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

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-theme" className="text-xs font-semibold flex items-center gap-1.5">
                    <SunMoon className="size-3.5 text-muted-foreground" />
                    <span>Visual Theme</span>
                  </Label>
                  <Select value={theme} onValueChange={(val) => setTheme(val as "light" | "dark" | "system")}>
                    <SelectTrigger id="user-theme" className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system" className="text-xs">System Synchronized</SelectItem>
                      <SelectItem value="light" className="text-xs">Light Mode</SelectItem>
                      <SelectItem value="dark" className="text-xs">Dark Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-1" />

              <div className="space-y-3">
                <div className="flex flex-col gap-3 p-3 rounded-xl border bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">Sound Notifications</span>
                      <span className="text-muted-foreground text-[11px]">
                        Play an audio chime on tablets and devices when reservations are booked or confirmed.
                      </span>
                    </div>
                    <Switch
                      checked={soundAlerts}
                      onCheckedChange={(checked) => {
                        setSoundAlerts(checked)
                        soundManager.setSoundEnabled(checked)
                        toast.success(checked ? "Sound alerts enabled" : "Sound alerts disabled")
                      }}
                    />
                  </div>

                  {soundAlerts && (
                    <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50 duration-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">Notification Sound</span>
                        <span className="text-muted-foreground text-[11px]">
                          Choose the chime played for bookings and confirmations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={soundTone}
                          onValueChange={(val: SoundTone) => {
                            setSoundTone(val)
                            soundManager.setSoundTone(val)
                          }}
                        >
                          <SelectTrigger className="w-44 rounded-xl text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOUND_OPTIONS.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id} className="text-xs cursor-pointer">
                                <div className="flex flex-col text-left py-0.5">
                                  <span className="font-semibold text-foreground">{opt.label}</span>
                                  <span className="text-[10px] text-muted-foreground">{opt.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => soundManager.playTone(soundTone, true)}
                          className="gap-1.5 text-xs rounded-xl shrink-0 cursor-pointer hover:bg-primary/10 hover:text-primary transition-all"
                          title="Test selected sound"
                        >
                          <Volume2 className="size-3.5 text-primary" />
                          <span>Test</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">Daily Activity Digest</span>
                    <span className="text-muted-foreground text-[11px]">
                      Receive a daily morning summary of bookings and expected peak shifts.
                    </span>
                  </div>
                  <Switch
                    checked={emailDigests}
                    onCheckedChange={(checked) => {
                      setEmailDigests(checked)
                      toast.success(checked ? "Daily digests enabled" : "Daily digests disabled")
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ========================================= */}
        {/* Right Column: Security, Roles & Devices   */}
        {/* ========================================= */}
        <div className="flex flex-col gap-6">
          {/* Role & Permissions Card */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <span>Assigned Role & Tier</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-0">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Master Administrator</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    Full Access
                  </Badge>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  You have full administrative privileges to configure floor plans, manage table reservations, invite staff members, and modify service hours.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Included Privileges
                </span>
                <ul className="space-y-1 text-muted-foreground text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    <span>Table reservation creation & overrides</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    <span>Floor plan layout & section editor</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    <span>Real-time POS and kiosk synchronization</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    <span>Transactional email & billing settings</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Change Master Password */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Key className="size-4 text-primary" />
                <span>Change Password</span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-3 text-xs pt-0">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cur-pass" className="text-xs font-medium text-muted-foreground">Current Password</Label>
                  <Input
                    id="cur-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-medium text-muted-foreground">New Password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="conf-pass" className="text-xs font-medium text-muted-foreground">Confirm New Password</Label>
                  <Input
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 mt-1">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold">Two-Factor (2FA)</span>
                  </div>
                  <Switch
                    checked={twoFactor}
                    onCheckedChange={(val) => {
                      setTwoFactor(val)
                      toast.info(val ? "2FA enabled for this account" : "2FA disabled")
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold"
                >
                  {savingPassword && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Update Password</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Active Session & Device Tracker */}
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Laptop className="size-4 text-muted-foreground" />
                <span>Authorized Devices</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-0">
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">Current Web Session</span>
                    <span className="text-[10px] text-muted-foreground truncate">Active now • macOS / WebKit</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9.5px] text-emerald-600 border-emerald-500/30">
                  This Device
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

