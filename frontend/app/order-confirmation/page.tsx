'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('orderNumber')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/orders/number/${orderNumber}`)
        setOrder(response.data)
      } catch (error) {
        console.error('Error loading order:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 md:pt-40 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-gray-800">Thank you for your order</p>
          </div>

          <div className="border-t border-b py-6 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-800">Order Number</span>
              <span className="font-semibold text-gray-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-800">Status</span>
              <span className="font-semibold capitalize text-gray-900">{order.order_status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-800">Payment Status</span>
              <span className="font-semibold capitalize text-gray-900">{order.payment_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-800">Total</span>
              <span className="font-semibold text-xl">E£ {order.total.toFixed(2)} (EGP)</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-3">Order Items</h2>
            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-semibold">{item.product_title}</div>
                    <div className="text-sm text-gray-800">
                      Quantity: {item.quantity}
                    </div>
                    {item.selected_variations && Object.keys(item.selected_variations).length > 0 && (
                      <div className="text-sm text-gray-800 mt-1">
                        {Object.entries(item.selected_variations).map(([key, value]) => (
                          <div key={key}>{key}: {value as string}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold">E£ {item.line_total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-3">Delivery Information</h2>
            <div className="space-y-2 text-gray-700">
              <div>
                <span className="font-semibold">Date:</span>{' '}
                {new Date(order.delivery_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div>
                <span className="font-semibold">Time Slot:</span> {order.delivery_time_slot}
              </div>
              {order.delivery_destination_name && (
                <div>
                  <span className="font-semibold">Destination:</span> {order.delivery_destination_name}
                </div>
              )}
              {order.delivery_address && (
                <div>
                  <span className="font-semibold">Address:</span> {order.delivery_address}
                </div>
              )}
              {order.delivery_maps_link && (
                <div>
                  <span className="font-semibold">Maps:</span>{' '}
                  <a href={order.delivery_maps_link} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                    View location
                  </a>
                </div>
              )}
              {order.card_message && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="font-semibold mb-1">Card Message:</div>
                  <div>{order.card_message}</div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
