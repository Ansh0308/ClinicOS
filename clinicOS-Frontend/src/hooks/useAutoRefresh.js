import { useEffect } from 'react'

export function useAutoRefresh(fetchFn, intervalSeconds = 30) {
  useEffect(() => {
    const interval = setInterval(fetchFn, intervalSeconds * 1000)
    return () => clearInterval(interval)
  }, [fetchFn, intervalSeconds])
}
