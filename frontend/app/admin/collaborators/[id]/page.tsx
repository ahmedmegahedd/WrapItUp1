'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import AdminPageHeader from '../../_components/AdminPageHeader'
import ApprovalStatusBadge from '../../_components/ApprovalStatusBadge'
import ConfirmModal from '../../_components/ConfirmModal'
import Toast, { useToast } from '../../_components/Toast'

type Tab = 'profile' | 'products' | 'earnings'

export default function CollaboratorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [collaborator, setCollaborator] = useState<any>(null)
  const [earnings, setEarnings] = useState<{ records: any[]; summary: any } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payoutStatus, setPayoutStatus] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [markPaidNote, setMarkPaidNote] = useState('')
  const [profileForm, setProfileForm] = useState({ brand_name: '', contact_email: '', contact_phone: '', commission_rate: '', notes: '', is_active: true })
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    api.get(`/admin/collaborators/${id}`).then((res) => {
      setCollaborator(res.data)
      setProfileForm({
        brand_name: res.data?.brand_name ?? '',
        contact_email: res.data?.contact_email ?? '',
        contact_phone: res.data?.contact_phone ?? '',
        commission_rate: String(res.data?.commission_rate ?? 0),
        notes: res.data?.notes ?? '',
        is_active: res.data?.is_active !== false,
      })
    }).catch(() => router.push('/admin/collaborators')).finally(() => setLoading(false))
  }, [id, router])

  useEffect(() => {
    if (activeTab !== 'earnings' || !id) return
    const params: Record<string, string> = {}
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (payoutStatus) params.payoutStatus = payoutStatus
    api.get(`/admin/collaborators/${id}/earnings`, { params }).then((res) => setEarnings(res.data)).catch(() => setEarnings({ records: [], summary: {} }))
  }, [id, activeTab, dateFrom, dateTo, payoutStatus])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch(`/admin/collaborators/${id}`, {
        brand_name: profileForm.brand_name.trim(),
        contact_email: profileForm.contact_email.trim() || undefined,
        contact_phone: profileForm.contact_phone.trim() || undefined,
        commission_rate: parseFloat(profileForm.commission_rate) || 0,
        notes: profileForm.notes.trim() || undefined,
        is_active: profileForm.is_active,
      })
      setCollaborator(res.data)
      showToast('success', 'Profile updated')
    } catch {
      showToast('error', 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function approveProduct(pid: string) {
    try {
      await api.patch(`/admin/products/${pid}/approve`)
      setCollaborator((c: any) => ({ ...c, products: c.products?.map((p: any) => p.id === pid ? { ...p, approval_status: 'approved' } : p) ?? [] }))
      showToast('success', 'Product approved')
    } catch { showToast('error', 'Failed to approve') }
  }

  async function activateProduct(pid: string) {
    try {
      await api.patch(`/admin/products/${pid}/activate`)
      setCollaborator((c: any) => ({ ...c, products: c.products?.map((p: any) => p.id === pid ? { ...p, approval_status: 'active', is_active: true } : p) ?? [] }))
      showToast('success', 'Product activated')
    } catch { showToast('error', 'Failed to activate') }
  }

  async function rejectProduct(pid: string, reason: string) {
    try {
      await api.patch(`/admin/products/${pid}/reject`, { reason })
      setCollaborator((c: any) => ({ ...c, products: c.products?.map((p: any) => p.id === pid ? { ...p, approval_status: 'rejected', is_active: false } : p) ?? [] }))
      showToast('success', 'Product rejected')
    } catch { showToast('error', 'Failed to reject') }
  }

  async function markPaidConfirm() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await api.post(`/admin/collaborators/${id}/mark-paid`, { recordIds: ids, note: markPaidNote })
      setEarnings((e) => {
        if (!e) return null
        const paidAmount = e.records
          .filter((r) => ids.includes(r.id))
          .reduce((s, r) => s + parseFloat(r.commission_amount || 0), 0)
        return {
          ...e,
          records: e.records.map((r) => (ids.includes(r.id) ? { ...r, payout_status: 'paid' } : r)),
          summary: {
            ...e.summary,
            pending_payout: (e.summary.pending_payout ?? 0) - paidAmount,
            paid_payout: (e.summary.paid_payout ?? 0) + paidAmount,
          },
        }
      })
      setSelectedIds(new Set())
      setMarkPaidOpen(false)
      setMarkPaidNote('')
      showToast('success', `${ids.length} record(s) marked as paid`)
    } catch {
      showToast('error', 'Failed to mark as paid')
    }
  }

  function exportEarnings() {
    if (!earnings?.records?.length) return
    const headers = ['Order #', 'Date', 'Product', 'Qty', 'Sale Amount', 'Commission %', 'Commission Amount', 'WrapItUp Amount', 'Status']
    const rows = earnings.records.map((r) => [
      r.order_id?.slice(0, 8) ?? '',
      r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
      r.product_name ?? '',
      r.quantity ?? '',
      parseFloat(r.subtotal ?? 0).toFixed(2),
      parseFloat(r.commission_rate ?? 0).toFixed(2),
      parseFloat(r.commission_amount ?? 0).toFixed(2),
      parseFloat(r.wrapitup_amount ?? 0).toFixed(2),
      r.payout_status ?? '',
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `collaborator-${id}-earnings.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    showToast('success', 'Export downloaded')
  }

  function toggleSelect(recordId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  if (loading || !collaborator) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--admin-text-3)' }}>Loading…</p>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'products', label: 'Products' },
    { key: 'earnings', label: 'Earnings & Commission' },
  ]

  const inputStyle: React.CSSProperties = { border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', background: 'var(--admin-surface)', color: 'var(--admin-text)', width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 6 }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <AdminPageHeader
        title={collaborator.brand_name}
        breadcrumbs={[{ label: 'Collaborators', href: '/admin/collaborators' }, { label: collaborator.brand_name }]}
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--admin-border)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === t.key ? 'var(--admin-accent)' : 'var(--admin-text-2)',
              borderBottom: activeTab === t.key ? '2px solid var(--admin-accent)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={saveProfile} style={{ maxWidth: 480 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 20, marginBottom: 16 }}>
            <div className="admin-section-header">Profile</div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-3)', marginBottom: 16 }}>Admin: {collaborator.admin_email ?? '—'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Brand name *</label>
                <input type="text" value={profileForm.brand_name} onChange={(e) => setProfileForm((f) => ({ ...f, brand_name: e.target.value }))} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Contact email</label>
                <input type="email" value={profileForm.contact_email} onChange={(e) => setProfileForm((f) => ({ ...f, contact_email: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact phone</label>
                <input type="text" value={profileForm.contact_phone} onChange={(e) => setProfileForm((f) => ({ ...f, contact_phone: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Commission rate (%)</label>
                <input type="number" min={0} max={100} step={0.01} value={profileForm.commission_rate} onChange={(e) => setProfileForm((f) => ({ ...f, commission_rate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={profileForm.notes} onChange={(e) => setProfileForm((f) => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={profileForm.is_active} onChange={(e) => setProfileForm((f) => ({ ...f, is_active: e.target.checked }))} />
                <span style={labelStyle}>Active</span>
              </label>
            </div>
          </div>
          <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </form>
      )}

      {activeTab === 'products' && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(collaborator.products ?? []).length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-text-3)' }}>No products</td></tr>
              ) : (
                (collaborator.products ?? []).map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} style={{ fontWeight: 500, color: 'var(--admin-accent)' }}>{p.title}</Link>
                    </td>
                    <td><ApprovalStatusBadge status={p.approval_status || 'pending'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/admin/products/${p.id}`} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Edit</Link>
                        {p.approval_status === 'pending' && <button type="button" onClick={() => approveProduct(p.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Approve</button>}
                        {p.approval_status === 'approved' && <button type="button" onClick={() => activateProduct(p.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>Activate</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input" />
            <select value={payoutStatus} onChange={(e) => setPayoutStatus(e.target.value)} className="admin-input" style={{ minWidth: 120 }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {earnings?.summary && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 12, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>Total Sales</div>
                <div style={{ fontWeight: 700 }}>E£ {(earnings.summary.total_subtotal ?? 0).toFixed(2)}</div>
              </div>
              <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 12, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>Total Commission</div>
                <div style={{ fontWeight: 700 }}>E£ {(earnings.summary.total_commission ?? 0).toFixed(2)}</div>
              </div>
              <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 12, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>Pending Payout</div>
                <div style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>E£ {(earnings.summary.pending_payout ?? 0).toFixed(2)}</div>
              </div>
              <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', padding: 12, minWidth: 140 }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-3)' }}>Paid Out</div>
                <div style={{ fontWeight: 700 }}>E£ {(earnings.summary.paid_payout ?? 0).toFixed(2)}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={() => setMarkPaidOpen(true)} className="admin-btn-primary" disabled={selectedIds.size === 0}>
              Mark selected as paid ({selectedIds.size})
            </button>
            <button type="button" onClick={exportEarnings} className="admin-btn-ghost">Export to CSV</button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={earnings?.records?.length ? selectedIds.size === earnings.records.filter((r) => r.payout_status === 'pending').length : false}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set((earnings?.records ?? []).filter((r) => r.payout_status === 'pending').map((r) => r.id)))
                        else setSelectedIds(new Set())
                      }}
                    />
                  </th>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Sale</th>
                  <th>Commission %</th>
                  <th>Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!earnings?.records?.length) ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-text-3)' }}>No records</td></tr>
                ) : (
                  earnings.records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.payout_status === 'pending' && <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} />}</td>
                      <td style={{ fontSize: 12 }}>{r.order_id?.slice(0, 8)}…</td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      <td>{r.product_name}</td>
                      <td>{r.quantity}</td>
                      <td>E£ {parseFloat(r.subtotal ?? 0).toFixed(2)}</td>
                      <td>{parseFloat(r.commission_rate ?? 0).toFixed(2)}%</td>
                      <td>E£ {parseFloat(r.commission_amount ?? 0).toFixed(2)}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 600, color: r.payout_status === 'paid' ? 'var(--admin-success, #4A7C5C)' : 'var(--admin-text-3)' }}>{r.payout_status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={markPaidOpen}
        title="Mark as paid?"
        message={
          <div>
            <p>Mark {selectedIds.size} record(s) as paid?</p>
            <textarea value={markPaidNote} onChange={(e) => setMarkPaidNote(e.target.value)} placeholder="Payout note (optional)" rows={2} className="admin-input" style={{ width: '100%', marginTop: 12, resize: 'vertical' }} />
          </div>
        }
        confirmLabel="Mark paid"
        onConfirm={markPaidConfirm}
        onCancel={() => { setMarkPaidOpen(false); setMarkPaidNote('') }}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
