'use client'

import { useEffect } from 'react'
import { initSessionTracking } from '@/lib/analytics'

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSessionTracking()
    return cleanup
  }, [])

  return <>{children}</>
}
