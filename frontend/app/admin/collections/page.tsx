'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import SkeletonRows from '../_components/SkeletonRows'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadCollections()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCollections() {
    try {
      const response = await api.get('/admin/collections')
      setCollections(response.data || [])
    } catch {
      showToast('error', 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/collections/${deleteTarget.id}`)
      setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      showToast('success', `"${deleteTarget.name}" deleted`)
    } catch {
      showToast('error', 'Failed to delete collection')
    } finally {
      setDeleteTarget(null)
    }
  }

  const searchLower = search.trim().toLowerCase()
  const filteredCollections = searchLower
    ? collections.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(searchLower) ||
          (c.slug || '').toLowerCase().includes(searchLower),
      )
    : collections

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <AdminPageHeader
        title="Collections"
        subtitle={loading ? undefined : `${collections.length} collections`}
        action={{ label: '+ Add Collection', href: '/admin/collections/new' }}
      />

      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
          style={{ maxWidth: 360 }}
        />
        {search && !loading && (
          <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 6 }}>
            {filteredCollections.length} of {collections.length} shown
          </p>
        )}
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={5} rows={4} />
            ) : filteredCollections.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--admin-text-3)',
                    fontSize: 14,
                  }}
                >
                  {search ? 'No collections match your search' : 'No collections yet'}
                </td>
              </tr>
            ) : (
              filteredCollections.map((collection) => (
                <tr key={collection.id}>
                  <td style={{ fontWeight: 500 }}>{collection.name}</td>
                  <td style={{ color: 'var(--admin-text-3)', fontSize: 13 }}>{collection.slug}</td>
                  <td>
                    <span
                      style={{
                        background: 'var(--admin-surface-2)',
                        color: 'var(--admin-text-2)',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 100,
                      }}
                    >
                      {collection.collection_products?.length || 0}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      status={collection.is_active ? 'active' : 'inactive'}
                      type="product"
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/collections/${collection.id}`}
                        className="admin-btn-ghost"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: collection.id, name: collection.name })
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete collection?"
        message={`"${deleteTarget?.name}" will be permanently deleted. Products will not be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
