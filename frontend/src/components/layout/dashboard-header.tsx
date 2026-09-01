import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Menu,
  Store,
  User,
  Search,
  Calendar,
  LayoutGrid,
  Users,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Monitor,
  Smartphone,
  LogOut,
  Sparkles,
  Command,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { NotificationBell } from "@/features/notifications/notification-bell"
import { PWAInstallButton } from "@/components/pwa-install-dialog"
import { authClient, isManagerRole, getRoleDisplayName, type AuthUser } from "@/features/auth/auth-client"
import { useRestaurant } from "@/features/restaurant/restaurant-context"
import { cn } from "@/lib/utils"

function getInitials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "")
  return initials.join("") || "U"
}

interface CommandItem {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: string
  managerOnly?: boolean
}

export function DashboardHeader() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<AuthUser | null>(() => authClient.getUser())
  const navigate = useNavigate()
  const { profile } = useRestaurant()

  const restaurantDisplayName = profile?.name || user?.restaurant?.name || t("common.appName", "Seat Booking")
  const isManager = isManagerRole(user)
  const roleName = getRoleDisplayName(user)

  // React to auth state changes so name/avatar update across the header
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authClient.getUser())
    }
    window.addEventListener("auth:state-change", handleAuthChange)
    return () => window.removeEventListener("auth:state-change", handleAuthChange)
  }, [])

  // Global Keyboard Shortcut for Command / Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleLogout() {
    authClient.logout()
    navigate("/login", { replace: true })
  }

  const commandItems: CommandItem[] = [
    {
      id: "my-profile",
      title: "My User Profile",
      subtitle: "Personal account, credentials & language",
      icon: User,
      path: "/profile",
      badge: "Account",
    },
    {
      id: "res-list",
      title: "Reservations Board",
      subtitle: "View and manage today's bookings",
      icon: Calendar,
      path: "/reservations",
    },
    {
      id: "floor-plan",
      title: "Floor Plan & Tables",
      subtitle: "Interactive 2D restaurant table layout",
      icon: LayoutGrid,
      path: "/floor-plan",
      managerOnly: true,
    },
    {
      id: "customers",
      title: "Customer Directory",
      subtitle: "Guest history, contact info and notes",
      icon: Users,
      path: "/customers",
    },
    {
      id: "analytics",
      title: "Analytics & Traffic",
      subtitle: "Covers, revenue, and weekly occupancy",
      icon: BarChart3,
      path: "/analytics",
      managerOnly: true,
    },
    {
      id: "notifications",
      title: "Activity Notifications",
      subtitle: "Live alerts and reservation updates",
      icon: Bell,
      path: "/notifications",
    },
    {
      id: "settings-profile",
      title: "Restaurant Profile",
      subtitle: "Branding, opening hours, address",
      icon: Store,
      path: "/settings?section=profile",
      managerOnly: true,
    },
    {
      id: "settings-rules",
      title: "Reservation Policies",
      subtitle: "Turnover buffers, duration, auto-confirm",
      icon: Settings,
      path: "/settings?section=reservations",
      managerOnly: true,
    },
    {
      id: "screensaver",
      title: "Screen Saver Standby",
      subtitle: "Kiosk promotional display & QR code",
      icon: Monitor,
      path: "/settings?section=screensaver",
      managerOnly: true,
    },
    {
      id: "app",
      title: "Desktop & Mobile App",
      subtitle: "Standalone PWA POS installation",
      icon: Smartphone,
      path: "/settings?section=app",
      managerOnly: true,
    },
    {
      id: "security",
      title: "Security & Passwords",
      subtitle: "Admin credentials and sessions",
      icon: Shield,
      path: "/settings?section=security",
      managerOnly: true,
    },
  ]

  const filteredCommands = commandItems
    .filter((item) => !item.managerOnly || isManager)
    .filter(
      (item) =>
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  const handleSelectCommand = (path: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    navigate(path)
  }

  return (
    <>
      <header className="bg-background/85 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center justify-between gap-2.5 border-b border-border/70 px-3 sm:px-4 backdrop-blur-md shadow-2xs">
        {/* ========================================= */}
        {/* Left: Mobile Toggle & Restaurant Identity */}
        {/* ========================================= */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile Sheet Nav Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden size-8.5 rounded-xl shrink-0">
                <Menu className="size-4.5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-68 p-0 flex flex-col">
              <SheetHeader className="border-b border-border/60 px-4 py-3.5">
                <SheetTitle className="flex items-center gap-2.5 text-sm font-bold">
                  {profile?.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={restaurantDisplayName}
                      className="size-7 shrink-0 rounded-lg border object-contain bg-background"
                    />
                  ) : (
                    <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20">
                      <Store className="size-3.5" />
                    </div>
                  )}
                  <span className="truncate">{restaurantDisplayName}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="py-2 flex flex-col justify-between flex-1 overflow-y-auto">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
                <div className="p-3 border-t border-border/60 mt-auto">
                  <PWAInstallButton
                    variant="default"
                    size="sm"
                    className="w-full rounded-xl text-xs gap-1.5 font-semibold"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Restaurant Brand Chip */}
          <div
            onClick={() => isManager && navigate("/settings?section=profile")}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-xl p-1 sm:px-2 sm:py-1 transition-colors group shrink-0",
              isManager ? "hover:bg-muted/60 cursor-pointer" : "cursor-default",
            )}
            title={isManager ? "Go to Restaurant Profile Settings" : restaurantDisplayName}
          >
            {profile?.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={restaurantDisplayName}
                className="size-7 sm:size-8 shrink-0 rounded-lg border border-border/80 object-contain bg-background shadow-2xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="bg-primary/10 text-primary flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 group-hover:scale-105 transition-transform">
                <Store className="size-3.5 sm:size-4" />
              </div>
            )}
            <div className="hidden sm:flex flex-col min-w-0 text-left">
              <span className="truncate text-xs sm:text-sm font-bold tracking-tight text-foreground leading-tight">
                {restaurantDisplayName}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                <span>Restaurant Dashboard</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* Center: Global Command Search Trigger     */}
        {/* ========================================= */}
        <div className="flex-1 max-w-xs md:max-w-sm mx-2 hidden sm:block">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full h-8.5 px-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-between text-xs transition-colors cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-muted-foreground/70 group-hover:text-primary transition-colors shrink-0" />
              <span className="truncate">Search features, rules, actions…</span>
            </div>
            <kbd className="hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[9.5px] font-semibold text-muted-foreground">
              <Command className="size-2.5" />K
            </kbd>
          </button>
        </div>

        {/* ========================================= */}
        {/* Right: Actions, Utilities & Profile       */}
        {/* ========================================= */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Search Icon Trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden size-8.5 rounded-xl text-muted-foreground"
          >
            <Search className="size-4" />
          </Button>

          {/* Standalone PWA App CTA */}
          <PWAInstallButton
            variant="outline"
            size="sm"
            className="hidden md:flex h-8.5 rounded-xl text-xs gap-1.5 font-semibold bg-background hover:bg-muted"
          />

          {/* Utilities: Language Switcher, Theme Toggle, Notification Bell */}
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />

          {/* User Profile & Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8.5 rounded-full p-0 relative hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                <Avatar className="size-8 border border-border/80">
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl shadow-lg p-1.5">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold leading-none text-foreground">{user?.name ?? t("dashboardHeader.myAccount", "Staff Account")}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9.5px] px-1.5 py-0",
                        isManager
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      )}
                    >
                      {roleName}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate text-[11px] leading-none">{user?.email}</p>
                  {restaurantDisplayName && (
                    <p className="text-muted-foreground/80 truncate text-[10px] pt-0.5">{restaurantDisplayName}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg text-xs gap-2 cursor-pointer font-medium">
                <User className="size-3.5 text-primary" />
                <span>My Profile & Account</span>
              </DropdownMenuItem>

              {/* Manager & Owner Only Menu Items */}
              {isManager && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/settings?section=profile")} className="rounded-lg text-xs gap-2 cursor-pointer">
                    <Store className="size-3.5 text-muted-foreground" />
                    <span>{t("dashboardHeader.profile", "Restaurant Profile")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-lg text-xs gap-2 cursor-pointer">
                    <Settings className="size-3.5 text-muted-foreground" />
                    <span>{t("dashboardHeader.settings", "System Settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/floor-plan")} className="rounded-lg text-xs gap-2 cursor-pointer">
                    <LayoutGrid className="size-3.5 text-muted-foreground" />
                    <span>Floor Plan Designer</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?section=screensaver")} className="rounded-lg text-xs gap-2 cursor-pointer">
                    <Monitor className="size-3.5 text-muted-foreground" />
                    <span>Screen Saver & Kiosk</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?section=security")} className="rounded-lg text-xs gap-2 cursor-pointer">
                    <Shield className="size-3.5 text-muted-foreground" />
                    <span>Security & Credentials</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={handleLogout} className="rounded-lg text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
                <LogOut className="size-3.5" />
                <span>{t("dashboardHeader.logout", "Log out")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ========================================= */}
      {/* Global Quick Search & Command Dialog      */}
      {/* ========================================= */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg rounded-2xl overflow-hidden shadow-2xl border-border/80">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Search & Navigation</DialogTitle>
          </DialogHeader>
          <div className="flex items-center px-4 py-3 border-b border-border/70 gap-2.5">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search pages, rules, actions…"
              className="border-0 focus-visible:ring-0 shadow-none px-0 text-sm h-7"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-6 px-1.5 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching results found for "{searchQuery}"
              </div>
            ) : (
              filteredCommands.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCommand(item.path)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{item.subtitle}</span>
                      </div>
                    </div>
                    {item.badge ? (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    ) : (
                      <Sparkles className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          <div className="p-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground px-4">
            <span className="flex items-center gap-1.5">
              <span>Navigation shortcut:</span>
              <kbd className="font-mono bg-background border px-1 rounded text-[10px]">ESC</kbd> to close
            </span>
            <span>{filteredCommands.length} shortcuts available</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
