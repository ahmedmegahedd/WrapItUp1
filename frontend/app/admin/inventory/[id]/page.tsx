'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

const UNIT_OPTIONS = [
  { value: 'unit', label: 'Unit' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'g', label: 'Gram' },
  { value: 'L', label: 'Liter' },
  { value: 'ml', label: 'Milliliter' },
  { value: 'm', label: 'Meter' },
  { value: 'cm', label: 'Centimeter' },
]

type Transaction = {
  id: string
  type: 'restock' | 'deduction' | 'refund' | 'adjustment'
  quantity_change: number
  quantity_before: number
  quantity_after: number
  order_id: string | null
  note: string | null
  created_at: string
}

type MaterialDetail = {
  id: string
  name: string
  name_ar: string | null
  unit: string
  stock_quantity: number
  low_stock_threshold: number | null
  notes: string | null
  stock_status: string
  transactions: Transaction[]
}

export default function EditMaterialPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [material, setMaterial] = useState<MaterialDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    unit: 'unit',
    stock_quantity: '',
    low_stock_threshold: '',
    notes: '',
  })

  useEffect(() => {
    loadMaterial()
  }, [id])

  async function loadMaterial() {
    try {
      const res = await api.get(`/admin/inventory/${id}`)
      const m: MaterialDetail = res.data
      setMaterial(m)
      setFormData({
        name: m.name || '',
        name_ar: m.name_ar || '',
        unit: m.unit || 'unit',
        stock_quantity: m.stock_quantity?.toString() ?? '',
        low_stock_threshold:
          m.low_stock_threshold != null ? String(m.low_stock_threshold) : '',
        notes: m.notes || '',
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = formData.name.trim()
    if (!name) {
      alert('Name is required')
      return
    }
    const stock = formData.stock_quantity === '' ? undefined : parseFloat(formData.stock_quantity)
    const threshold =
      formData.low_stock_threshold === ''
        ? undefined
        : parseFloat(formData.low_stock_threshold)
    if (stock != null && Number.isNaN(stock)) {
      alert('Current stock must be a number')
      return
    }
    if (threshold != null && (Number.isNaN(threshold) || threshold < 0)) {
      alert('Low stock threshold must be a non-negative number')
      return
    }
    setSaving(true)
    try {
      await api.patch(`/admin/inventory/${id}`, {
        name,
        name_ar: formData.name_ar.trim() || undefined,
        unit: formData.unit,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        notes: formData.notes.trim() || undefined,
      })
      await loadMaterial()
    } catch (err: unknown) {
      console.error(err)
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this material? This will fail if it is used in any product recipe.'))
      return
    try {
      await api.delete(`/admin/inventory/${id}`)
      router.push('/admin/inventory')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to delete')
    }
  }

  function formatChange(tx: Transaction, unit: string) {
    const q = tx.quantity_change
    const sign = q >= 0 ? '+' : ''
    return `${sign}${q} ${unit}`
  }

  function typeBadge(type: Transaction['type']) {
    switch (type) {
      case 'restock':
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Restock</span>
      case 'deduction':
        return <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">Deduction</span>
      case 'refund':
        return <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Refund</span>
      case 'adjustment':
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">Adjustment</span>
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{type}</span>
    }
  }

  if (loading || !material) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Edit Material</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-2xl mb-8">
        <div>
          <label className="block font-semibold mb-2">Name (English) *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Name (Arabic)</label>
          <input
            type="text"
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Unit *</label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {UNIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.value})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-2">Current Stock</label>
          <input
            type="number"
            step="0.001"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Low Stock Alert Threshold</label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formData.low_stock_threshold}
            onChange={(e) =>
              setFormData({ ...formData, low_stock_threshold: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <p className="mt-1 text-sm text-gray-500">
            You&apos;ll see a warning when stock falls below this number
          </p>
        </div>
        <div>
          <label className="block font-semibold mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link
            href="/admin/inventory"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock History</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {material.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                material.transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">{typeBadge(tx.type)}</td>
                    <td className="px-6 py-3 font-medium">
                      {formatChange(tx, material.unit)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{tx.quantity_before}</td>
                    <td className="px-6 py-3 text-gray-600">{tx.quantity_after}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {tx.order_id ? (
                        <Link
                          href={`/admin/orders`}
                          className="text-blue-600 hover:underline"
                        >
                          {tx.order_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-sm max-w-xs truncate">
                      {tx.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
