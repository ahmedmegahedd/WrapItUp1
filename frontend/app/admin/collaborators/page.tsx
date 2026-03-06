'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import AdminPageHeader from '../_components/AdminPageHeader'
import SkeletonRows from '../_components/SkeletonRows'

type CollaboratorRow = {
  id: string
  brand_name: string
  admin_email: string | null
  commission_rate: number
  product_count: number
  total_commission_pending: number
  is_active: boolean
}

export default function AdminCollaboratorsPage() {
  const [list, setList] = useState<CollaboratorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingProductsCount, setPendingProductsCount] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get('/admin/collaborators'),
      api.get('/admin/products', { params: { type: 'collaborator', approvalStatus: 'pending' } }).catch(() => ({ data: [] })),
    ]).then(([collabRes, pendingRes]) => {
      setList(Array.isArray(collabRes.data) ? collabRes.data : [])
      setPendingProductsCount(Array.isArray(pendingRes.data) ? (pendingRes.data as any[]).length : 0)
    }).catch(() => setList([])).finally(() => setLoading(false))
  }, [])

  const totalPendingPayout = list.reduce((s, r) => s + (r.total_commission_pending ?? 0), 0)

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <AdminPageHeader
        title="Collaborators"
        subtitle={loading ? undefined : `${list.length} collaborators`}
        action={{ label: '+ Add Collaborator', href: '/admin/collaborators/new' }}
      />

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}>Total Collaborators</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)' }}>{list.length}</div>
        </div>
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}>Pending Products</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-accent)' }}>{pendingProductsCount}</div>
        </div>
        <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 16, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}>Commission Owed (EGP)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)' }}>{totalPendingPayout.toFixed(2)}</div>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Brand Name</th>
              <th>Admin Email</th>
              <th>Commission</th>
              <th>Products</th>
              <th>Pending Payout (EGP)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} rows={5} />
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--admin-text-3)', fontSize: 14 }}>
                  No collaborators yet
                </td>
              </tr>
            ) : (
              list.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.brand_name}</td>
                  <td style={{ color: 'var(--admin-text-2)' }}>{row.admin_email ?? '—'}</td>
                  <td>{row.commission_rate}%</td>
                  <td>{row.product_count}</td>
                  <td>{Number(row.total_commission_pending ?? 0).toFixed(2)}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: row.is_active ? 'var(--admin-success, #4A7C5C)' : 'var(--admin-text-3)' }}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/collaborators/${row.id}`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
