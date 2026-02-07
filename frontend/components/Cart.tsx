'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

const ShoppingBagIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

export default function Cart() {
  const router = useRouter()
  const { getItemCount } = useCart()

  const handleClick = () => {
    router.push('/cart')
  }

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-white hover:text-gray-100 transition-colors"
      aria-label="Shopping cart"
    >
      <ShoppingBagIcon />
      {getItemCount() > 0 && (
        <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {getItemCount()}
        </span>
      )}
    </button>
  )
}
