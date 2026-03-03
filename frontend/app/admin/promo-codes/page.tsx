'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import StatusBadge from '../_components/StatusBadge'
import Toggle from '../_components/Toggle'
import SkeletonRows from '../_components/SkeletonRows'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

type PromoCode = {
  id: string
  code: string
  name: string | null
  discount_type: string
  discount_value: number
  expires_at: string | null
  max_usage_count: number | null
  current_usage_count: number
  is_active: boolean
  created_at: string
}

const emptyForm = {
  code: '',
  name: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  expires_at: '',
  max_usage_count: '',
  is_active: true,
}

export default function AdminPromoCodesPage() {
  const [list, setList] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api.get('/promo-codes')
      setList(res.data || [])
    } catch {
      showToast('error', 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/promo-codes', {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim() || undefined,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        expires_at: form.expires_at || undefined,
        max_usage_count: form.max_usage_count ? parseInt(form.max_usage_count, 10) : undefined,
        is_active: form.is_active,
      })
      showToast('success', 'Promo code created')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create promo code')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: PromoCode) {
    try {
      await api.patch(`/promo-codes/${p.id}`, { is_active: !p.is_active })
      setList((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)))
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update')
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <AdminPageHeader
        title="Promo Codes"
        subtitle={loading ? undefined : `${list.length} codes`}
        action={{
          label: showForm ? 'Cancel' : '+ Create Code',
          onClick: () => setShowForm((v) => !v),
        }}
      />

      {/* Create form */}
      {showForm && (
        <div
          style={{
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--admin-radius)',
            boxShadow: 'var(--admin-shadow)',
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div className="admin-section-header">New Promo Code</div>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="admin-input"
                  placeholder="e.g. SAVE10"
                />
              </div>
              <div>
                <label style={labelStyle}>Name (admin label)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="admin-input"
                  placeholder="e.g. 10% off summer"
                />
              </div>
              <div>
                <label style={labelStyle}>Discount type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                    }))
                  }
                  className="admin-input"
                  style={{ background: 'var(--admin-surface)' }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (E£)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  Discount value *{' '}
                  <span style={{ color: 'var(--admin-text-3)', fontWeight: 400 }}>
                    ({form.discount_type === 'percentage' ? '%' : 'E£'})
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={form.discount_type === 'percentage' ? 1 : 0.01}
                  required
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  className="admin-input"
                  placeholder={form.discount_type === 'percentage' ? '10' : '50'}
                />
              </div>
              <div>
                <label style={labelStyle}>Expiration date</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="admin-input"
                />
              </div>
              <div>
                <label style={labelStyle}>Max usage count</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_usage_count}
                  onChange={(e) => setForm((f) => ({ ...f, max_usage_count: e.target.value }))}
                  className="admin-input"
                  placeholder="Leave blank for unlimited"
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Toggle
                checked={form.is_active}
                onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                label="Active immediately"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={saving}
                className="admin-btn-primary"
              >
                {saving ? 'Creating…' : 'Create Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm)
                }}
                className="admin-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} rows={4} />
            ) : list.length === 0 ? (
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
                  No promo codes yet. Create one above.
                </td>
              </tr>
            ) : (
              list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 13,
                        background: 'var(--admin-surface-2)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {p.code}
                    </span>
                  </td>
                  <td style={{ color: 'var(--admin-text-2)', fontSize: 13 }}>{p.name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {p.discount_type === 'percentage'
                      ? `${p.discount_value}%`
                      : `E£ ${Number(p.discount_value).toFixed(2)}`}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.current_usage_count}</span>
                    {p.max_usage_count != null && (
                      <span style={{ color: 'var(--admin-text-3)' }}> / {p.max_usage_count}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--admin-text-2)' }}>
                    {p.expires_at
                      ? new Date(p.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td>
                    <StatusBadge status={p.is_active ? 'active' : 'inactive'} type="product" />
                  </td>
                  <td>
                    <Toggle
                      checked={p.is_active}
                      onChange={() => toggleActive(p)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
