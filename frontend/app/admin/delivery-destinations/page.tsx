'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

type Destination = {
  id: string
  name: string
  fee_egp: number
  display_order: number
  is_active: boolean
}

export default function AdminDeliveryDestinationsPage() {
  const [list, setList] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', fee_egp: '', display_order: '0', is_active: true })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', fee_egp: '', display_order: 0, is_active: true })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api.get('/admin/delivery-destinations')
      setList(res.data || [])
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: 'Failed to load destinations' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await api.post('/admin/delivery-destinations', {
        name: form.name.trim(),
        fee_egp: parseFloat(form.fee_egp) || 0,
        display_order: parseInt(form.display_order, 10) || 0,
        is_active: form.is_active,
      })
      setMessage({ type: 'success', text: 'Destination created' })
      setShowForm(false)
      setForm({ name: '', fee_egp: '', display_order: '0', is_active: true })
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create' })
    } finally {
      setSaving(false)
    }
  }

  function startEdit(d: Destination) {
    setEditingId(d.id)
    setEditForm({
      name: d.name,
      fee_egp: String(d.fee_egp),
      display_order: d.display_order,
      is_active: d.is_active,
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    setMessage(null)
    try {
      await api.patch(`/admin/delivery-destinations/${editingId}`, {
        name: editForm.name.trim(),
        fee_egp: parseFloat(editForm.fee_egp) || 0,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      setMessage({ type: 'success', text: 'Destination updated' })
      setEditingId(null)
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this destination? Orders already placed will keep the stored fee.')) return
    try {
      await api.delete(`/admin/delivery-destinations/${id}`)
      setMessage({ type: 'success', text: 'Destination deleted' })
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete' })
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Delivery Destinations</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Delivery Destinations</h1>
      <p className="text-gray-600 text-sm mb-6">
        Configure delivery destinations and fees (EGP). Customers choose one at checkout; the fee is saved with the order.
      </p>
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
        {showForm ? 'Cancel' : '+ Add destination'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-lg">New destination</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. Cairo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery fee (EGP) *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={form.fee_egp}
              onChange={(e) => setForm((f) => ({ ...f, fee_egp: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g. 160"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
            <input
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
            />
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee (EGP)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No destinations. Add one so customers can select delivery destination at checkout.
                </td>
              </tr>
            ) : (
              list.map((d) =>
                editingId === d.id ? (
                  <tr key={d.id}>
                    <td colSpan={5} className="px-4 py-3">
                      <form onSubmit={handleUpdate} className="flex flex-wrap items-end gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Name</label>
                          <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            className="px-3 py-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fee (EGP)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editForm.fee_egp}
                            onChange={(e) => setEditForm((f) => ({ ...f, fee_egp: e.target.value }))}
                            className="px-3 py-2 border rounded w-24"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Order</label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.display_order}
                            onChange={(e) => setEditForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
                            className="px-3 py-2 border rounded w-20"
                          />
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <button type="submit" disabled={saving} className="px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 border rounded hover:bg-gray-50">
                          Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">E£ {Number(d.fee_egp).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.display_order}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${d.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => startEdit(d)} className="text-sm text-pink-600 hover:underline mr-3">
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(d.id)} className="text-sm text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
