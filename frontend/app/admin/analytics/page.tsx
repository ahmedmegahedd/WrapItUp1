'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('last_30_days')
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)

  // Data states
  const [productClicks, setProductClicks] = useState<ProductClick[]>([])
  const [dailyUsers, setDailyUsers] = useState<DailyUsers | null>(null)
  const [liveUsers, setLiveUsers] = useState<LiveUsers | null>(null)
  const [conversionCounts, setConversionCounts] = useState<ConversionCounts | null>(null)
  const [bestSellingProducts, setBestSellingProducts] = useState<BestSellingProduct[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [peakOrderHours, setPeakOrderHours] = useState<PeakOrderHour[]>([])

  const loadAllData = useCallback(async (isReload = false) => {
    if (isReload) {
      setReloading(true)
    } else {
      setLoading(true)
    }

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
  }, [timeRange])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Auto-refresh live users every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/analytics/live-users?activeSeconds=60')
        setLiveUsers(res.data)
      } catch (error) {
        console.error('Error refreshing live users:', error)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleReload = () => {
    loadAllData(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <button
            onClick={handleReload}
            disabled={reloading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {reloading ? 'Reloading...' : 'Reload'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Sales</div>
          <div className="text-3xl font-bold text-gray-900">
            ${salesSummary?.totalSales.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-500 mt-1">{timeRange.replace('_', ' ')}</div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-gray-900">
            {salesSummary?.totalOrders || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">{timeRange.replace('_', ' ')}</div>
        </div>

        {/* Live Users */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Live Users</div>
          <div className="text-3xl font-bold text-gray-900">{liveUsers?.count || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Active now (last 60s)</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-gray-900">
            {conversionCounts?.conversionRate.toFixed(1) || '0.0'}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {conversionCounts?.orders || 0} orders / {conversionCounts?.sessions || 0} sessions
          </div>
        </div>
      </div>

      {/* Daily Users */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{dailyUsers?.today || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Today</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{dailyUsers?.last7Days || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Last 7 Days</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{dailyUsers?.last30Days || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Last 30 Days</div>
          </div>
        </div>
      </div>

      {/* Best Selling Products */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Best Selling Products</h2>
          <button
            onClick={handleReload}
            disabled={reloading}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {reloading ? 'Reloading...' : 'Reload'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Product
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Orders
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {bestSellingProducts.length > 0 ? (
                bestSellingProducts.map((product) => (
                  <tr key={product.product_id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900 font-medium">#{product.rank}</td>
                    <td className="py-3 px-4 text-gray-900">{product.product_title}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{product.orders_count}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      ${product.total_revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {product.total_quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No sales data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Clicks */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Clicks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Product
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {productClicks.length > 0 ? (
                productClicks.map((click) => (
                  <tr key={click.product_id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{click.product_title}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{click.click_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-gray-500">
                    No clicks tracked yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peak Order Hours */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Peak Order Hours (Last 7 Days)</h2>
        <div className="space-y-2">
          {peakOrderHours.length > 0 ? (
            peakOrderHours.slice(0, 10).map((hour) => (
              <div key={hour.hour} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-700">{hour.hourLabel}</div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-gray-900 rounded-full h-6 flex items-center justify-end pr-2"
                      style={{
                        width: `${(hour.count / peakOrderHours[0].count) * 100}%`,
                      }}
                    >
                      <span className="text-xs text-white font-medium">{hour.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">No order data available</div>
          )}
        </div>
      </div>
    </div>
  )
}
