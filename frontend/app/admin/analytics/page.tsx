'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import SkeletonRows from '../_components/SkeletonRows'
import AdminPageHeader from '../_components/AdminPageHeader'
import { SkeletonCards } from '../_components/SkeletonRows'

type TimeRange = 'today' | 'last_7_days' | 'last_30_days'

interface ProductClick {
  product_id: string
  product_title: string
  product_slug: string
  click_count: number
}

interface DailyUsers {
  today: number
  last7Days: number
  last30Days: number
  dailyBreakdown: Record<string, number>
}

interface LiveUsers {
  count: number
  activeSeconds: number
}

interface ConversionCounts {
  orders: number
  sessions: number
  conversionRate: number
}

interface BestSellingProduct {
  rank: number
  product_id: string
  product_title: string
  product_slug: string
  orders_count: number
  total_revenue: number
  total_quantity: number
}

interface SalesSummary {
  totalOrders: number
  totalSales: number
}

interface PeakOrderHour {
  hour: number
  hourLabel: string
  count: number
}

const RANGE_LABELS: Record<TimeRange, string> = {
  today: 'Today',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('last_30_days')
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)

  const [productClicks, setProductClicks] = useState<ProductClick[]>([])
  const [dailyUsers, setDailyUsers] = useState<DailyUsers | null>(null)
  const [liveUsers, setLiveUsers] = useState<LiveUsers | null>(null)
  const [conversionCounts, setConversionCounts] = useState<ConversionCounts | null>(null)
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [peakOrderHours, setPeakOrderHours] = useState<PeakOrderHour[]>([])

  const loadAllData = useCallback(
    async (isReload = false) => {
      if (isReload) setReloading(true)
      else setLoading(true)

      try {
        const [
          clicksRes,
          dailyUsersRes,
          liveUsersRes,
          conversionRes,
          bestSellingRes,
          salesRes,
          peakHoursRes,
        ] = await Promise.all([
          api.get('/analytics/product-clicks'),
          api.get(`/analytics/daily-users?timeRange=${timeRange}`),
          api.get('/analytics/live-users?activeSeconds=60'),
          api.get(`/analytics/conversion-counts?timeRange=${timeRange}`),
          api.get('/analytics/best-selling-products'),
          api.get(`/analytics/sales-summary?timeRange=${timeRange}`),
          api.get('/analytics/peak-order-hours'),
        ])

        setProductClicks(clicksRes.data || [])
        setDailyUsers(dailyUsersRes.data)
        setLiveUsers(liveUsersRes.data)
        setConversionCounts(conversionRes.data)
        setBestSellingProducts(bestSellingRes.data || [])
        setSalesSummary(salesRes.data)
        setPeakOrderHours(peakHoursRes.data || [])
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
        setReloading(false)
      }
    },
    [timeRange],
  )

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Auto-refresh live users every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/analytics/live-users?activeSeconds=60')
        setLiveUsers(res.data)
      } catch {
        // silent
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatEgp = (n: number) =>
    `E£ ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

  const rangeLabel = RANGE_LABELS[timeRange]

  const sectionStyle: React.CSSProperties = {
    background: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius)',
    boxShadow: 'var(--admin-shadow)',
    overflow: 'hidden',
    marginBottom: 16,
  }

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderBottom: '1px solid var(--admin-border)',
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--admin-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header with controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="admin-input"
            style={{ background: 'var(--admin-surface)', width: 'auto', padding: '8px 12px' }}
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <button
            type="button"
            onClick={() => loadAllData(true)}
            disabled={reloading}
            className="admin-btn-ghost"
          >
            {reloading ? 'Reloading…' : '↻ Reload'}
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      {loading ? (
        <div style={{ marginBottom: 16 }}>
          <SkeletonCards count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 14, marginBottom: 16 }}>
          {[
            {
              label: 'Total Sales',
              value: formatEgp(salesSummary?.totalSales ?? 0),
              sub: rangeLabel,
              icon: '💰',
            },
            {
              label: 'Total Orders',
              value: String(salesSummary?.totalOrders ?? 0),
              sub: rangeLabel,
              icon: '📦',
            },
            {
              label: 'Live Users',
              value: String(liveUsers?.count ?? 0),
              sub: 'Active in last 60s',
              icon: '🟢',
              live: true,
            },
            {
              label: 'Conversion Rate',
              value: `${(conversionCounts?.conversionRate ?? 0).toFixed(1)}%`,
              sub: `${conversionCounts?.orders ?? 0} orders / ${conversionCounts?.sessions ?? 0} sessions`,
              icon: '📈',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--admin-surface)',
                border: `1px solid ${card.live ? 'var(--admin-success)' : 'var(--admin-border)'}`,
                borderRadius: 'var(--admin-radius)',
                padding: '18px 20px',
                boxShadow: 'var(--admin-shadow)',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--admin-text)', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', marginTop: 6 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 3 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily users */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Daily Users</div>
        <div
          className="grid grid-cols-3"
          style={{ gap: 1, background: 'var(--admin-border)' }}
        >
          {[
            { label: 'Today', value: dailyUsers?.today ?? 0 },
            { label: 'Last 7 Days', value: dailyUsers?.last7Days ?? 0 },
            { label: 'Last 30 Days', value: dailyUsers?.last30Days ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '20px',
                textAlign: 'center',
                background: 'var(--admin-surface)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)' }}>
                {loading ? '—' : stat.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--admin-text-2)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best selling products */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span>Best Selling Products</span>
          <span style={{ fontSize: 12, color: 'var(--admin-text-3)', fontWeight: 400 }}>All time</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>Rank</th>
              <th>Product</th>
              <th style={{ textAlign: 'right' }}>Orders</th>
              <th style={{ textAlign: 'right' }}>Revenue</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={5} rows={5} />
            ) : bestSellingProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--admin-text-3)', fontSize: 14 }}>
                  No sales data available
                </td>
              </tr>
            ) : (
              bestSellingProducts.map((product) => (
                <tr key={product.product_id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>#{product.rank}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{product.product_title}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{product.orders_count}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatEgp(product.total_revenue)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--admin-text-2)' }}>{product.total_quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product clicks */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Product Clicks</div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ textAlign: 'right' }}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={2} rows={5} />
            ) : productClicks.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--admin-text-3)', fontSize: 14 }}>
                  No clicks tracked yet
                </td>
              </tr>
            ) : (
              productClicks.map((click) => (
                <tr key={click.product_id}>
                  <td style={{ fontWeight: 500 }}>{click.product_title}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{click.click_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Peak order hours */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span>Peak Order Hours</span>
          <span style={{ fontSize: 12, color: 'var(--admin-text-3)', fontWeight: 400 }}>Last 7 days</span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="admin-skeleton" style={{ height: 24, marginBottom: 10, borderRadius: 4 }} />
            ))
          ) : peakOrderHours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--admin-text-3)', fontSize: 14 }}>
              No order data available
            </div>
          ) : (
            peakOrderHours.slice(0, 10).map((hour) => {
              const pct = (hour.count / peakOrderHours[0].count) * 100
              return (
                <div
                  key={hour.hour}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}
                >
                  <div style={{ width: 90, fontSize: 13, color: 'var(--admin-text-2)', flexShrink: 0 }}>
                    {hour.hourLabel}
                  </div>
                  <div style={{ flex: 1, height: 22, background: 'var(--admin-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'var(--admin-accent)',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 8,
                        transition: 'width 0.4s ease',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{hour.count}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
