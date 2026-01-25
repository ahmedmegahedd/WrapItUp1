'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
  })

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function loadOrders() {
    try {
      const params: any = {}
      if (filters.status) params.status = filters.status
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus

      const response = await api.get('/admin/orders', { params })
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { order_status: newStatus })
      loadOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Order Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-2">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">{order.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{order.customer_name}</div>
                  <div className="text-sm text-gray-600">{order.customer_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>{new Date(order.delivery_date).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-600">{order.delivery_time_slot}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-semibold">${order.total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.order_status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      const details = `
Order #: ${order.order_number}
Customer: ${order.customer_name}
Email: ${order.customer_email}
Phone: ${order.customer_phone || 'N/A'}
Delivery: ${new Date(order.delivery_date).toLocaleDateString()} ${order.delivery_time_slot}
Total: $${order.total.toFixed(2)}
Payment: ${order.payment_status}
Status: ${order.order_status}

Items:
${order.order_items?.map((item: any) => 
  `- ${item.product_title} x${item.quantity} - $${item.line_total.toFixed(2)}`
).join('\n')}

${order.card_message ? `Card Message: ${order.card_message}` : ''}
                      `
                      alert(details)
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
