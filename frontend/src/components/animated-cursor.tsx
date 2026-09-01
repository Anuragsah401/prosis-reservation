import { useEffect, useRef, useState } from "react"

/**
 * AnimatedCursor provides a fluid, hardware-accelerated interactive mouse pointer
 * with a crisp center dot, a smooth spring-trailing halo aura, and dynamic hover reactions.
 * Automatically disabled on touch-screen devices.
 */
export function AnimatedCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isTextInput, setIsTextInput] = useState(false)

  const cursorDotRef = useRef<HTMLDivElement>(null)
  const cursorAuraRef = useRef<HTMLDivElement>(null)

  const mousePos = useRef({ x: -100, y: -100 })
  const auraPos = useRef({ x: -100, y: -100 })
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    // Disable on touch / mobile devices where mouse hover is irrelevant
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches

    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (!isVisible) setIsVisible(true)

      // Instantly position the primary center dot on GPU
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }

      // Check if current hovered target is interactive or text input
      const target = e.target as HTMLElement | null
      if (target) {
        const isInteractive = Boolean(
          target.closest(
            'a, button, [role="button"], input, select, textarea, label, [data-clickable], .cursor-pointer, .clickable',
          ),
        )
        const isText = Boolean(
          target.closest('input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="search"], textarea, [contenteditable="true"]'),
        )

        setIsHovered(isInteractive)
        setIsTextInput(isText)
      }
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const handleMouseLeave = () => {
      setIsVisible(false)
      setIsHovered(false)
      setIsClicking(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    document.documentElement.addEventListener("mouseleave", handleMouseLeave)
    document.documentElement.addEventListener("mouseenter", handleMouseEnter)

    // Smooth Lerp loop for the trailing aura halo
    const render = () => {
      const lerp = 0.2
      auraPos.current.x += (mousePos.current.x - auraPos.current.x) * lerp
      auraPos.current.y += (mousePos.current.y - auraPos.current.y) * lerp

      if (cursorAuraRef.current) {
        cursorAuraRef.current.style.transform = `translate3d(${auraPos.current.x}px, ${auraPos.current.y}px, 0)`
      }

      rafId.current = requestAnimationFrame(render)
    }

    rafId.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave)
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [isVisible])

  return (
    <>
      {/* Primary Center Dot */}
      <div
        ref={cursorDotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[99999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-200 will-change-transform ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isTextInput
            ? "h-4 w-1 bg-primary rounded-xs"
            : isHovered
              ? "h-2 w-2 bg-primary scale-125"
              : isClicking
                ? "h-1.5 w-1.5 bg-primary/80 scale-90"
                : "h-2 w-2 bg-primary shadow-xs"
        }`}
      />

      {/* Smooth Trailing Aura / Halo */}
      <div
        ref={cursorAuraRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-[99998] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,background-color,border-color,opacity,transform] duration-200 ease-out will-change-transform ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${
          isTextInput
            ? "h-6 w-6 border-primary/40 bg-primary/5"
            : isClicking
              ? "h-6 w-6 border-primary/80 bg-primary/20 scale-90"
              : isHovered
                ? "h-11 w-11 border-primary/50 bg-primary/10 backdrop-blur-[1px] shadow-sm shadow-primary/20"
                : "h-8 w-8 border-primary/30 bg-primary/5"
        }`}
      />
    </>
  )
}

