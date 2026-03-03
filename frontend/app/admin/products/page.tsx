'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import Toggle from '../_components/Toggle'
import SkeletonRows from '../_components/SkeletonRows'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

const MAX_RECOMMENDED = 4

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadProducts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProducts() {
    try {
      const response = await api.get('/admin/products')
      setProducts(response.data || [])
    } catch {
      showToast('error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      showToast('success', `"${deleteTarget.title}" deleted`)
    } catch {
      showToast('error', 'Failed to delete product')
    } finally {
      setDeleteTarget(null)
    }
  }

  async function toggleShowInAll(product: any) {
    const next = !product.show_in_all_collection
    try {
      await api.patch(`/admin/products/${product.id}`, { show_in_all_collection: next })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, show_in_all_collection: next } : p)),
      )
    } catch {
      showToast('error', 'Failed to update')
    }
  }

  const recommendedCount = products.filter((p) => p.recommended_at_checkout).length

  async function toggleRecommended(product: any) {
    const next = !product.recommended_at_checkout
    if (next && recommendedCount >= MAX_RECOMMENDED) {
      showToast('error', `Max ${MAX_RECOMMENDED} checkout recommendations. Uncheck one first.`)
      return
    }
    try {
      await api.patch(`/admin/products/${product.id}`, { recommended_at_checkout: next })
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, recommended_at_checkout: next } : p)),
      )
    } catch {
      showToast('error', 'Failed to update')
    }
  }

  const searchLower = search.trim().toLowerCase()
  const filteredProducts = searchLower
    ? products.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(searchLower) ||
          (p.slug || '').toLowerCase().includes(searchLower),
      )
    : products

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1300, margin: '0 auto' }}>
      <AdminPageHeader
        title="Products"
        subtitle={loading ? undefined : `${products.length} products`}
        action={{ label: '+ Add Product', href: '/admin/products/new' }}
      />

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search by title or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
          style={{ maxWidth: 380 }}
        />
        {search && !loading && (
          <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 6 }}>
            {filteredProducts.length} of {products.length} shown
          </p>
        )}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Show in All</th>
              <th>At Checkout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} rows={5} />
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--admin-text-3)',
                    fontSize: 14,
                  }}
                >
                  {search ? 'No products match your search' : 'No products yet'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock =
                  product.stock_quantity != null && product.stock_quantity <= 5
                const imageCount = product.product_images?.length ?? 0

                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {imageCount > 0 ? (
                          <img
                            src={product.product_images[0].url}
                            alt={product.title}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 6,
                              flexShrink: 0,
                              border: '1px solid var(--admin-border)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              background: 'var(--admin-surface-2)',
                              border: '1px solid var(--admin-border)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              color: 'var(--admin-text-3)',
                            }}
                          >
                            📦
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{product.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {product.discount_price ? (
                        <div>
                          <span
                            style={{
                              textDecoration: 'line-through',
                              color: 'var(--admin-text-3)',
                              fontSize: 12,
                              marginRight: 4,
                            }}
                          >
                            E£{product.base_price}
                          </span>
                          <span style={{ fontWeight: 600 }}>E£{product.discount_price}</span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 500 }}>E£{product.base_price}</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontWeight: isLowStock ? 700 : 400,
                            color: isLowStock ? 'var(--admin-danger)' : 'var(--admin-text)',
                          }}
                        >
                          {product.stock_quantity ?? '—'}
                        </span>
                        {isLowStock && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: 'var(--admin-danger-light)',
                              color: 'var(--admin-danger)',
                              padding: '1px 5px',
                              borderRadius: 100,
                            }}
                          >
                            LOW
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <StatusBadge
                        status={product.is_active ? 'active' : 'inactive'}
                        type="product"
                      />
                    </td>

                    <td>
                      <Toggle
                        checked={!!product.show_in_all_collection}
                        onChange={() => toggleShowInAll(product)}
                      />
                    </td>

                    <td>
                      <div>
                        <Toggle
                          checked={!!product.recommended_at_checkout}
                          onChange={() => toggleRecommended(product)}
                          disabled={
                            !product.recommended_at_checkout &&
                            recommendedCount >= MAX_RECOMMENDED
                          }
                        />
                        {recommendedCount >= MAX_RECOMMENDED &&
                          !product.recommended_at_checkout && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--admin-text-3)',
                                marginTop: 3,
                              }}
                            >
                              Max {MAX_RECOMMENDED}
                            </div>
                          )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="admin-btn-ghost"
                          style={{ fontSize: 12, padding: '5px 12px' }}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: product.id, title: product.title })
                          }
                          style={{
                            fontSize: 12,
                            padding: '5px 12px',
                            background: 'none',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 'var(--admin-radius-sm)',
                            color: 'var(--admin-danger)',
                            fontFamily: 'inherit',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete product?"
        message={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
