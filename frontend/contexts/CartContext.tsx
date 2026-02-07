'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: string // Unique ID for cart item
  product_id: string
  product_title: string
  product_slug: string
  product_image?: string
  base_price: number
  discount_price?: number
  quantity: number
  selected_variations: Record<string, string>
  selected_addons: string[]
  calculated_price: number // Price with variations and addons
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'calculated_price'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'id' | 'calculated_price'>) => {
    // Use discount_price if provided (it contains the calculated unit price with variations/addons)
    // Otherwise fall back to base_price
    const unitPrice = item.discount_price !== undefined ? item.discount_price : item.base_price
    
    // Calculate total price for this cart item (unit price * quantity)
    const calculatedPrice = unitPrice * item.quantity

    const newItem: CartItem = {
      ...item,
      id: `${item.product_id}-${Date.now()}-${Math.random()}`,
      calculated_price: calculatedPrice,
    }

    setItems((prev) => [...prev, newItem])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Recalculate price based on new quantity
          // Use discount_price if it contains calculated unit price, otherwise base_price
          const unitPrice = item.discount_price !== undefined ? item.discount_price : item.base_price
          return {
            ...item,
            quantity,
            calculated_price: unitPrice * quantity,
          }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.calculated_price, 0)
  }

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
