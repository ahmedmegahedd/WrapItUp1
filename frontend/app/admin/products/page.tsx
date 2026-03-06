'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import ApprovalStatusBadge from '../_components/ApprovalStatusBadge'
import Toggle from '../_components/Toggle'
import SkeletonRows from '../_components/SkeletonRows'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

const MAX_RECOMMENDED = 4

type Tab = 'wrapitup' | 'collaborator'

export default function AdminProductsPage() {
  const [me, setMe] = useState<{ is_super_admin?: boolean; is_collaborator?: boolean } | null>(null)
  const [wrapitupProducts, setWrapitupProducts] = useState<any[]>([])
  const [collaboratorProducts, setCollaboratorProducts] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('wrapitup')
  const [loading, setLoading] = useState(true)
  const [loadingTab, setLoadingTab] = useState(false)
  const [search, setSearch] = useState('')
  const [collaboratorFilter, setCollaboratorFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { toasts, showToast, dismissToast } = useToast()

  const isCollaborator = me?.is_collaborator === true
  const isSuperAdmin = me?.is_super_admin === true
  const showWrapitupTab = isSuperAdmin
  const showCollaboratorTab = true

  useEffect(() => {
    api.get('/admin/auth/me').then((r) => setMe(r.data?.user ?? null)).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [showWrapitupTab, isCollaborator])

  async function loadProducts() {
    setLoading(true)
    try {
      if (isCollaborator) {
        const res = await api.get('/admin/products')
        setCollaboratorProducts(Array.isArray(res.data) ? res.data : [])
        setWrapitupProducts([])
      } else {
        const [wrapRes, collabRes, pendingRes] = await Promise.all([
          api.get('/admin/products', { params: { type: 'wrapitup' } }),
          api.get('/admin/products', { params: { type: 'collaborator' } }),
          api.get('/admin/products', { params: { type: 'collaborator', approvalStatus: 'pending' } }),
        ])
        setWrapitupProducts(Array.isArray(wrapRes.data) ? wrapRes.data : [])
        setCollaboratorProducts(Array.isArray(collabRes.data) ? collabRes.data : [])
        setPendingCount(Array.isArray(pendingRes.data) ? pendingRes.data.length : 0)
      }
    } catch {
      showToast('error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  async function loadTab(tab: Tab) {
    setLoadingTab(true)
    try {
      if (tab === 'wrapitup') {
        const res = await api.get('/admin/products', { params: { type: 'wrapitup' } })
        setWrapitupProducts(Array.isArray(res.data) ? res.data : [])
      } else {
        const params: Record<string, string> = { type: 'collaborator' }
        if (approvalFilter) params.approvalStatus = approvalFilter
        const res = await api.get('/admin/products', { params })
        setCollaboratorProducts(Array.isArray(res.data) ? res.data : [])
      }
    } catch {
      showToast('error', 'Failed to load products')
    } finally {
      setLoadingTab(false)
    }
  }

  useEffect(() => {
    if (!showWrapitupTab || activeTab !== 'collaborator') return
    loadTab('collaborator')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalFilter, collaboratorFilter])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`)
      setWrapitupProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setCollaboratorProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
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
      setWrapitupProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, show_in_all_collection: next } : p)))
      setCollaboratorProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, show_in_all_collection: next } : p)))
    } catch {
      showToast('error', 'Failed to update')
    }
  }

  const recommendedCount = [...wrapitupProducts, ...collaboratorProducts].filter((p) => p.recommended_at_checkout).length

  async function toggleRecommended(product: any) {
    const next = !product.recommended_at_checkout
    if (next && recommendedCount >= MAX_RECOMMENDED) {
      showToast('error', `Max ${MAX_RECOMMENDED} checkout recommendations. Uncheck one first.`)
      return
    }
    try {
      await api.patch(`/admin/products/${product.id}`, { recommended_at_checkout: next })
      setWrapitupProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, recommended_at_checkout: next } : p)))
      setCollaboratorProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, recommended_at_checkout: next } : p)))
    } catch {
      showToast('error', 'Failed to update')
    }
  }

  async function approveProduct(id: string) {
    try {
      await api.patch(`/admin/products/${id}/approve`)
      setCollaboratorProducts((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: 'approved' } : p)))
      setPendingCount((c) => Math.max(0, c - 1))
      showToast('success', 'Product approved')
    } catch {
      showToast('error', 'Failed to approve')
    }
  }

  async function activateProduct(id: string) {
    try {
      await api.patch(`/admin/products/${id}/activate`)
      setCollaboratorProducts((prev) => prev.map((p) => (p.id === id ? { ...p, approval_status: 'active', is_active: true } : p)))
      showToast('success', 'Product activated')
    } catch {
      showToast('error', 'Failed to activate')
    }
  }

  async function rejectProduct() {
    if (!rejectTarget) return
    try {
      await api.patch(`/admin/products/${rejectTarget.id}/reject`, { reason: rejectReason })
      setCollaboratorProducts((prev) => prev.map((p) => (p.id === rejectTarget.id ? { ...p, approval_status: 'rejected', is_active: false } : p)))
      setPendingCount((c) => Math.max(0, c - 1))
      showToast('success', 'Product rejected')
    } catch {
      showToast('error', 'Failed to reject')
    } finally {
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  const productsForTab = activeTab === 'wrapitup' ? wrapitupProducts : collaboratorProducts
  const searchLower = search.trim().toLowerCase()
  const filteredProducts = searchLower
    ? productsForTab.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(searchLower) ||
          (p.slug || '').toLowerCase().includes(searchLower) ||
          (p.collaborators?.brand_name || '').toLowerCase().includes(searchLower),
      )
    : productsForTab

  const collaboratorsList = collaboratorProducts
    .map((p) => p.collaborators?.brand_name)
    .filter(Boolean)
  const uniqueCollaborators = Array.from(new Set(collaboratorsList)) as string[]
  const filteredByCollaborator = collaboratorFilter
    ? filteredProducts.filter((p) => (p.collaborators?.brand_name || '') === collaboratorFilter)
    : filteredProducts

  const list = isCollaborator ? filteredProducts : activeTab === 'wrapitup' ? filteredProducts : filteredByCollaborator

  const imgUrl = (p: any) => p.product_images?.[0]?.image_url || p.product_images?.[0]?.url

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1300, margin: '0 auto' }}>
      <AdminPageHeader
        title="Products"
        subtitle={loading ? undefined : `${productsForTab.length} products`}
        action={isCollaborator || activeTab === 'collaborator' ? undefined : { label: '+ Add Product', href: '/admin/products/new' }}
      />

      {showWrapitupTab && showCollaboratorTab && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--admin-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('wrapitup')}
            className="admin-tab"
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'wrapitup' ? 'var(--admin-accent)' : 'var(--admin-text-2)',
              borderBottom: activeTab === 'wrapitup' ? '2px solid var(--admin-accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            WrapItUp Products ({wrapitupProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collaborator')}
            className="admin-tab"
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'collaborator' ? 'var(--admin-accent)' : 'var(--admin-text-2)',
              borderBottom: activeTab === 'collaborator' ? '2px solid var(--admin-accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            Collaborator Products ({collaboratorProducts.length}
            {pendingCount > 0 && (
              <span style={{ marginLeft: 6, color: 'var(--admin-accent)', fontWeight: 700 }}>• {pendingCount} pending</span>
            )}
            )
          </button>
        </div>
      )}

      {activeTab === 'collaborator' && isSuperAdmin && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <select
            value={collaboratorFilter}
            onChange={(e) => setCollaboratorFilter(e.target.value)}
            className="admin-input"
            style={{ minWidth: 160 }}
          >
            <option value="">All collaborators</option>
            {uniqueCollaborators.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="admin-input"
            style={{ minWidth: 160 }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search by title, slug or collaborator…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
          style={{ maxWidth: 380 }}
        />
        {search && !loading && (
          <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 6 }}>
            {list.length} of {productsForTab.length} shown
          </p>
        )}
      </div>

      {/* Desktop table */}
      <div className="admin-table-wrapper admin-desktop-only">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              {(!showWrapitupTab || activeTab === 'collaborator') && <th>Approval</th>}
              {activeTab === 'collaborator' && isSuperAdmin && <th>Collaborator</th>}
              {activeTab === 'wrapitup' && <th>Status</th>}
              {activeTab === 'wrapitup' && <th>Show in All</th>}
              {activeTab === 'wrapitup' && <th>At Checkout</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading || loadingTab ? (
              <SkeletonRows cols={activeTab === 'collaborator' ? 8 : 7} rows={5} />
            ) : list.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--admin-text-3)', fontSize: 14 }}
                >
                  {search || collaboratorFilter || approvalFilter ? 'No products match filters' : 'No products yet'}
                </td>
              </tr>
            ) : (
              list.map((product) => {
                const isLowStock = product.stock_quantity != null && product.stock_quantity <= 5
                const isCollaboratorProduct = !!product.collaborator_id
                const canDelete = !isCollaboratorProduct || product.approval_status === 'pending' || product.approval_status === 'rejected'

                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {imgUrl(product) ? (
                          <img
                            src={imgUrl(product)}
                            alt={product.title}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--admin-border)' }}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--admin-text-3)' }}>
                            📦
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{product.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>{product.slug}</div>
                          {product.approval_status === 'rejected' && product.product_rejection_reason && (
                            <div style={{ fontSize: 11, color: 'var(--admin-danger)', marginTop: 4 }} title={product.product_rejection_reason}>
                              Rejection: {product.product_rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {product.discount_price ? (
                        <div>
                          <span style={{ textDecoration: 'line-through', color: 'var(--admin-text-3)', fontSize: 12, marginRight: 4 }}>E£{product.base_price}</span>
                          <span style={{ fontWeight: 600 }}>E£{product.discount_price}</span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 500 }}>E£{product.base_price}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: isLowStock ? 700 : 400, color: isLowStock ? 'var(--admin-danger)' : 'var(--admin-text)' }}>
                          {product.stock_quantity ?? '—'}
                        </span>
                        {isLowStock && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--admin-danger-light)', color: 'var(--admin-danger)', padding: '1px 5px', borderRadius: 100 }}>LOW</span>
                        )}
                      </div>
                    </td>
                    {(!showWrapitupTab || activeTab === 'collaborator') && (
                      <td>
                        {product.approval_status ? <ApprovalStatusBadge status={product.approval_status} /> : <StatusBadge status={product.is_active ? 'active' : 'inactive'} type="product" />}
                      </td>
                    )}
                    {activeTab === 'collaborator' && isSuperAdmin && (
                      <td style={{ fontSize: 13, color: 'var(--admin-text-2)' }}>{product.collaborators?.brand_name ?? '—'}</td>
                    )}
                    {activeTab === 'wrapitup' && (
                      <>
                        <td><StatusBadge status={product.is_active ? 'active' : 'inactive'} type="product" /></td>
                        <td><Toggle checked={!!product.show_in_all_collection} onChange={() => toggleShowInAll(product)} /></td>
                        <td>
                          <div>
                            <Toggle checked={!!product.recommended_at_checkout} onChange={() => toggleRecommended(product)} disabled={!product.recommended_at_checkout && recommendedCount >= MAX_RECOMMENDED} />
                            {recommendedCount >= MAX_RECOMMENDED && !product.recommended_at_checkout && <div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 3 }}>Max {MAX_RECOMMENDED}</div>}
                          </div>
                        </td>
                      </>
                    )}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <Link href={`/admin/products/${product.id}`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Edit</Link>
                        {isSuperAdmin && isCollaboratorProduct && (
                          <>
                            {product.approval_status === 'pending' && <button type="button" onClick={() => approveProduct(product.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--admin-accent)' }}>Approve</button>}
                            {product.approval_status === 'approved' && <button type="button" onClick={() => activateProduct(product.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--admin-success, #4A7C5C)' }}>Activate</button>}
                            {(product.approval_status === 'pending' || product.approval_status === 'approved') && <button type="button" onClick={() => setRejectTarget({ id: product.id, title: product.title })} style={{ fontSize: 12, padding: '5px 12px', background: 'none', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', color: 'var(--admin-danger)', fontFamily: 'inherit', cursor: 'pointer' }}>Reject</button>}
                          </>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => setDeleteTarget({ id: product.id, title: product.title })} style={{ fontSize: 12, padding: '5px 12px', background: 'none', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', color: 'var(--admin-danger)', fontFamily: 'inherit', cursor: 'pointer' }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="admin-mobile-only">
        {loading || loadingTab ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="admin-skeleton" style={{ height: 88, borderRadius: 'var(--admin-radius)' }} />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--admin-text-3)', fontSize: 14 }}>
            {search || collaboratorFilter || approvalFilter ? 'No products match filters' : 'No products yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((product) => {
              const isLowStock = product.stock_quantity != null && product.stock_quantity <= 5
              const isCollaboratorProduct = !!product.collaborator_id
              const canDelete = !isCollaboratorProduct || product.approval_status === 'pending' || product.approval_status === 'rejected'
              return (
                <div
                  key={product.id}
                  style={{
                    background: 'var(--admin-surface)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius)',
                    padding: 14,
                    boxShadow: 'var(--admin-shadow)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {imgUrl(product) ? (
                      <img src={imgUrl(product)} alt={product.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--admin-border)' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 6 }}>{product.slug}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {product.discount_price ? `E£${product.discount_price}` : `E£${product.base_price}`}
                        </span>
                        <span style={{ fontSize: 12, color: isLowStock ? 'var(--admin-danger)' : 'var(--admin-text-3)', fontWeight: isLowStock ? 700 : 400 }}>
                          Stock: {product.stock_quantity ?? '—'}{isLowStock ? ' ⚠️' : ''}
                        </span>
                        {product.approval_status
                          ? <ApprovalStatusBadge status={product.approval_status} />
                          : <StatusBadge status={product.is_active ? 'active' : 'inactive'} type="product" />
                        }
                      </div>
                      {product.approval_status === 'rejected' && product.product_rejection_reason && (
                        <div style={{ fontSize: 11, color: 'var(--admin-danger)', marginTop: 4 }}>
                          Reason: {product.product_rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <Link href={`/admin/products/${product.id}`} className="admin-btn-ghost" style={{ fontSize: 13, padding: '8px 16px', flex: 1, justifyContent: 'center' }}>Edit</Link>
                    {isSuperAdmin && isCollaboratorProduct && product.approval_status === 'pending' && (
                      <button type="button" onClick={() => approveProduct(product.id)} className="admin-btn-ghost" style={{ fontSize: 13, padding: '8px 14px', color: 'var(--admin-accent)' }}>Approve</button>
                    )}
                    {isSuperAdmin && isCollaboratorProduct && product.approval_status === 'approved' && (
                      <button type="button" onClick={() => activateProduct(product.id)} className="admin-btn-ghost" style={{ fontSize: 13, padding: '8px 14px', color: 'var(--admin-success, #4A7C5C)' }}>Activate</button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => setDeleteTarget({ id: product.id, title: product.title })} style={{ fontSize: 13, padding: '8px 14px', background: 'none', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', color: 'var(--admin-danger)', fontFamily: 'inherit' }}>Delete</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB — Add Product (mobile only) */}
      {!isCollaborator && activeTab !== 'collaborator' && (
        <Link href="/admin/products/new" className="admin-fab admin-mobile-only">+</Link>
      )}

      <ConfirmModal open={!!deleteTarget} title="Delete product?" message={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <ConfirmModal
        open={!!rejectTarget}
        title="Reject product?"
        message={
          <div>
            <p>Reject &quot;{rejectTarget?.title}&quot;? The collaborator will see this reason.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)" rows={3} className="admin-input" style={{ width: '100%', marginTop: 12, resize: 'vertical' }} />
          </div>
        }
        confirmLabel="Reject"
        onConfirm={rejectProduct}
        onCancel={() => { setRejectTarget(null); setRejectReason('') }}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
