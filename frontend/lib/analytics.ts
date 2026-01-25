// Analytics tracking utilities

/**
 * Get or create a session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

/**
 * Track product click
 */
export async function trackProductClick(productId: string) {
  if (typeof window === 'undefined') return

  const sessionId = getSessionId()
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4321/api'}/analytics/track/product-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        session_id: sessionId,
      }),
    })
  } catch (error) {
    console.error('Error tracking product click:', error)
  }
}

/**
 * Track user session activity (heartbeat)
 */
export async function trackSessionActivity() {
  if (typeof window === 'undefined') return

  const sessionId = getSessionId()
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4321/api'}/analytics/track/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    })
  } catch (error) {
    console.error('Error tracking session:', error)
  }
}

/**
 * Initialize session tracking with heartbeat
 */
export function initSessionTracking() {
  if (typeof window === 'undefined') return

  // Track initial session
  trackSessionActivity()

  // Set up heartbeat (every 30 seconds)
  const heartbeatInterval = setInterval(() => {
    trackSessionActivity()
  }, 30000)

  // Track on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      trackSessionActivity()
    }
  })

  // Track on user interaction
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  const trackOnInteraction = () => {
    trackSessionActivity()
  }

  events.forEach((event) => {
    document.addEventListener(event, trackOnInteraction, { once: true, passive: true })
  })

  // Cleanup function (optional, for when component unmounts)
  return () => {
    clearInterval(heartbeatInterval)
    events.forEach((event) => {
      document.removeEventListener(event, trackOnInteraction)
    })
  }
}
