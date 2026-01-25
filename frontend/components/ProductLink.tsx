'use client'

import Link from 'next/link'
import { trackProductClick } from '@/lib/analytics'

interface ProductLinkProps {
  href: string
  productId: string
  className?: string
  children: React.ReactNode
}

export default function ProductLink({ href, productId, className, children }: ProductLinkProps) {
  const handleClick = () => {
    trackProductClick(productId)
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
