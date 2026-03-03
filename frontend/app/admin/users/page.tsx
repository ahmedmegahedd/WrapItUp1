'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

type UserRow = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  created_at: string
  last_activity: string | null
  total_orders: number
  points_balance: number
}

type OrderItem = {
  product_title: string
  quantity: number
  line_total: number
  selected_variations?: Record<string, string>
  selected_addons?: Array<{ name: string; price: number }>
}

type OrderDetail = {
  id: string
  order_number: string
  created_at: string
  order_status: string
  payment_status: string
  payment_method: string | null
  total: number
  points_earned: number
  delivery_date: string
  delivery_time_slot: string
  order_items: OrderItem[]
}

type UserDetail = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  created_at: string
  updated_at: string
  last_activity: string | null
  total_orders: number
  points_balance: number
  orders: OrderDetail[]
  cart: null
}

const PAGE_SIZE = 20

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function UserDetailDrawer({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get(`/admin/users/${userId}`)
      .then((res) => {
        if (!cancelled) setDetail(res.data)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <div className="p-6 border-t bg-gray-50">
        <div className="text-gray-500">Loading user details…</div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6 border-t bg-gray-50">
        <div className="text-red-600">Failed to load user.</div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-sm text-pink-600 hover:underline"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 border-t bg-gray-50 space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-900">User details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Full name</span>
          <p className="font-medium">{detail.full_name ?? '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">Email</span>
          <p className="font-medium">{detail.email}</p>
        </div>
        <div>
          <span className="text-gray-500">Phone</span>
          <p className="font-medium">{detail.phone ?? '—'}</p>
        </div>
        <div>
          <span className="text-gray-500">User ID</span>
          <p className="font-mono text-xs break-all">{detail.id}</p>
        </div>
        <div>
          <span className="text-gray-500">Account created</span>
          <p className="font-medium">{formatDate(detail.created_at)}</p>
        </div>
        <div>
          <span className="text-gray-500">Last activity</span>
          <p className="font-medium">{formatDate(detail.last_activity)}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Cart snapshot</h4>
        <p className="text-gray-500 text-sm">
          Cart is stored on the device. Not available in admin.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Orders</h4>
        {detail.orders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {detail.orders.map((order) => (
              <li
                key={order.id}
                className="border rounded-lg bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOrderId((id) =>
                      id === order.id ? null : order.id
                    )
                  }
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="font-medium">
                    {order.order_number} · {formatDate(order.created_at)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      order.order_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.order_status === 'out_for_delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.order_status}
                  </span>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      expandedOrderId === order.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedOrderId === order.id && (
                  <div className="px-3 pb-3 pt-0 text-sm border-t">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <span className="text-gray-500">Payment</span>
                      <span>
                        {order.payment_method ?? '—'} · {order.payment_status}
                      </span>
                      <span className="text-gray-500">Total</span>
                      <span>{order.total.toFixed(2)} EGP</span>
                      <span className="text-gray-500">Points earned</span>
                      <span>{order.points_earned}</span>
                      <span className="text-gray-500">Delivery</span>
                      <span>
                        {order.delivery_date} {order.delivery_time_slot}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500">Items</span>
                      <ul className="mt-1 space-y-1">
                        {order.order_items.map((item, i) => (
                          <li key={i}>
                            {item.product_title} × {item.quantity} —{' '}
                            {item.line_total.toFixed(2)} EGP
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      }
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/admin/users', { params })
      setUsers(res.data?.data ?? [])
      setTotal(res.data?.total ?? 0)
    } catch (e) {
      console.error(e)
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = search.trim() ? { search: search.trim() } : {}
      const res = await api.get('/admin/users/export', { params })
      const rows = res.data ?? []
      if (rows.length === 0) {
        alert('No users to export.')
        return
      }
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(
        rows.map((r: Record<string, unknown>) => ({
          'User ID': r.user_id,
          'Full Name': r.full_name ?? '',
          Email: r.email,
          Phone: r.phone ?? '',
          'Created At': r.created_at ?? '',
          'Last Activity': r.last_activity ?? '',
          'Total Orders': r.total_orders ?? 0,
          'Points Balance': r.points_balance ?? 0,
          'Cart Items': r.cart_items ?? 'Not available (stored on device)',
          'Orders Summary': r.orders_summary ?? '',
        }))
      )
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Users')
      XLSX.writeFile(wb, `wrap-it-up-users-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e) {
      console.error(e)
      alert('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Users</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block font-semibold mb-2">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email, or phone"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 font-semibold text-gray-700 w-8"></th>
                    <th className="p-3 font-semibold text-gray-700">User ID</th>
                    <th className="p-3 font-semibold text-gray-700">Full Name</th>
                    <th className="p-3 font-semibold text-gray-700">Email</th>
                    <th className="p-3 font-semibold text-gray-700">Phone</th>
                    <th className="p-3 font-semibold text-gray-700">Last Activity</th>
                    <th className="p-3 font-semibold text-gray-700">Orders</th>
                    <th className="p-3 font-semibold text-gray-700">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <Fragment key={user.id}>
                      <tr className="border-b hover:bg-gray-50/50">
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedUserId((id) =>
                                id === user.id ? null : user.id
                              )
                            }
                            className="p-1 rounded hover:bg-gray-200"
                            aria-label={expandedUserId === user.id ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className={`w-5 h-5 transition-transform ${
                                expandedUserId === user.id ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="p-3 font-mono text-xs max-w-[120px] truncate" title={user.id}>
                          {user.id.slice(0, 8)}…
                        </td>
                        <td className="p-3">{user.full_name ?? '—'}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.phone ?? '—'}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(user.last_activity)}
                        </td>
                        <td className="p-3">{user.total_orders}</td>
                        <td className="p-3">{user.points_balance}</td>
                      </tr>
                      {expandedUserId === user.id && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <UserDetailDrawer
                              userId={user.id}
                              onClose={() => setExpandedUserId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                {total} user{total !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
