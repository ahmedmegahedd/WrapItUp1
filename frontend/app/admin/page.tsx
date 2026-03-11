'use client'

import { useCallback, useEffect, useState } from 'react'
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
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    api.get('/admin/auth/me').then((r) => setMe(r.data?.user ?? null)).catch(() => setMe(null))
  }, [])

  const fetchAdminData = useCallback(() => {
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
        setLastUpdated(new Date().toLocaleTimeString())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
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
    fetchAdminData()
    const interval = setInterval(fetchAdminData, 30000)
    return () => clearInterval(interval)
  }, [me?.is_collaborator, fetchAdminData])

  const todayStr = new Date().toISOString().split('T')[0]

  // Card 1: orders placed today (by created_at)
  const todaysOrders = orders.filter((o) => o.created_at?.startsWith(todayStr))
  const todaysOrdersCount = todaysOrders.length

  // Card 2: pending orders
  const pendingOrders = orders.filter((o) => o.order_status === 'pending')
  const pendingCount = pendingOrders.length

  // Card 3: confirmed today
  const confirmedTodayCount = orders.filter(
    (o) => o.order_status === 'confirmed' && o.updated_at?.startsWith(todayStr),
  ).length

  // Card 4: today's revenue (orders placed today in confirmed+ statuses)
  const CONFIRMED_STATUSES = ['confirmed', 'preparing', 'out_for_delivery', 'delivered']
  const todaysRevenue = orders
    .filter((o) => o.created_at?.startsWith(todayStr) && CONFIRMED_STATUSES.includes(o.order_status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const lowStock = products.filter(
    (p) => p.is_active && p.stock_quantity != null && p.stock_quantity <= 5,
  )
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    )
    .slice(0, 5)

  // Delivery widget: by delivery_date, excluding cancelled
  const todaysDeliveries = orders.filter(
    (o) => o.delivery_date?.startsWith(todayStr) && o.order_status !== 'cancelled',
  )
  const slotMap: Record<string, any[]> = {}
  for (const o of todaysDeliveries) {
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

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: #FCD34D; box-shadow: 0 0 0 2px #FEF3C7; }
          50% { border-color: #F59E0B; box-shadow: 0 0 0 3px #FDE68A; }
        }
      `}</style>

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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 8 }}>
            {/* Card 1: Today's Orders */}
            <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s ease' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', marginTop: 12, lineHeight: 1 }}>{todaysOrdersCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Today&apos;s Orders</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>orders placed today</div>
              </div>
            </Link>

            {/* Card 2: Pending Orders */}
            <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: pendingCount > 0 ? '2px solid #FCD34D' : '1px solid #F3F4F6', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', animation: pendingCount > 0 ? 'pulse-border 2s infinite' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: pendingCount > 0 ? '#F59E0B' : '#111827', marginTop: 12, lineHeight: 1 }}>{pendingCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Pending Orders</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{pendingCount > 0 ? 'awaiting confirmation' : 'all clear'}</div>
              </div>
            </Link>

            {/* Card 3: Confirmed Today */}
            <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s ease' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', marginTop: 12, lineHeight: 1 }}>{confirmedTodayCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Confirmed Today</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>orders confirmed today</div>
              </div>
            </Link>

            {/* Card 4: Today's Revenue */}
            <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s ease' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', marginTop: 12, lineHeight: 1 }}>{formatEgp(todaysRevenue)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 6 }}>Today&apos;s Revenue</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>from confirmed orders</div>
              </div>
            </Link>
          </div>

          {lastUpdated && (
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginBottom: 20, marginTop: 4 }}>
              Auto-refreshes every 30s · Last updated: {lastUpdated}
            </p>
          )}
        </>
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
          {!loading && todaysDeliveries.length > 0 && (
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
              {todaysDeliveries.length} deliver{todaysDeliveries.length !== 1 ? 'ies' : 'y'} today
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
        ) : todaysDeliveries.length === 0 ? (
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
