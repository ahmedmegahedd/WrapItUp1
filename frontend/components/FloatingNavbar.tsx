'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FloatingNavbar() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-[var(--pink-primary)]">
          Wrap It Up
        </Link>
        <Link
          href="/admin/login"
          className="text-sm text-gray-600 hover:text-[var(--pink-primary)] transition-colors"
        >
          Admin
        </Link>
      </div>
    </nav>
  )
}
