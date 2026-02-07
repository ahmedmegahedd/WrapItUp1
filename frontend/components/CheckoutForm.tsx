'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import api from '@/lib/api'
import { format, addDays, isBefore, isAfter } from 'date-fns'
import { useCart } from '@/contexts/CartContext'

import { CartItem } from '@/contexts/CartContext'

interface CheckoutFormProps {
  // Legacy props for single product checkout
  product?: any
  selectedVariations?: Record<string, string>
  selectedAddons?: string[]
  quantity?: number
  // New props for cart checkout
  cartItems?: CartItem[]
  timeSlots: any[]
  disabledDates?: string[] // Legacy support
  onCancel: () => void
}

export default function CheckoutForm({
  product,
  selectedVariations = {},
  selectedAddons = [],
  quantity = 1,
  cartItems,
  timeSlots,
  disabledDates,
  onCancel,
}: CheckoutFormProps) {
  // Determine if using cart or single product
  const isCartCheckout = !!cartItems && cartItems.length > 0
  const items = isCartCheckout ? cartItems! : []
  const { clearCart } = useCart()
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
  const [deliveryTimeSlotId, setDeliveryTimeSlotId] = useState('')
  const [cardMessage, setCardMessage] = useState('')
  const [addons, setAddons] = useState<any[]>([])
  const [availableDays, setAvailableDays] = useState<any[]>([])
  const [loadingDays, setLoadingDays] = useState(false)
  const [deliveryDestinations, setDeliveryDestinations] = useState<{ id: string; name: string; fee_egp: number }[]>([])
  const [deliveryDestinationId, setDeliveryDestinationId] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryMapsLink, setDeliveryMapsLink] = useState('')
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null)
  const [promoDiscountEgp, setPromoDiscountEgp] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [showSoldOutModal, setShowSoldOutModal] = useState(false)

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

  useEffect(() => {
    async function loadAvailableDays() {
      setLoadingDays(true)
      try {
        const today = new Date()
        const endDate = addDays(today, 60)
        const response = await api.get('/delivery/available-dates', {
          params: {
            startDate: format(today, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
          },
        })
        setAvailableDays(response.data || [])
      } catch (error) {
        console.error('Error loading available days:', error)
        // Fallback to legacy behavior
        setAvailableDays([])
      } finally {
        setLoadingDays(false)
      }
    }
    loadAvailableDays()
  }, [])

  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await api.get('/delivery-destinations')
        setDeliveryDestinations(res.data || [])
      } catch (e) {
        console.error('Error loading delivery destinations', e)
      }
    }
    loadDestinations()
  }, [])

  const getSubtotal = () => {
    if (isCartCheckout) {
      return items.reduce((sum, item) => sum + item.calculated_price, 0)
    } else {
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
      const addonsPrice = addons.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0)
      return (price + addonsPrice) * quantity
    }
  }

  const getDeliveryFeeEgp = () => {
    if (!deliveryDestinationId) return 0
    const dest = deliveryDestinations.find((d) => d.id === deliveryDestinationId)
    return dest ? Number(dest.fee_egp || 0) : 0
  }

  const getTotal = () => {
    const subtotal = getSubtotal()
    const deliveryFee = getDeliveryFeeEgp()
    return Math.max(0, subtotal - promoDiscountEgp + deliveryFee)
  }

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim()
    if (!code) return
    setPromoError(null)
    try {
      const res = await api.post('/promo-codes/validate', {
        code,
        subtotal_egp: getSubtotal(),
      })
      setPromoCodeId(res.data.promo_code_id ?? null)
      setPromoDiscountEgp(Number(res.data.discount_amount_egp || 0))
    } catch (err: any) {
      setPromoError(err.response?.data?.message || 'Invalid or expired promo code')
      setPromoDiscountEgp(0)
      setPromoCodeId(null)
    }
  }

  const calculateTotal = () => getTotal()

  const getAvailableDates = () => {
    // Use new delivery days system if available
    if (availableDays.length > 0) {
      return availableDays
        .filter((day) => day.status === 'available')
        .map((day) => ({
          date: day.date,
          status: day.status,
          label: format(new Date(day.date), 'EEEE, MMMM d, yyyy'),
        }))
    }

    // Fallback to legacy behavior
    const dates: any[] = []
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      if (!disabledDates || !disabledDates.includes(dateStr)) {
        dates.push({
          date: dateStr,
          status: 'available',
          label: format(date, 'EEEE, MMMM d, yyyy'),
        })
      }
    }
    return dates
  }

  const getUnavailableDates = () => {
    if (availableDays.length > 0) {
      return availableDays
        .filter((day) => day.status !== 'available')
        .map((day) => ({
          date: day.date,
          status: day.status,
          label: format(new Date(day.date), 'EEEE, MMMM d, yyyy'),
        }))
    }
    return []
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // Prepare order items
      const orderItems = isCartCheckout
        ? items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            selected_variations: item.selected_variations,
            selected_addons: item.selected_addons,
          }))
        : [
            {
              product_id: product.id,
              quantity,
              selected_variations: selectedVariations,
              selected_addons: selectedAddons,
            },
          ]

      if (deliveryDestinations.length > 0 && !deliveryDestinationId) {
        setError('Please select a delivery destination')
        setLoading(false)
        return
      }
      if (!deliveryAddress?.trim()) {
        setError('Please enter the full delivery address')
        setLoading(false)
        return
      }
      if (!deliveryMapsLink?.trim()) {
        setError('Please paste the Google Maps location link')
        setLoading(false)
        return
      }

      const subtotalEgp = getSubtotal()
      const deliveryFeeEgp = getDeliveryFeeEgp()
      const discountEgp = promoDiscountEgp

      const orderResponse = await api.post('/orders', {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        delivery_time_slot_id: deliveryTimeSlotId || undefined,
        card_message: cardMessage,
        delivery_destination_id: deliveryDestinationId || undefined,
        delivery_fee_egp: deliveryFeeEgp,
        delivery_address: deliveryAddress.trim(),
        delivery_maps_link: deliveryMapsLink.trim(),
        promo_code_id: promoCodeId || undefined,
        discount_amount_egp: discountEgp,
        items: orderItems,
      })

      const order = orderResponse.data

      const paymentResponse = await api.post('/payments/create-intent', {
        orderId: order.id,
        amount: getTotal(),
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
        // Payment succeeded, clear cart and redirect
        if (isCartCheckout) {
          clearCart()
        }
        router.push(`/order-confirmation?orderNumber=${order.order_number}`)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'An error occurred'
      setError(msg)
      setLoading(false)
      if (
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('insufficient stock') || msg.toLowerCase().includes('sold out'))
      ) {
        setShowSoldOutModal(true)
      }
    }
  }

  const availableDates = getAvailableDates()
  const currencyLabel = 'EGP'
  const formatEgp = (n: number) => `E£ ${n.toFixed(2)}`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Checkout</h2>

          {/* Order Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-900">Order Summary</h3>
            <div className="space-y-2 mb-4">
              {isCartCheckout ? (
                // Cart items summary
                items.map((item) => (
                  <div key={item.id} className="pb-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between text-gray-900">
                      <span>{item.product_title} x {item.quantity}</span>
                      <span>{formatEgp(item.calculated_price)}</span>
                    </div>
                    {Object.keys(item.selected_variations).length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        {Object.entries(item.selected_variations).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    )}
                    {item.selected_addons.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{item.selected_addons.length} add-on{item.selected_addons.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Single product summary (legacy)
                <>
                  <div className="flex justify-between text-gray-900">
                    <span>{product.title} x {quantity}</span>
                    <span>{formatEgp((product.discount_price || product.base_price) * quantity)}</span>
                  </div>
                  {addons.length > 0 && (
                    <div className="ml-4 space-y-1 pt-2 border-t border-gray-200">
                      {addons.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-sm text-gray-700">
                          <span>+ {addon.name}</span>
                          <span>+{formatEgp(parseFloat(addon.price || 0) * quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {promoDiscountEgp > 0 && (
              <div className="flex justify-between text-gray-700 pt-2">
                <span>Discount</span>
                <span className="text-green-600">-{formatEgp(promoDiscountEgp)}</span>
              </div>
            )}
            {getDeliveryFeeEgp() > 0 && (
              <div className="flex justify-between text-gray-700 pt-1">
                <span>Delivery</span>
                <span>{formatEgp(getDeliveryFeeEgp())}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
              <span>Total ({currencyLabel})</span>
              <span>{formatEgp(getTotal())}</span>
            </div>
          </div>

          {/* Promo code */}
          <div>
            <h3 className="font-semibold mb-2">Promo code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value.toUpperCase())
                  setPromoError(null)
                }}
                className="flex-1 px-4 py-2 border rounded"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Apply
              </button>
            </div>
            {promoError && <p className="text-red-600 text-sm mt-1">{promoError}</p>}
            {promoDiscountEgp > 0 && (
              <p className="text-green-600 text-sm mt-1">Discount applied: {formatEgp(promoDiscountEgp)}</p>
            )}
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
                  {loadingDays ? (
                    <div className="w-full px-4 py-2 border rounded bg-gray-50 text-gray-500">
                      Loading dates...
                    </div>
                  ) : (
                    <>
                      <select
                        required
                        value={deliveryDate}
                        onChange={(e) => {
                          setDeliveryDate(e.target.value)
                          setDeliveryTimeSlot('')
                          setDeliveryTimeSlotId('')
                        }}
                        className="w-full px-4 py-2 border rounded"
                      >
                        <option value="">Select a date</option>
                        {availableDates.map((day) => (
                          <option key={day.date} value={day.date}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
                {deliveryDate && (
                  <div>
                    <label className="block mb-2">Time Slot *</label>
                    <select
                      required
                      value={deliveryTimeSlotId}
                      onChange={(e) => {
                        const selectedSlot = timeSlots.find((s) => s.id === e.target.value)
                        setDeliveryTimeSlotId(e.target.value)
                        setDeliveryTimeSlot(selectedSlot?.label || '')
                      }}
                      className="w-full px-4 py-2 border rounded"
                    >
                      <option value="">Select a time slot</option>
                      {timeSlots
                        .filter((slot) => slot.is_active !== false)
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.label || slot.time_slot || slot.id}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {deliveryDestinations.length > 0 && (
                  <div>
                    <label className="block mb-2">Delivery destination *</label>
                    <div className="space-y-2">
                      {deliveryDestinations.map((dest) => (
                        <label key={dest.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="deliveryDestination"
                            value={dest.id}
                            checked={deliveryDestinationId === dest.id}
                            onChange={() => setDeliveryDestinationId(dest.id)}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">{dest.name}</span>
                          <span className="text-gray-600">— {formatEgp(Number(dest.fee_egp))}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block mb-2">Full delivery address *</label>
                  <textarea
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, building, floor, landmark..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-2">Google Maps location link *</label>
                  <input
                    type="url"
                    required
                    value={deliveryMapsLink}
                    onChange={(e) => setDeliveryMapsLink(e.target.value)}
                    placeholder="Paste Google Maps link (e.g. https://maps.google.com/...)"
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
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

          {showSoldOutModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Item no longer available</h3>
                <p className="text-gray-600 mb-6">
                  Sorry, this item is sold out. Please remove it from your cart to continue.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSoldOutModal(false)
                    setError(null)
                  }}
                  className="w-full px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
