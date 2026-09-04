import { toast } from "sonner"

/**
 * sound.ts
 * Web Audio API sound generator for reservation alerts and confirmations.
 * Synthesizes crisp, modern hospitality chime alerts without needing external audio files.
 */

export type SoundTone = "chime" | "bell" | "marimba" | "dingdong" | "crystal"

export interface SoundOption {
  id: SoundTone
  label: string
  description: string
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: "chime",
    label: "Modern Chime",
    description: "Bright 3-tone ascending hospitality chime",
  },
  {
    id: "bell",
    label: "Concierge Bell",
    description: "Crisp brass reception desk bell",
  },
  {
    id: "marimba",
    label: "Soft Marimba",
    description: "Warm, gentle acoustic wooden chords",
  },
  {
    id: "dingdong",
    label: "Melodic Ding-Dong",
    description: "Classic two-tone hospitality chime",
  },
  {
    id: "crystal",
    label: "Crystal Glass",
    description: "Pure shimmering harmonic bell resonance",
  },
]

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

  getSoundTone(): SoundTone {
    if (typeof window === "undefined") return "chime"
    const saved = localStorage.getItem("prosisit:notify:soundTone") as SoundTone | null
    if (saved && ["chime", "bell", "marimba", "dingdong", "crystal"].includes(saved)) {
      return saved
    }
    return "chime"
  }

  setSoundTone(tone: SoundTone) {
    if (typeof window === "undefined") return
    localStorage.setItem("prosisit:notify:soundTone", tone)
    this.playTone(tone, true)
  }

  /**
   * Synthesize a note with precise attack and exponential release.
   */
  private playNote(
    ctx: AudioContext,
    targetGain: GainNode,
    freq: number,
    startTime: number,
    duration: number,
    gainVal: number,
    type: OscillatorType = "sine",
  ) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(Math.max(gainVal, 0.001), startTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(targetGain)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  /**
   * Plays the sound effect for a specific tone theme.
   */
  playTone(tone: SoundTone, force = false) {
    if (!force && !this.isSoundEnabled()) return
    const ctx = this.getContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.35, now)
      masterGain.connect(ctx.destination)

      switch (tone) {
        case "bell": {
          // Concierge desk bell: double tap with metallic resonance
          this.playNote(ctx, masterGain, 1318.51, now, 0.25, 0.35, "sine")
          this.playNote(ctx, masterGain, 2637.0, now, 0.2, 0.1, "sine")

          this.playNote(ctx, masterGain, 1318.51, now + 0.1, 1.1, 0.45, "sine")
          this.playNote(ctx, masterGain, 2637.0, now + 0.1, 0.8, 0.15, "sine")
          this.playNote(ctx, masterGain, 3955.5, now + 0.1, 0.5, 0.08, "triangle")
          break
        }
        case "marimba": {
          // Warm acoustic wooden marimba chord
          const notes = [
            { freq: 440.0, time: 0, dur: 0.35, gain: 0.4 },
            { freq: 554.37, time: 0.06, dur: 0.35, gain: 0.45 },
            { freq: 659.25, time: 0.12, dur: 0.4, gain: 0.5 },
            { freq: 880.0, time: 0.18, dur: 0.6, gain: 0.55 },
          ]
          notes.forEach((n) => {
            this.playNote(ctx, masterGain, n.freq, now + n.time, n.dur, n.gain, "triangle")
          })
          break
        }
        case "dingdong": {
          // Melodic Ding-Dong: high Ding, warm Dong
          this.playNote(ctx, masterGain, 783.99, now, 0.45, 0.45, "sine")
          this.playNote(ctx, masterGain, 1568.0, now, 0.3, 0.1, "sine")

          this.playNote(ctx, masterGain, 587.33, now + 0.22, 0.9, 0.55, "sine")
          this.playNote(ctx, masterGain, 1174.66, now + 0.22, 0.6, 0.12, "sine")
          break
        }
        case "crystal": {
          // Crystal glass ping with harmonic shimmer
          this.playNote(ctx, masterGain, 1046.5, now, 1.2, 0.45, "sine")
          this.playNote(ctx, masterGain, 2093.0, now + 0.02, 1.0, 0.2, "sine")
          this.playNote(ctx, masterGain, 3139.5, now + 0.04, 0.7, 0.1, "sine")
          this.playNote(ctx, masterGain, 1050.0, now, 1.1, 0.15, "sine") // subtle detuned shimmer
          break
        }
        case "chime":
        default: {
          // Modern ascending 3-tone arpeggio (C5 -> G5 -> C6)
          this.playNote(ctx, masterGain, 523.25, now, 0.35, 0.35, "sine")
          this.playNote(ctx, masterGain, 783.99, now + 0.09, 0.45, 0.45, "sine")
          this.playNote(ctx, masterGain, 1046.5, now + 0.2, 0.9, 0.55, "sine")
          break
        }
      }
    } catch (err) {
      console.warn("[SoundManager] Failed to play tone:", err)
    }
  }

  /**
   * Plays the currently configured sound chime.
   */
  playConfirmationChime(force = false) {
    this.playTone(this.getSoundTone(), force)
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
