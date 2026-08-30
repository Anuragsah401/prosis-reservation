import { useState } from "react";
import { Download, Share, PlusSquare, Smartphone, Check, ArrowRight, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePWA } from "@/hooks/use-pwa";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function PWAInstallButton({
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [isIOSDialogOpen, setIsIOSDialogOpen] = useState(false);

  // If already installed and in standalone window, don't clutter the UI
  if (isInstalled) {
    return null;
  }

  // Only show if installable on desktop/android or on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setIsIOSDialogOpen(true);
      return;
    }

    if (isInstallable) {
      await promptInstall();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        title="Install Seat Booking as an App"
      >
        <Download className="size-4 shrink-0" />
        {showText && <span>Install App</span>}
      </Button>

      {/* iOS Install Instruction Dialog */}
      <Dialog open={isIOSDialogOpen} onOpenChange={setIsIOSDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Smartphone className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Install Seat Booking</DialogTitle>
                <DialogDescription className="text-xs">
                  Install on your iPhone or iPad home screen for instant fullscreen kiosk and offline access.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="flex items-start gap-3 rounded-2xl border p-3 bg-muted/40">
              <div className="size-7 rounded-xl bg-background border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                1
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  Tap the Share button <Share className="size-3.5 text-primary inline" />
                </span>
                <span className="text-muted-foreground text-[11px] mt-0.5">
                  Located in the Safari toolbar at the bottom or top of your screen.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border p-3 bg-muted/40">
              <div className="size-7 rounded-xl bg-background border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                2
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  Select "Add to Home Screen" <PlusSquare className="size-3.5 text-primary inline" />
                </span>
                <span className="text-muted-foreground text-[11px] mt-0.5">
                  Scroll down the share menu and tap "Add to Home Screen".
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border p-3 bg-muted/40">
              <div className="size-7 rounded-xl bg-background border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                3
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  Tap "Add" in top right <Check className="size-3.5 text-emerald-500 inline" />
                </span>
                <span className="text-muted-foreground text-[11px] mt-0.5">
                  Seat Booking will appear as a standalone app on your home screen with zero browser bars!
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setIsIOSDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * PWA Status Toast / Banners for App Updates and Offline status
 */
export function PWAStatusBar() {
  const { isOnline, hasUpdate, updateApp } = usePWA();

  return (
    <>
      {/* Offline Alert */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[99999] bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="size-4 shrink-0" />
          <span>You are currently offline. Cached restaurant data is available.</span>
        </div>
      )}

      {/* Update Available Banner */}
      {hasUpdate && (
        <div className="fixed bottom-4 right-4 z-[99999] bg-card border border-primary/40 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <RefreshCw className="size-4 animate-spin" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground">Update Available</span>
            <span className="text-[11px] text-muted-foreground">A new version of Seat Booking is ready.</span>
          </div>
          <Button
            size="sm"
            onClick={updateApp}
            className="rounded-xl text-xs font-semibold gap-1 shrink-0 ml-auto"
          >
            <span>Update</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </>
  );
}
