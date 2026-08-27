import { useEffect, useRef, useState, type ReactNode } from "react"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number // in milliseconds
  direction?: "up" | "down" | "left" | "right" | "fade"
  threshold?: number
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.12,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Trigger immediately if user prefers reduced motion or if IntersectionObserver is unsupported
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -30px 0px",
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  let transformHidden = "translate-y-8 opacity-0"
  if (direction === "down") transformHidden = "-translate-y-8 opacity-0"
  if (direction === "left") transformHidden = "translate-x-8 opacity-0"
  if (direction === "right") transformHidden = "-translate-x-8 opacity-0"
  if (direction === "fade") transformHidden = "opacity-0 scale-95"

  const transformVisible = "translate-y-0 translate-x-0 opacity-100 scale-100"

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        isVisible ? transformVisible : transformHidden
      } ${className}`}
    >
      {children}
    </div>
  )
}
