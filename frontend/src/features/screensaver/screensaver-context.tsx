import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import {
  DEFAULT_SCREENSAVER_SETTINGS,
  SCREENSAVER_STORAGE_KEY,
  type ScreenSaverSettings,
} from "./screensaver-types"

interface ScreenSaverContextValue {
  settings: ScreenSaverSettings
  updateSettings: (partial: Partial<ScreenSaverSettings>) => void
  isActive: boolean
  activateScreenSaver: () => void
  dismissScreenSaver: () => void
}

const ScreenSaverContext = createContext<ScreenSaverContextValue>({
  settings: DEFAULT_SCREENSAVER_SETTINGS,
  updateSettings: () => {},
  isActive: false,
  activateScreenSaver: () => {},
  dismissScreenSaver: () => {},
})

function loadStoredSettings(): ScreenSaverSettings {
  try {
    const raw = localStorage.getItem(SCREENSAVER_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_SCREENSAVER_SETTINGS, ...JSON.parse(raw) }
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_SCREENSAVER_SETTINGS
}

export function ScreenSaverProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ScreenSaverSettings>(loadStoredSettings)
  const [isActive, setIsActive] = useState(false)
  const idleTimerRef = useRef<number | null>(null)
  const lastActiveTimestampRef = useRef<number>(Date.now())
  const activationTimeRef = useRef<number>(0)

  const updateSettings = useCallback((partial: Partial<ScreenSaverSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      try {
        localStorage.setItem(SCREENSAVER_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage ignored
      }
      return next
    })
  }, [])

  const activateScreenSaver = useCallback(() => {
    activationTimeRef.current = Date.now()
    setIsActive(true)
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Browser may require user gesture for automatic fullscreen
        })
      }
    } catch {
      // ignore
    }
  }, [])

  const dismissScreenSaver = useCallback(() => {
    // Guard against micro-mouse-shakes upon activation (500ms grace window)
    if (Date.now() - activationTimeRef.current < 500) return
    setIsActive(false)
    lastActiveTimestampRef.current = Date.now()
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    } catch {
      // ignore
    }
  }, [])

  // Inactivity detection loop
  useEffect(() => {
    if (!settings.enabled || settings.idleTimeoutMinutes <= 0) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      return
    }

    const timeoutMs = settings.idleTimeoutMinutes * 60 * 1000

    const resetIdleTimer = () => {
      lastActiveTimestampRef.current = Date.now()
      if (isActive) {
        dismissScreenSaver()
      }
    }

    const checkIdle = () => {
      const elapsed = Date.now() - lastActiveTimestampRef.current
      if (elapsed >= timeoutMs && !isActive) {
        activateScreenSaver()
      }
    }

    const intervalId = window.setInterval(checkIdle, 5000)

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "pointerdown", "wheel"]
    events.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    })

    return () => {
      window.clearInterval(intervalId)
      events.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer)
      })
    }
  }, [settings.enabled, settings.idleTimeoutMinutes, isActive, activateScreenSaver, dismissScreenSaver])

  return (
    <ScreenSaverContext.Provider
      value={{
        settings,
        updateSettings,
        isActive,
        activateScreenSaver,
        dismissScreenSaver,
      }}
    >
      {children}
    </ScreenSaverContext.Provider>
  )
}

export function useScreenSaver() {
  return useContext(ScreenSaverContext)
}
