'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import SkeletonRows from '../_components/SkeletonRows'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

const ORDER_STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_OPTIONS = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  const loadOrders = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (activeTab) params.status = activeTab
      if (paymentFilter) params.paymentStatus = paymentFilter
      const response = await api.get('/admin/orders', { params })
      setOrders(response.data || [])
    } catch {
      showToast('error', 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [activeTab, paymentFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true)
    loadOrders()
  }, [loadOrders])

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { order_status: newStatus })
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o)),
      )
      showToast('success', 'Order status updated')
    } catch {
      showToast('error', 'Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatEgp = (n: number) =>
    `E£ ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

  const formatDate = (d: string) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—'

  const searchLower = search.trim().toLowerCase()
  const filteredOrders = searchLower
    ? orders.filter(
        (o) =>
          (o.order_number || '').toLowerCase().includes(searchLower) ||
          (o.customer_name || '').toLowerCase().includes(searchLower) ||
          (o.customer_email || '').toLowerCase().includes(searchLower),
      )
    : orders

  const countByStatus = (status: string) =>
    status === '' ? orders.length : orders.filter((o) => o.order_status === status).length

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <AdminPageHeader title="Orders" subtitle={loading ? undefined : `${orders.length} total`} />

      {/* Refund notice */}
      <div
        style={{
          background: 'var(--admin-warning-light)',
          border: '1px solid #E5C56A',
          borderRadius: 'var(--admin-radius-sm)',
          padding: '12px 16px',
          fontSize: 13,
          color: 'var(--admin-warning)',
          marginBottom: 20,
        }}
      >
        <strong>Refunds &amp; cancellations:</strong> Refund requests must be handled via WhatsApp
        or Instagram DMs. Admin can cancel orders by changing order status — no automatic refunds
        from this panel.
      </div>

      {/* Status tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)',
          padding: 4,
          marginBottom: 16,
          overflowX: 'auto',
        }}
      >
        {ORDER_STATUSES.map((tab) => {
          const isActive = activeTab === tab.value
          const count = countByStatus(tab.value)
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--admin-radius-sm)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                background: isActive ? 'var(--admin-accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--admin-text-2)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.label}
              {!loading && (
                <span
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--admin-surface-2)',
                    color: isActive ? 'white' : 'var(--admin-text-3)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 100,
                    minWidth: 22,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search + payment filter */}
      <div
        className="grid grid-cols-1 sm:grid-cols-[1fr_180px]"
        style={{ gap: 10, marginBottom: 16 }}
      >
        <input
          type="search"
          placeholder="Search by order #, customer name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
        />
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="admin-input"
          style={{ background: 'var(--admin-surface)' }}
        >
          <option value="">All payments</option>
          <option value="pending">Payment pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Payment failed</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Delivery</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} rows={6} />
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--admin-text-3)',
                    fontSize: 14,
                  }}
                >
                  {search ? 'No orders match your search' : 'No orders found'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    style={{
                      background:
                        expandedId === order.id ? 'var(--admin-accent-light)' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 700 }}>{order.order_number}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{order.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                        {order.customer_email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{formatDate(order.delivery_date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                        {order.delivery_time_slot}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatEgp(order.total)}</td>
                    <td>
                      <StatusBadge status={order.payment_status} type="payment" />
                    </td>
                    <td>
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{
                          fontSize: 12,
                          padding: '4px 8px',
                          border: '1px solid var(--admin-border)',
                          borderRadius: 'var(--admin-radius-sm)',
                          background: 'var(--admin-surface)',
                          color: 'var(--admin-text)',
                          fontFamily: 'inherit',
                          opacity: updatingId === order.id ? 0.5 : 1,
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === order.id ? null : order.id)
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 16,
                          color: 'var(--admin-text-3)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          transition: 'transform 0.15s ease',
                          transform:
                            expandedId === order.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                        title="Toggle details"
                      >
                        ▾
                      </button>
                    </td>
                  </tr>
                  {expandedId === order.id && (
                    <tr key={`${order.id}-details`}>
                      <td
                        colSpan={7}
                        style={{
                          background: 'var(--admin-accent-light)',
                          borderTop: '1px solid var(--admin-border)',
                          padding: '16px 20px',
                        }}
                      >
                        <OrderDetails order={order} formatEgp={formatEgp} />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              padding: 20,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: 14, marginBottom: 12, borderRadius: 4, width: `${65 + i * 8}%` }}
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--admin-text-3)',
              fontSize: 14,
            }}
          >
            {search ? 'No orders match your search' : 'No orders found'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius)',
                overflow: 'hidden',
                boxShadow: 'var(--admin-shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--admin-border)',
                  background: 'var(--admin-surface-2)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 14 }}>#{order.order_number}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <StatusBadge status={order.payment_status} type="payment" />
                  <StatusBadge status={order.order_status} type="order" />
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{order.customer_name}</div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 2 }}>
                  {order.customer_email}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                    {formatDate(order.delivery_date)} · {order.delivery_time_slot}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{formatEgp(order.total)}</div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    borderTop: '1px solid var(--admin-border)',
                    paddingTop: 12,
                  }}
                >
                  <select
                    value={order.order_status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className="admin-input"
                    style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    style={{ fontSize: 12, padding: '7px 12px', whiteSpace: 'nowrap' }}
                  >
                    {expandedId === order.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>
              {expandedId === order.id && (
                <div
                  style={{
                    borderTop: '1px solid var(--admin-border)',
                    padding: '14px 16px',
                    background: 'var(--admin-accent-light)',
                  }}
                >
                  <OrderDetails order={order} formatEgp={formatEgp} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function OrderDetails({
  order,
  formatEgp,
}: {
  order: any
  formatEgp: (n: number) => string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '14px 32px', fontSize: 13 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <DetailRow label="Phone" value={order.customer_phone || '—'} />
        {order.delivery_destination_name && (
          <DetailRow label="Destination" value={order.delivery_destination_name} />
        )}
        {order.delivery_address && (
          <DetailRow label="Address" value={order.delivery_address} />
        )}
        {order.delivery_maps_link && (
          <DetailRow
            label="Maps"
            value={
              <a
                href={order.delivery_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}
              >
                Open in Maps ↗
              </a>
            }
          />
        )}
        {order.card_message && (
          <DetailRow
            label="Card message"
            value={<em style={{ color: 'var(--admin-text-2)' }}>{order.card_message}</em>}
          />
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--admin-text-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          Items
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(order.order_items || []).map((item: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '6px 0',
                borderBottom: '1px solid var(--admin-border)',
              }}
            >
              <span>
                {item.product_title}
                {item.quantity > 1 && (
                  <span style={{ color: 'var(--admin-text-3)' }}> ×{item.quantity}</span>
                )}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {formatEgp(item.line_total)}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            fontSize: 12,
            color: 'var(--admin-text-3)',
          }}
        >
          {order.delivery_fee_egp != null && Number(order.delivery_fee_egp) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery fee</span>
              <span>{formatEgp(order.delivery_fee_egp)}</span>
            </div>
          )}
          {order.discount_amount_egp > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--admin-success)',
              }}
            >
              <span>Discount</span>
              <span>−{formatEgp(order.discount_amount_egp)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              color: 'var(--admin-text)',
              fontSize: 13,
              marginTop: 4,
              paddingTop: 4,
              borderTop: '1px solid var(--admin-border)',
            }}
          >
            <span>Total</span>
            <span>{formatEgp(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span
        style={{
          color: 'var(--admin-text-3)',
          fontWeight: 500,
          minWidth: 90,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--admin-text)' }}>{value}</span>
    </div>
  )
}
