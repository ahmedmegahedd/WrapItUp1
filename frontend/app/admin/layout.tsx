'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      if (pathname === '/admin/login') {
        setLoading(false)
        return
      }

      const token = localStorage.getItem('admin_token')
      if (!token) {
        router.push('/admin/login')
        return
      }

      try {
        await api.get('/admin/auth/me')
        setAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [pathname, router])

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="text-2xl font-bold">
              Admin Panel
            </Link>
            <div className="flex gap-6">
              <Link href="/admin" className="hover:underline">Dashboard</Link>
              <Link href="/admin/products" className="hover:underline">Products</Link>
              <Link href="/admin/collections" className="hover:underline">Collections</Link>
              <Link href="/admin/addons" className="hover:underline">Add-ons</Link>
              <Link href="/admin/orders" className="hover:underline">Orders</Link>
              <Link href="/admin/analytics" className="hover:underline">Analytics</Link>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  router.push('/admin/login')
                }}
                className="hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
