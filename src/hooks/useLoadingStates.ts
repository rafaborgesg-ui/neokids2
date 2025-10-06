import { useState, useCallback } from 'react'

interface LoadingState {
  [key: string]: boolean
}

interface UseLoadingStatesReturn {
  loading: LoadingState
  setLoading: (key: string, isLoading: boolean) => void
  isLoading: (key: string) => boolean
  withLoading: (key: string, fn: () => Promise<any>) => Promise<any>
}

export function useLoadingStates(): UseLoadingStatesReturn {
  const [loading, setLoadingState] = useState<LoadingState>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loading[key] || false
  }, [loading])

  const withLoading = useCallback(async (key: string, fn: () => Promise<any>): Promise<any> => {
    setLoading(key, true)
    try {
      const result = await fn()
      return result
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return {
    loading,
    setLoading,
    isLoading,
    withLoading
  }
}