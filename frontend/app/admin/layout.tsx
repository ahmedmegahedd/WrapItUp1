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
  const [menuOpen, setMenuOpen] = useState(false)

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

  const pages = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/collections', label: 'Collections' },
    { href: '/admin/navbar-collections', label: 'Navbar' },
    { href: '/admin/addons', label: 'Add-ons' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/delivery-settings', label: 'Delivery' },
    { href: '/admin/delivery-destinations', label: 'Destinations' },
    { href: '/admin/promo-codes', label: 'Promo Codes' },
    { href: '/admin/rewards', label: 'Points & Rewards' },
    { href: '/admin/homepage', label: 'App hero' },
    { href: '/admin/analytics', label: 'Analytics' },
  ]

  const currentPage = pages.find((p) => pathname === p.href || (p.href !== '/admin' && pathname?.startsWith(p.href)))
  const currentLabel = currentPage?.label ?? 'Pages'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="text-2xl font-bold">
              Admin Panel
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-left min-w-[140px]"
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <span className="flex-1">{currentLabel}</span>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden="true"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                      {pages.map((page) => (
                        <Link
                          key={page.href}
                          href={page.href}
                          onClick={() => setMenuOpen(false)}
                          className={`block px-4 py-2.5 text-sm hover:bg-gray-100 ${
                            pathname === page.href || (page.href !== '/admin' && pathname?.startsWith(page.href))
                              ? 'bg-gray-50 font-medium text-gray-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {page.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('admin_token')
                  router.push('/admin/login')
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
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
