'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    collections: 0,
    orders: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const [productsRes, collectionsRes, ordersRes] = await Promise.all([
          api.get('/admin/products'),
          api.get('/admin/collections'),
          api.get('/admin/orders'),
        ])

        const orders = ordersRes.data || []
        const totalRevenue = orders
          .filter((o: any) => o.payment_status === 'paid')
          .reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)

        setStats({
          products: productsRes.data?.length || 0,
          collections: collectionsRes.data?.length || 0,
          orders: orders.length,
          totalRevenue,
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.products}</div>
          <div className="text-gray-800">Products</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.collections}</div>
          <div className="text-gray-800">Collections</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.orders}</div>
          <div className="text-gray-800">Orders</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-gray-800">Total Revenue</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Manage Products</h2>
          <p className="text-gray-800">Add, edit, or archive products</p>
        </Link>
        <Link
          href="/admin/collections"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Manage Collections</h2>
          <p className="text-gray-800">Organize products into collections</p>
        </Link>
        <Link
          href="/admin/orders"
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900">View Orders</h2>
          <p className="text-gray-800">Track and manage orders</p>
        </Link>
      </div>
    </div>
  )
}
