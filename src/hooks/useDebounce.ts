import { useState, useEffect } from 'react'

export function useDebounce(value: any, delay: number): any {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebounceCallback(callback: (...args: any[]) => void, delay: number) {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | undefined>(undefined)

  const debouncedCallback = (...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)

    setDebounceTimer(newTimer)
  }

  return debouncedCallback
}