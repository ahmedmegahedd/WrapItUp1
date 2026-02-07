'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'
import { useCart } from '@/contexts/CartContext'
import CheckoutForm from '@/components/CheckoutForm'
import { getTimeSlots, getDisabledDates } from '@/lib/data'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [disabledDates, setDisabledDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [slots, dates] = await Promise.all([
          getTimeSlots(),
          getDisabledDates(),
        ])
        setTimeSlots(slots)
        setDisabledDates(dates)
      } catch (error) {
        console.error('Error loading checkout data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      router.push('/collections')
    }
  }, [items, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return null // Will redirect
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        cartItems={items}
        timeSlots={timeSlots}
        disabledDates={disabledDates}
        onCancel={() => router.push('/collections')}
      />
    </Elements>
  )
}
