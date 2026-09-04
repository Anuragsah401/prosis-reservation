import { toast } from "sonner"

/**
 * sound.ts
 * Web Audio API sound generator for reservation alerts and confirmations.
 * Synthesizes crisp, modern hospitality chime alerts without needing external audio files.
 */

class SoundManager {
  private ctx: AudioContext | null = null
  private unlocked = false

  constructor() {
    this.setupUnlockListener()
  }

  private setupUnlockListener() {
    if (typeof window === "undefined" || this.unlocked) return

    const unlock = () => {
      const ctx = this.getContext()
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }
      this.unlocked = true
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
      window.removeEventListener("touchstart", unlock)
    }

    window.addEventListener("pointerdown", unlock, { passive: true, once: true })
    window.addEventListener("keydown", unlock, { passive: true, once: true })
    window.addEventListener("touchstart", unlock, { passive: true, once: true })
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          this.ctx = new AudioCtx()
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {})
      }
      return this.ctx
    } catch {
      return null
    }
  }

  isSoundEnabled(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem("prosisit:notify:sound") !== "false"
  }

  setSoundEnabled(enabled: boolean) {
    if (typeof window === "undefined") return
    localStorage.setItem("prosisit:notify:sound", String(enabled))
    if (enabled) {
      this.playConfirmationChime(true)
    }
  }

  /**
   * Plays a pleasant 3-tone ascending chime (C5 -> G5 -> C6).
   * Perfect for reservation confirmations and new bookings.
   */
  playConfirmationChime(force = false) {
    if (!force && !this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.35, now)
      masterGain.connect(ctx.destination)

      // C5 (523.25 Hz) -> G5 (783.99 Hz) -> C6 (1046.50 Hz)
      const notes = [
        { freq: 523.25, time: 0, duration: 0.35, gain: 0.35 },
        { freq: 783.99, time: 0.09, duration: 0.45, gain: 0.45 },
        { freq: 1046.5, time: 0.2, duration: 0.9, gain: 0.55 },
      ]

      notes.forEach(({ freq, time, duration, gain: noteGainVal }) => {
        const startTime = now + time
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.0001, startTime)
        gain.gain.exponentialRampToValueAtTime(noteGainVal, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

        osc.connect(gain)
        gain.connect(masterGain)

        osc.start(startTime)
        osc.stop(startTime + duration)
      })
    } catch (err) {
      console.warn("[SoundManager] Failed to play chime:", err)
    }
  }
}

export const soundManager = new SoundManager()

// Deduplication cache so overlapping realtime events don't double-alert
const recentAlerts = new Set<string>()

export function triggerReservationConfirmedAlert(opts: {
  id?: string
  title?: string
  message?: string
  customerName?: string
  partySize?: number
  dateStr?: string
  tableName?: string | null
}) {
  const dedupKey = opts.id || `${opts.customerName || ""}_${opts.dateStr || ""}_${opts.message || ""}`
  if (recentAlerts.has(dedupKey)) return
  recentAlerts.add(dedupKey)
  setTimeout(() => recentAlerts.delete(dedupKey), 8000)

  // 1. Play audio chime
  soundManager.playConfirmationChime()

  // 2. Toast alert
  const title = opts.title || "Reservation Confirmed by Customer"
  const description =
    opts.message ||
    (opts.customerName
      ? `${opts.customerName} confirmed their booking${opts.partySize ? ` for ${opts.partySize} guests` : ""}${opts.dateStr ? ` (${opts.dateStr})` : ""}${opts.tableName ? ` • Table ${opts.tableName}` : ""}.`
      : "A customer confirmed their booking.")

  toast.success(title, {
    description,
    duration: 6000,
  })
}
