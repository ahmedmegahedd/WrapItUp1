'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import StatusBadge from './_components/StatusBadge'
import { SkeletonCards } from './_components/SkeletonRows'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export default function AdminDashboard() {
  const [me, setMe] = useState<{ is_collaborator?: boolean; collaborator_brand_name?: string | null } | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [lowStockMaterialsCount, setLowStockMaterialsCount] = useState(0)
  const [shoppingListCount, setShoppingListCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collabProfile, setCollabProfile] = useState<any>(null)
  const [collabEarnings, setCollabEarnings] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/auth/me').then((r) => setMe(r.data?.user ?? null)).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    if (me?.is_collaborator) {
      Promise.all([
        api.get('/admin/collaborators/me'),
        api.get('/admin/collaborators/me/earnings'),
        api.get('/admin/orders'),
        api.get('/admin/products'),
      ])
        .then(([profileRes, earningsRes, ordersRes, productsRes]) => {
          setCollabProfile(profileRes.data)
          setCollabEarnings(earningsRes.data)
          setOrders(ordersRes.data || [])
          setProducts(productsRes.data || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
      return
    }
    Promise.all([
      api.get('/admin/orders'),
      api.get('/admin/products'),
      api.get('/admin/inventory/low-stock').catch(() => ({ data: [] })),
      api.get('/admin/inventory/shopping-list').catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, productsRes, lowRes, shopRes]) => {
        setOrders(ordersRes.data || [])
        setProducts(productsRes.data || [])
        setLowStockMaterialsCount(Array.isArray(lowRes.data) ? lowRes.data.length : 0)
        setShoppingListCount(Array.isArray(shopRes.data) ? shopRes.data.length : 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [me?.is_collaborator])

  const today = new Date().toISOString().split('T')[0]
  const todaysOrders = orders.filter((o) => o.delivery_date?.startsWith(today))
  const pendingOrders = orders.filter((o) => o.order_status === 'pending')
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((s, o) => s + parseFloat(o.total || 0), 0)
  const lowStock = products.filter(
    (p) => p.is_active && p.stock_quantity != null && p.stock_quantity <= 5,
  )
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    )
    .slice(0, 5)

  // Group today's deliveries by time slot
  const slotMap: Record<string, any[]> = {}
  for (const o of todaysOrders) {
    const slot = o.delivery_time_slot || 'Unspecified'
    if (!slotMap[slot]) slotMap[slot] = []
    slotMap[slot].push(o)
  }

  const formatEgp = (n: number) => `E£ ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  if (me?.is_collaborator) {
    const myProducts = products || []
    const pending = myProducts.filter((p) => p.approval_status === 'pending').length
    const active = myProducts.filter((p) => p.approval_status === 'active').length
    const rejected = myProducts.filter((p) => p.approval_status === 'rejected').length
    const summary = collabEarnings?.summary ?? {}
    const recentOrders = [...(orders || [])].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5)
    return (
      <div style={{ padding: '24px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--admin-text)', margin: 0, lineHeight: 1.2 }}>
            Welcome, {collabProfile?.brand_name ?? me?.collaborator_brand_name ?? 'Collaborator'} 👋
          </h1>
          <p style={{ color: 'var(--admin-text-3)', marginTop: 6, fontSize: 14 }}>{formatToday()}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <Link href="/admin/products" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, textDecoration: 'none', display: 'block', boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)' }}>{loading ? '—' : myProducts.length}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Total Products</div>
          </Link>
          <Link href="/admin/products" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, textDecoration: 'none', display: 'block', boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-accent)' }}>{loading ? '—' : pending}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Pending Review</div>
          </Link>
          <Link href="/admin/products" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, textDecoration: 'none', display: 'block', boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-success, #4A7C5C)' }}>{loading ? '—' : active}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Active</div>
          </Link>
          <Link href="/admin/products" style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, textDecoration: 'none', display: 'block', boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-danger)' }}>{loading ? '—' : rejected}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Rejected</div>
          </Link>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)' }}>{loading ? '—' : formatEgp(summary.total_commission ?? 0)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Total Earned</div>
          </div>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 18, boxShadow: 'var(--admin-shadow)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-accent)' }}>{loading ? '—' : formatEgp(summary.pending_payout ?? 0)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>Pending Payout</div>
          </div>
        </div>
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', boxShadow: 'var(--admin-shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>Recent Orders (with your products)</span>
            <Link href="/admin/orders" style={{ fontSize: 13, color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 16 }}>Loading…</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 14 }}>No orders yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                      <td><div style={{ fontSize: 13 }}>{order.customer_name}</div><div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>{order.customer_email}</div></td>
                      <td style={{ fontWeight: 600 }}>{formatEgp(order.total)}</td>
                      <td><StatusBadge status={order.payment_status} type="payment" /></td>
                      <td><StatusBadge status={order.order_status} type="order" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      label: "Today's Deliveries",
      value: loading ? '—' : String(todaysOrders.length),
      sub: loading ? '' : `${todaysOrders.filter((o) => o.order_status === 'delivered').length} delivered`,
      href: '/admin/orders',
      icon: '📦',
      highlight: false,
    },
    {
      label: 'Pending Orders',
      value: loading ? '—' : String(pendingOrders.length),
      sub: loading ? '' : pendingOrders.length > 0 ? 'Needs attention' : 'All clear',
      href: '/admin/orders',
      icon: '⏳',
      highlight: !loading && pendingOrders.length > 0,
    },
    {
      label: 'Total Revenue',
      value: loading ? '—' : formatEgp(totalRevenue),
      sub: loading ? '' : `${orders.filter((o) => o.payment_status === 'paid').length} paid orders`,
      href: '/admin/analytics',
      icon: '💰',
      highlight: false,
    },
    {
      label: 'Low Stock',
      value: loading ? '—' : String(lowStock.length),
      sub: loading ? '' : lowStock.length > 0 ? 'Items ≤ 5 units' : 'All well stocked',
      href: '/admin/products',
      icon: '⚠️',
      highlight: !loading && lowStock.length > 0,
    },
  ]

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--admin-text)', margin: 0, lineHeight: 1.2 }}>
          {getGreeting()} 👋
        </h1>
        <p style={{ color: 'var(--admin-text-3)', marginTop: 6, fontSize: 14 }}>{formatToday()}</p>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div style={{ marginBottom: 28 }}>
          <SkeletonCards count={4} />
        </div>
      ) : (
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: 14, marginBottom: 28 }}
        >
          {metricCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              style={{
                background: 'var(--admin-surface)',
                border: `1px solid ${card.highlight ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                borderRadius: 'var(--admin-radius)',
                padding: '18px 20px',
                textDecoration: 'none',
                display: 'block',
                boxShadow: card.highlight
                  ? '0 0 0 3px var(--admin-accent-light)'
                  : 'var(--admin-shadow)',
                transition: 'transform 0.1s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 10 }}>{card.icon}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: card.highlight ? 'var(--admin-accent)' : 'var(--admin-text)',
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--admin-text)',
                  marginTop: 6,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 3 }}>
                {card.sub}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Inventory & Shopping List cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 14, marginBottom: 28 }}
      >
        <Link
          href="/admin/inventory"
          style={{
            background: lowStockMaterialsCount > 0 ? 'var(--admin-warning-light)' : 'var(--admin-surface)',
            border: `1px solid ${lowStockMaterialsCount > 0 ? 'var(--admin-warning)' : 'var(--admin-border)'}`,
            borderRadius: 'var(--admin-radius)',
            padding: '18px 20px',
            textDecoration: 'none',
            display: 'block',
            boxShadow: 'var(--admin-shadow)',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)', lineHeight: 1 }}>
            {loading ? '—' : lowStockMaterialsCount}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>
            Low Stock (Materials)
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 3 }}>
            {loading ? '' : lowStockMaterialsCount > 0 ? 'Materials at or below threshold' : 'All good'}
          </div>
        </Link>
        <Link
          href="/admin/inventory/shopping-list"
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            padding: '18px 20px',
            textDecoration: 'none',
            display: 'block',
            boxShadow: 'var(--admin-shadow)',
          }}
        >
          <div style={{ fontSize: 20, marginBottom: 10 }}>🛒</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)', lineHeight: 1 }}>
            {loading ? '—' : shoppingListCount}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>
            Shopping List
          </div>
          <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 3 }}>
            Suggested items to buy
          </div>
        </Link>
      </div>

      {/* Middle row: Recent orders + Quick actions */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_220px]"
        style={{ gap: 14, marginBottom: 14, alignItems: 'start' }}
      >
        {/* Recent orders table */}
        <div
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            boxShadow: 'var(--admin-shadow)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--admin-border)',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>
              Recent Orders
            </span>
            <Link
              href="/admin/orders"
              style={{ fontSize: 13, color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '16px 20px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="admin-skeleton"
                  style={{ height: 14, marginBottom: 12, borderRadius: 4, width: `${70 + (i % 3) * 10}%` }}
                />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--admin-text-3)',
                fontSize: 14,
              }}
            >
              No orders yet
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="admin-desktop-only" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                        <td>
                          <div style={{ fontSize: 13 }}>{order.customer_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                            {order.customer_email}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatEgp(order.total)}</td>
                        <td>
                          <StatusBadge status={order.payment_status} type="payment" />
                        </td>
                        <td>
                          <StatusBadge status={order.order_status} type="order" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="admin-mobile-only" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentOrders.map((order) => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--admin-surface-2)', borderRadius: 'var(--admin-radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>#{order.order_number}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 1 }}>{order.customer_name}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{formatEgp(order.total)}</span>
                      <StatusBadge status={order.order_status} type="order" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            boxShadow: 'var(--admin-shadow)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--admin-border)',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--admin-text)',
            }}
          >
            Quick Actions
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: '+ New Product', href: '/admin/products/new', primary: true },
              { label: 'Manage Orders', href: '/admin/orders', primary: false },
              { label: 'Add Collection', href: '/admin/collections/new', primary: false },
              { label: 'Promo Codes', href: '/admin/promo-codes', primary: false },
              { label: 'Delivery Settings', href: '/admin/delivery-settings', primary: false },
              { label: 'Analytics', href: '/admin/analytics', primary: false },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: 'block',
                  padding: '9px 14px',
                  borderRadius: 'var(--admin-radius-sm)',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: action.primary ? 'var(--admin-accent)' : 'transparent',
                  color: action.primary ? 'white' : 'var(--admin-text-2)',
                  transition: 'background 0.12s ease, color 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!action.primary) {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--admin-surface-2)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--admin-text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!action.primary) {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--admin-text-2)'
                  }
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Today's delivery schedule */}
      <div
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)',
          boxShadow: 'var(--admin-shadow)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderBottom: '1px solid var(--admin-border)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>
            Today&apos;s Delivery Schedule
          </span>
          {!loading && todaysOrders.length > 0 && (
            <span
              style={{
                background: 'var(--admin-accent-light)',
                color: 'var(--admin-accent)',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 100,
              }}
            >
              {todaysOrders.length} order{todaysOrders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '16px 20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="admin-skeleton"
                style={{ height: 13, marginBottom: 10, borderRadius: 4, width: `${60 + i * 15}%` }}
              />
            ))}
          </div>
        ) : todaysOrders.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--admin-text-3)',
              fontSize: 14,
            }}
          >
            No deliveries scheduled for today
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            {Object.entries(slotMap)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([slot, slotOrders]) => (
                <div key={slot} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--admin-text-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}
                  >
                    {slot}{' '}
                    <span style={{ color: 'var(--admin-text-3)', textTransform: 'none', fontWeight: 500 }}>
                      — {slotOrders.length} order{slotOrders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {slotOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          background: 'var(--admin-surface-2)',
                          borderRadius: 'var(--admin-radius-sm)',
                          fontSize: 13,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontWeight: 700, minWidth: 70, color: 'var(--admin-text)' }}>
                          #{order.order_number}
                        </span>
                        <span style={{ flex: 1, minWidth: 120, color: 'var(--admin-text-2)' }}>
                          {order.customer_name}
                        </span>
                        {order.delivery_destination_name && (
                          <span style={{ color: 'var(--admin-text-3)', fontSize: 12 }}>
                            📍 {order.delivery_destination_name}
                          </span>
                        )}
                        <StatusBadge status={order.order_status} type="order" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
