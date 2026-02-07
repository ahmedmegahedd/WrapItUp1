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
