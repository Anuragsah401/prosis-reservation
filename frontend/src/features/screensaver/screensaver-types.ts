export type ScreenSaverTheme = "midnight" | "aurora" | "gold" | "bistro"

export interface ScreenSaverSettings {
  enabled: boolean
  idleTimeoutMinutes: number // 1, 2, 5, 10, 15, 30, 0 (0 = manual only)
  customHeadline?: string
  showQrCode: boolean
  showClock: boolean
  theme: ScreenSaverTheme
}

export const DEFAULT_SCREENSAVER_SETTINGS: ScreenSaverSettings = {
  enabled: true,
  idleTimeoutMinutes: 5,
  customHeadline: "",
  showQrCode: true,
  showClock: true,
  theme: "midnight",
}

export const SCREENSAVER_STORAGE_KEY = "prosis:screensaver:settings"
