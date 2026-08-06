import { useEffect, useRef, useState } from "react"

/**
 * Tracks whether a scrollable container has more content below the current
 * scroll position. Useful for showing a "scroll down for more" hint that
 * disappears once the user reaches the bottom (or if everything fits).
 *
 * Re-checks automatically on scroll, on container resize, and whenever
 * `deps` change (e.g. when the underlying list data changes length).
 */
export function useScrollOverflow<T extends HTMLElement>(deps: React.DependencyList = []) {
  const ref = useRef<T>(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function checkOverflow() {
      if (!el) return
      const canScroll = el.scrollHeight - el.clientHeight > 4
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
      setHasMoreBelow(canScroll && !atBottom)
    }

    checkOverflow()
    el.addEventListener("scroll", checkOverflow)
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)

    return () => {
      el.removeEventListener("scroll", checkOverflow)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ref, hasMoreBelow }
}
