import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  Monitor,
  Sparkles,
  Clock,
  QrCode,
  Palette,
  Play,
  Check,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useScreenSaver } from "./screensaver-context"
import { type ScreenSaverTheme } from "./screensaver-types"
import { cn } from "@/lib/utils"

const THEME_OPTIONS: { id: ScreenSaverTheme; label: string; previewClass: string }[] = [
  {
    id: "midnight",
    label: "Midnight Aurora (Blue & Indigo)",
    previewClass: "from-blue-600 to-indigo-900 border-blue-400",
  },
  {
    id: "aurora",
    label: "Emerald Glow (Teal & Green)",
    previewClass: "from-emerald-500 to-teal-900 border-emerald-400",
  },
  {
    id: "gold",
    label: "Luxury Amber (Gold & Bronze)",
    previewClass: "from-amber-500 to-yellow-900 border-amber-400",
  },
  {
    id: "bistro",
    label: "Deep Bistro (Burgundy & Rose)",
    previewClass: "from-rose-600 to-pink-950 border-rose-400",
  },
]

export function ScreenSaverSettingsSection() {
  const { t } = useTranslation()
  const { settings, updateSettings, activateScreenSaver } = useScreenSaver()

  function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    toast.success(t("pages.settings.screensaver.saveSuccess", "Screen saver preferences updated"))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Monitor className="size-5" />
            </div>
            <div>
              <CardTitle>{t("pages.settings.screensaver.title", "Screen Saver & Kiosk Display")}</CardTitle>
              <CardDescription>
                {t(
                  "pages.settings.screensaver.description",
                  "Automated standby display advertising seatbooking.dk in partnership with your restaurant.",
                )}
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={activateScreenSaver}
            className="gap-1.5 shadow-2xs font-semibold"
          >
            <Play className="size-3.5 fill-current" />
            <span>{t("pages.settings.screensaver.previewButton", "Preview Now")}</span>
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSave}>
        <CardContent className="flex flex-col gap-6">
          {/* Main Activation Toggle */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <Label htmlFor="screensaver-enabled" className="text-sm font-semibold cursor-pointer">
                  {t("pages.settings.screensaver.enableLabel", "Enable Screen Saver")}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "pages.settings.screensaver.enableDesc",
                  "Automatically show the co-branded promotional display after inactivity.",
                )}
              </p>
            </div>
            <Switch
              id="screensaver-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>

          {/* Inactivity Timeout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="idle-timeout" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="size-4 text-muted-foreground" />
                <span>{t("pages.settings.screensaver.timeoutLabel", "Inactivity Timeout")}</span>
              </Label>
              <Select
                value={String(settings.idleTimeoutMinutes)}
                onValueChange={(val) => updateSettings({ idleTimeoutMinutes: Number(val) })}
                disabled={!settings.enabled}
              >
                <SelectTrigger id="idle-timeout" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes (Recommended)</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="0">Manual Launch Only (Never)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Headline / Tagline */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="screensaver-headline">
                {t("pages.settings.screensaver.taglineLabel", "Custom Promotional Tagline")}
              </Label>
              <Input
                id="screensaver-headline"
                placeholder="e.g. Instant Online Table Reservations"
                value={settings.customHeadline || ""}
                onChange={(e) => updateSettings({ customHeadline: e.target.value })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Visual Theme Selection */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Palette className="size-4 text-muted-foreground" />
              <span>{t("pages.settings.screensaver.themeLabel", "Visual Theme & Ambience")}</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = settings.theme === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateSettings({ theme: theme.id })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/70 hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "size-7 rounded-lg bg-gradient-to-br border shrink-0 shadow-xs",
                        theme.previewClass,
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {theme.label}
                      </span>
                    </div>
                    {isSelected && <Check className="size-4 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Interactive Feature Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Show QR Code */}
            <div className="flex items-center justify-between rounded-xl border p-3.5 bg-muted/10">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <QrCode className="size-4 text-primary" />
                  <Label htmlFor="show-qr" className="text-xs font-semibold cursor-pointer">
                    {t("pages.settings.screensaver.showQrLabel", "Live Booking QR Code")}
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("pages.settings.screensaver.showQrDesc", "Allow guests to scan & book directly from their phone.")}
                </p>
              </div>
              <Switch
                id="show-qr"
                checked={settings.showQrCode}
                onCheckedChange={(checked) => updateSettings({ showQrCode: checked })}
                disabled={!settings.enabled}
              />
            </div>

            {/* Show Live Clock */}
            <div className="flex items-center justify-between rounded-xl border p-3.5 bg-muted/10">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  <Label htmlFor="show-clock" className="text-xs font-semibold cursor-pointer">
                    {t("pages.settings.screensaver.showClockLabel", "Digital Time & Date")}
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("pages.settings.screensaver.showClockDesc", "Display real-time digital clock on standby.")}
                </p>
              </div>
              <Switch
                id="show-clock"
                checked={settings.showClock}
                onCheckedChange={(checked) => updateSettings({ showClock: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t p-4 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            {t(
              "pages.settings.screensaver.footerTip",
              "Tip: Pressing Escape or touching the screen will immediately close the screen saver.",
            )}
          </p>
          <Button type="button" onClick={activateScreenSaver} className="gap-1.5 font-semibold">
            <Play className="size-4 fill-current" />
            <span>{t("pages.settings.screensaver.launchButton", "Launch Screen Saver")}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
