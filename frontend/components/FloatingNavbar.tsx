'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import api from '@/lib/api'

export default function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function loadCollections() {
      try {
        const response = await api.get('/collections')
        const activeCollections = (response.data || []).filter((c: any) => c.is_active)
        setCollections(activeCollections)
      } catch (error) {
        console.error('Error loading collections:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCollections()
  }, [])

  // Don't show navbar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* Floating Navbar - Center Bottom */}
      <nav className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
        <div className="relative">
          {/* Main Navbar Pill */}
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 backdrop-blur-sm bg-opacity-95">
            <Link
              href="/"
              className={`px-3 py-2 rounded-full text-white font-medium transition-all ${
                pathname === '/' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Home
            </Link>

            {/* Collections Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-2 rounded-full text-white font-medium transition-all flex items-center gap-1 ${
                  pathname?.startsWith('/collections') ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
                }`}
                aria-label="Collections menu"
              >
                Collections
                <svg
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 -z-10"
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-100">
                    {loading ? (
                      <div className="p-4 text-center text-gray-600">Loading...</div>
                    ) : collections.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto">
                        {collections.map((collection) => (
                          <Link
                            key={collection.id}
                            href={`/collections/${collection.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="block px-6 py-4 text-gray-900 hover:bg-pink-50 transition-colors border-b border-pink-50 last:border-b-0"
                          >
                            <div className="font-medium">{collection.name}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-600">No collections available</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <Link
              href="/about-us"
              className={`px-3 py-2 rounded-full text-white font-medium transition-all ${
                pathname === '/about-us' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
              }`}
            >
              About
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Navbar - Top */}
      <nav className="hidden md:block fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 backdrop-blur-sm bg-opacity-95">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-white font-medium transition-all ${
              pathname === '/' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
            }`}
          >
            Home
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-4 py-2 rounded-full text-white font-medium transition-all flex items-center gap-2 ${
                pathname?.startsWith('/collections') ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Collections
              <svg
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 -z-10"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-pink-100">
                  {loading ? (
                    <div className="p-4 text-center text-gray-600">Loading...</div>
                  ) : collections.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {collections.map((collection) => (
                        <Link
                          key={collection.id}
                          href={`/collections/${collection.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block px-6 py-4 text-gray-900 hover:bg-pink-50 transition-colors border-b border-pink-50 last:border-b-0"
                        >
                          <div className="font-medium">{collection.name}</div>
                          {collection.description && (
                            <div className="text-sm text-gray-600 mt-1">{collection.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-600">No collections available</div>
                  )}
                </div>
              </>
            )}
          </div>

          <Link
            href="/about-us"
            className={`px-4 py-2 rounded-full text-white font-medium transition-all ${
              pathname === '/about-us' ? 'bg-white bg-opacity-30' : 'hover:bg-white hover:bg-opacity-20'
            }`}
          >
            About Us
          </Link>
        </div>
      </nav>
    </>
  )
}
