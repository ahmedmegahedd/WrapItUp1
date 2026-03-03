'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import SkeletonRows from '../_components/SkeletonRows'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadRewards()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRewards() {
    try {
      const response = await api.get('/admin/rewards')
      setRewards(response.data || [])
    } catch {
      showToast('error', 'Failed to load rewards')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/rewards/${deleteTarget.id}`)
      setRewards((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      showToast('success', `"${deleteTarget.title}" deleted`)
    } catch {
      showToast('error', 'Failed to delete reward')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
      <AdminPageHeader
        title="Points &amp; Rewards"
        subtitle={loading ? undefined : `${rewards.length} rewards`}
        action={{ label: '+ New Reward', href: '/admin/rewards/new' }}
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 60 }} />
              <th>Title</th>
              <th>Points required</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={5} rows={4} />
            ) : rewards.length === 0 ? (
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
                  No rewards yet. Create one to let customers redeem points.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward.id}>
                  <td>
                    {reward.image_url ? (
                      <div
                        style={{
                          position: 'relative',
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '1px solid var(--admin-border)',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={reward.image_url}
                          alt=""
                          fill
                          sizes="40px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: 'var(--admin-surface-2)',
                          border: '1px solid var(--admin-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                        }}
                      >
                        🎁
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{reward.title}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--admin-accent)',
                      }}
                    >
                      {reward.points_required}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-3)', marginLeft: 4 }}>
                      pts
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      status={reward.is_active ? 'active' : 'inactive'}
                      type="product"
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/admin/rewards/${reward.id}`}
                        className="admin-btn-ghost"
                        style={{ fontSize: 12, padding: '5px 12px' }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: reward.id, title: reward.title })
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
        title="Delete reward?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
