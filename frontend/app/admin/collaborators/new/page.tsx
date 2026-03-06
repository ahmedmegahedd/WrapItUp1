'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import AdminPageHeader from '../../_components/AdminPageHeader'
import Toast, { useToast } from '../../_components/Toast'

type AdminUser = { id: string; email: string }

export default function NewCollaboratorPage() {
  const router = useRouter()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [collaboratorAdminIds, setCollaboratorAdminIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    adminId: '',
    brand_name: '',
    contact_email: '',
    contact_phone: '',
    commission_rate: '0',
    notes: '',
  })
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/admin/admin-users').catch(() => ({ data: [] })),
      api.get('/admin/collaborators').catch(() => ({ data: [] })),
    ]).then(([usersRes, collabRes]) => {
      const users = Array.isArray(usersRes.data) ? usersRes.data : []
      const collabs = Array.isArray(collabRes.data) ? collabRes.data : []
      setAdminUsers(users)
      setCollaboratorAdminIds(new Set(collabs.map((c: any) => c.admin_id).filter(Boolean)))
    }).finally(() => setLoading(false))
  }, [])

  const availableAdmins = adminUsers.filter((a) => !collaboratorAdminIds.has(a.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.adminId.trim()) {
      showToast('error', 'Please select an admin account')
      return
    }
    if (!form.brand_name.trim()) {
      showToast('error', 'Brand name is required')
      return
    }
    const rate = parseFloat(form.commission_rate)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      showToast('error', 'Commission rate must be between 0 and 100')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/collaborators', {
        adminId: form.adminId,
        brand_name: form.brand_name.trim(),
        contact_email: form.contact_email.trim() || undefined,
        contact_phone: form.contact_phone.trim() || undefined,
        commission_rate: rate,
        notes: form.notes.trim() || undefined,
      })
      showToast('success', 'Collaborator created')
      router.push('/admin/collaborators')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      showToast('error', Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to create collaborator')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = { border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', padding: '9px 12px', fontSize: 14, fontFamily: 'inherit', background: 'var(--admin-surface)', color: 'var(--admin-text)', width: '100%', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 6 }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 560, margin: '0 auto' }}>
      <AdminPageHeader title="Add Collaborator" breadcrumbs={[{ label: 'Collaborators', href: '/admin/collaborators' }, { label: 'New' }]} />

      {loading ? (
        <p style={{ color: 'var(--admin-text-3)' }}>Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Admin account *</label>
            <select value={form.adminId} onChange={(e) => setForm((f) => ({ ...f, adminId: e.target.value }))} style={inputStyle} required>
              <option value="">Select an admin…</option>
              {availableAdmins.map((a) => (
                <option key={a.id} value={a.id}>{a.email}</option>
              ))}
            </select>
            {availableAdmins.length === 0 && <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 6 }}>No admins available. Create one in Admin Controls first, or they may already be collaborators.</p>}
          </div>
          <div>
            <label style={labelStyle}>Brand name *</label>
            <input type="text" value={form.brand_name} onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))} placeholder="e.g. Sweet Treats Co" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Contact email</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="optional" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact phone</label>
            <input type="text" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="optional" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Commission rate (%)</label>
            <input type="number" min={0} max={100} step={0.01} value={form.commission_rate} onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="optional" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="admin-btn-primary" disabled={saving || availableAdmins.length === 0}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <Link href="/admin/collaborators" className="admin-btn-ghost">Cancel</Link>
          </div>
        </form>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
