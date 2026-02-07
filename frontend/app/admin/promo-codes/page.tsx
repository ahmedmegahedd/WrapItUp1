'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

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

export default function AdminPromoCodesPage() {
  const [list, setList] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    expires_at: '',
    max_usage_count: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api.get('/promo-codes')
      setList(res.data || [])
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: 'Failed to load promo codes' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
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
      setMessage({ type: 'success', text: 'Promo code created' })
      setShowForm(false)
      setForm({
        code: '',
        name: '',
        discount_type: 'percentage',
        discount_value: '',
        expires_at: '',
        max_usage_count: '',
        is_active: true,
      })
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: PromoCode) {
    try {
      await api.patch(`/promo-codes/${p.id}`, { is_active: !p.is_active })
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' })
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Promo Codes</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Promo Codes</h1>
      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="mb-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        {showForm ? 'Cancel' : '+ Create promo code'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-lg">New promo code</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. SAVE10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (admin label)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. 10% off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (EGP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount value *</label>
              <input
                type="number"
                min={0}
                step={form.discount_type === 'percentage' ? 1 : 0.01}
                required
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                placeholder={form.discount_type === 'percentage' ? '10' : '50'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration date</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max usage count</label>
              <input
                type="number"
                min={0}
                value={form.max_usage_count}
                onChange={(e) => setForm((f) => ({ ...f, max_usage_count: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
                placeholder="Optional"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm">Active</span>
          </label>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No promo codes. Create one above.
                </td>
              </tr>
            ) : (
              list.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono font-medium">{p.code}</td>
                  <td className="px-4 py-3 text-gray-700">{p.name || '—'}</td>
                  <td className="px-4 py-3">
                    {p.discount_type === 'percentage' ? `${p.discount_value}%` : `E£ ${Number(p.discount_value).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    {p.current_usage_count}
                    {p.max_usage_count != null ? ` / ${p.max_usage_count}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(p)}
                      className="text-sm text-pink-600 hover:underline"
                    >
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
