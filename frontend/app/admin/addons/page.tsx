'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import SkeletonRows from '../_components/SkeletonRows'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadAddons()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAddons() {
    try {
      const response = await api.get('/addons?includeInactive=true')
      setAddons(response.data || [])
    } catch {
      showToast('error', 'Failed to load add-ons')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/addons/${deleteTarget.id}`)
      setAddons((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      showToast('success', `"${deleteTarget.name}" deleted`)
    } catch {
      showToast('error', 'Failed to delete add-on')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
      <AdminPageHeader
        title="Add-ons"
        subtitle={loading ? undefined : `${addons.length} add-ons`}
        action={{ label: '+ New Add-on', href: '/admin/addons/new' }}
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={4} rows={4} />
            ) : addons.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--admin-text-3)',
                    fontSize: 14,
                  }}
                >
                  No add-ons yet. Create your first add-on to get started.
                </td>
              </tr>
            ) : (
              addons.map((addon) => (
                <tr key={addon.id}>
                  <td style={{ fontWeight: 500 }}>{addon.name}</td>
                  <td style={{ fontWeight: 600 }}>
                    E£{parseFloat(addon.price || 0).toFixed(2)}
                  </td>
                  <td>
                    <StatusBadge
                      status={addon.is_active ? 'active' : 'inactive'}
                      type="product"
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/addons/${addon.id}`}
                        className="admin-btn-ghost"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: addon.id, name: addon.name })}
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
        title="Delete add-on?"
        message={`"${deleteTarget?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
