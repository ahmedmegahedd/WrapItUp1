'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const response = await api.get('/admin/products')
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/admin/products/${id}`)
      loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  async function toggleShowInAll(product: { id: string; show_in_all_collection?: boolean }) {
    const next = !product.show_in_all_collection
    try {
      await api.patch(`/admin/products/${product.id}`, { show_in_all_collection: next })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, show_in_all_collection: next } : p))
      )
    } catch (error) {
      console.error('Error updating show in all:', error)
      alert('Failed to update')
    }
  }

  const recommendedCount = products.filter((p) => p.recommended_at_checkout).length
  const MAX_RECOMMENDED = 4

  async function toggleRecommended(product: { id: string; recommended_at_checkout?: boolean }) {
    const next = !product.recommended_at_checkout
    if (next && recommendedCount >= MAX_RECOMMENDED) {
      alert(`Maximum ${MAX_RECOMMENDED} products can be recommended at checkout. Uncheck one first.`)
      return
    }
    try {
      await api.patch(`/admin/products/${product.id}`, { recommended_at_checkout: next })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, recommended_at_checkout: next } : p))
      )
    } catch (error) {
      console.error('Error updating recommended:', error)
      alert('Failed to update')
    }
  }

  const searchLower = search.trim().toLowerCase()
  const filteredProducts = searchLower
    ? products.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(searchLower) ||
          (p.slug || '').toLowerCase().includes(searchLower)
      )
    : products

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          Add Product
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search products by title or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
        {search && (
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Show in All</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">Recommended</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.discount_price ? (
                    <>
                      <span className="line-through text-gray-400">${product.base_price}</span>{' '}
                      <span className="font-semibold">${product.discount_price}</span>
                    </>
                  ) : (
                    `$${product.base_price}`
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.stock_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {(product.product_images?.length ?? 0) > 0 ? (
                    <span className="inline-flex items-center gap-1" title={`${product.product_images.length} image(s)`}>
                      <span className="font-medium">{(product.product_images?.length ?? 0)}</span>
                      <span className="text-gray-400 text-xs">pic(s)</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-sm ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!product.show_in_all_collection}
                      onChange={() => toggleShowInAll(product)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">In All</span>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!product.recommended_at_checkout}
                      onChange={() => toggleRecommended(product)}
                      className="rounded border-gray-300"
                      disabled={!product.recommended_at_checkout && recommendedCount >= MAX_RECOMMENDED}
                    />
                    <span className="text-sm text-gray-600">At checkout</span>
                  </label>
                  {recommendedCount >= MAX_RECOMMENDED && !product.recommended_at_checkout && (
                    <span className="block text-xs text-gray-400 mt-0.5">Max {MAX_RECOMMENDED}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
