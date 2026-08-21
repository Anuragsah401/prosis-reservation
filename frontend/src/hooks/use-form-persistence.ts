import { useCallback, useEffect, useRef, useState } from "react"

const PREFIX = "prosisit:form-draft:"

function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // ignore quota / serialization errors
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}

/**
 * Persists form state to localStorage so it survives page refresh,
 * tab close, navigation away/back, or a browser crash.
 *
 * Usage:
 *   const [state, setState, clearDraft] = usePersistedFormState("signup-form", initialState)
 *
 * Call `clearDraft()` after a successful submit to remove the saved draft.
 *
 * Pass `exclude` to omit sensitive fields (e.g. password) from persistence.
 */
export function usePersistedFormState<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  options?: { exclude?: (keyof T)[]; debounceMs?: number }
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const excludeKey = JSON.stringify(options?.exclude ?? [])
  const debounceMs = options?.debounceMs ?? 250

  const [state, setState] = useState<T>(() => {
    const stored = readStorage<Partial<T>>(key)
    if (stored) {
      return { ...initialState, ...stored }
    }
    return initialState
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const toStore: Partial<T> = { ...state }
      const excludeFields = JSON.parse(excludeKey) as (keyof T)[]
      for (const field of excludeFields) {
        delete toStore[field]
      }
      writeStorage(key, toStore)
    }, debounceMs)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [state, key, debounceMs, excludeKey])

  const clearDraft = useCallback(() => {
    removeStorage(key)
  }, [key])

  return [state, setState, clearDraft]
}

/**
 * Simpler variant for a single persisted value (e.g. a step index,
 * or a single text field) rather than an object of fields.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: { debounceMs?: number }
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const debounceMs = options?.debounceMs ?? 250

  const [state, setState] = useState<T>(() => {
    const stored = readStorage<T>(key)
    return stored !== null && stored !== undefined ? stored : initialValue
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      writeStorage(key, state)
    }, debounceMs)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const clearDraft = useCallback(() => {
    removeStorage(key)
  }, [key])

  return [state, setState, clearDraft]
}

export function clearFormDraft(key: string) {
  removeStorage(key)
}

/**
 * Removes all form drafts from localStorage.
 * Called automatically upon user logout to prevent lingering draft data.
 */
export function clearAllFormDrafts() {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(PREFIX)) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

