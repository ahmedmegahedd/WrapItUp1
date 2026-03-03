'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewMaterialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    unit: 'unit',
    stock_quantity: '',
    low_stock_threshold: '',
    notes: '',
  })

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
    if (stock != null && (Number.isNaN(stock) || stock < 0)) {
      alert('Current stock must be a non-negative number')
      return
    }
    if (threshold != null && (Number.isNaN(threshold) || threshold < 0)) {
      alert('Low stock threshold must be a non-negative number')
      return
    }
    setLoading(true)
    try {
      await api.post('/admin/inventory', {
        name,
        name_ar: formData.name_ar.trim() || undefined,
        unit: formData.unit,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        notes: formData.notes.trim() || undefined,
      })
      router.push('/admin/inventory')
    } catch (err: unknown) {
      console.error(err)
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message
      alert(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to create material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">New Material</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-2xl">
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
            min="0"
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
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <Link
            href="/admin/inventory"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
