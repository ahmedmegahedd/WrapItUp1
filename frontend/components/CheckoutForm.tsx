'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '@/lib/api'
import { format, addDays, isBefore, isAfter } from 'date-fns'

interface CheckoutFormProps {
  product: any
  selectedVariations: Record<string, string>
  selectedAddons?: string[]
  quantity: number
  timeSlots: any[]
  disabledDates: string[]
  onCancel: () => void
}

export default function CheckoutForm({
  product,
  selectedVariations,
  selectedAddons = [],
  quantity,
  timeSlots,
  disabledDates,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('')
  const [cardMessage, setCardMessage] = useState('')
  const [addons, setAddons] = useState<any[]>([])

  useEffect(() => {
    async function loadAddons() {
      if (selectedAddons.length > 0) {
        try {
          const addonPromises = selectedAddons.map((id) => api.get(`/addons/${id}`))
          const responses = await Promise.all(addonPromises)
          setAddons(responses.map((res) => res.data))
        } catch (error) {
          console.error('Error loading add-ons:', error)
        }
      }
    }
    loadAddons()
  }, [selectedAddons])

  const calculateTotal = () => {
    let price = product.discount_price || product.base_price
    if (product.product_variations) {
      for (const variation of product.product_variations) {
        const selectedOptionId = selectedVariations[variation.name]
        if (selectedOptionId) {
          const option = variation.product_variation_options?.find(
            (opt: any) => opt.id === selectedOptionId
          )
          if (option) {
            price += parseFloat(option.price_modifier || 0)
          }
        }
      }
    }
    
    // Add add-ons price
    const addonsPrice = addons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0)
    
    return (price + addonsPrice) * quantity
  }

  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      if (!disabledDates.includes(dateStr)) {
        dates.push(dateStr)
      }
    }
    return dates
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // Create order
      const orderResponse = await api.post('/orders', {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        card_message: cardMessage,
        items: [
          {
            product_id: product.id,
            quantity,
            selected_variations: selectedVariations,
            selected_addons: selectedAddons,
          },
        ],
      })

      const order = orderResponse.data

      // Create payment intent
      const paymentResponse = await api.post('/payments/create-intent', {
        orderId: order.id,
        amount: calculateTotal(),
      })

      const { clientSecret } = paymentResponse.data

      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderNumber=${order.order_number}`,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setLoading(false)
      } else {
        // Payment succeeded, redirect
        router.push(`/order-confirmation?orderNumber=${order.order_number}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred')
      setLoading(false)
    }
  }

  const availableDates = getAvailableDates()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Checkout</h2>

          {/* Order Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-900">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-900">
                <span>{product.title} x {quantity}</span>
                <span>${((product.discount_price || product.base_price) * quantity).toFixed(2)}</span>
              </div>
              {addons.length > 0 && (
                <div className="ml-4 space-y-1 pt-2 border-t border-gray-200">
                  {addons.map((addon) => (
                    <div key={addon.id} className="flex justify-between text-sm text-gray-700">
                      <span>+ {addon.name}</span>
                      <span>+${(parseFloat(addon.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="font-semibold mb-4">Customer Information</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <h3 className="font-semibold mb-4">Delivery Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Delivery Date *</label>
                  <select
                    required
                    value={deliveryDate}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value)
                      setDeliveryTimeSlot('')
                    }}
                    className="w-full px-4 py-2 border rounded"
                  >
                    <option value="">Select a date</option>
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </option>
                    ))}
                  </select>
                </div>
                {deliveryDate && (
                  <div>
                    <label className="block mb-2">Time Slot *</label>
                    <select
                      required
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full px-4 py-2 border rounded"
                    >
                      <option value="">Select a time slot</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.id} value={slot.time_slot}>
                          {slot.time_slot}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Card Message */}
            <div>
              <label className="block font-semibold mb-2">Card Message (optional)</label>
              <textarea
                value={cardMessage}
                onChange={(e) => setCardMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={4}
                className="w-full px-4 py-2 border rounded"
              />
            </div>

            {/* Payment */}
            <div>
              <h3 className="font-semibold mb-4">Payment</h3>
              <div className="border rounded p-4">
                <PaymentElement />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !stripe || !elements}
                className="flex-1 px-6 py-3 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Complete Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
