'use client'

import { useState, useEffect } from 'react'
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

const ICON_EMOJI: Record<string, string> = {
  'gift-outline': '🎁', 'snow-outline': '🥩', 'leaf-outline': '🥬',
  'nutrition-outline': '🍎', 'wine-outline': '🧃', 'basket-outline': '🛒',
  'sparkles-outline': '✨', 'print-outline': '🖨️', 'construct-outline': '📎',
  'cube-outline': '📦', 'help-circle-outline': '❓',
}
const PRESET_COLORS = ['#EC4899', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#6B7280', '#F97316']
const PRESET_EMOJIS = ['🎁', '🥩', '🥬', '🍎', '🧃', '🛒', '✨', '🖨️', '📎', '📦', '🧴', '🍳']

type Category = { id: string; name: string; color: string; icon: string }

export default function NewMaterialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatLoading, setNewCatLoading] = useState(false)
  const [newCatForm, setNewCatForm] = useState({ name: '', name_ar: '', color: '#EC4899', icon: '🎁' })
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    unit: 'unit',
    stock_quantity: '',
    low_stock_threshold: '',
    notes: '',
  })

  useEffect(() => {
    api.get('/admin/inventory/categories').then(r => setCategories(r.data || [])).catch(() => {})
  }, [])

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatForm.name.trim()) return
    setNewCatLoading(true)
    try {
      const res = await api.post('/admin/inventory/categories', {
        name: newCatForm.name.trim(),
        name_ar: newCatForm.name_ar.trim() || undefined,
        color: newCatForm.color,
        icon: newCatForm.icon,
      })
      const created = res.data
      setCategories(prev => [...prev, created])
      setSelectedCategoryId(created.id)
      setNewCatOpen(false)
      setNewCatForm({ name: '', name_ar: '', color: '#EC4899', icon: '🎁' })
    } catch {
      alert('Failed to create category')
    } finally {
      setNewCatLoading(false)
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
        category_id: selectedCategoryId || undefined,
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

        {/* Category Selector */}
        <div>
          <label className="block font-semibold mb-3">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* None pill */}
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                selectedCategoryId === null
                  ? 'bg-pink-100 border-2 border-pink-400 text-pink-700'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-200'
              }`}
            >
              <span className="text-lg">➖</span>
              <span>None</span>
            </button>
            {/* Category pills */}
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-pink-100 border-2 border-pink-400 text-pink-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-200'
                }`}
              >
                <span className="text-lg">{ICON_EMOJI[cat.icon] ?? cat.icon}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
            {/* + New pill */}
            <button
              type="button"
              onClick={() => setNewCatOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-pink-300 text-pink-400 text-sm font-medium hover:border-pink-400 hover:bg-pink-50 transition-colors"
            >
              <span>＋</span>
              <span>New</span>
            </button>
          </div>

          {/* Inline new category form */}
          {newCatOpen && (
            <form onSubmit={handleCreateCategory} className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Name (EN) *</label>
                  <input required value={newCatForm.name} onChange={e => setNewCatForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Name (AR)</label>
                  <input value={newCatForm.name_ar} onChange={e => setNewCatForm(f => ({ ...f, name_ar: e.target.value }))}
                    dir="rtl" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewCatForm(f => ({ ...f, color: c }))}
                      style={{ background: c, width: 26, height: 26, borderRadius: '50%', border: newCatForm.color === c ? '3px solid #111' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Icon</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setNewCatForm(f => ({ ...f, icon: emoji }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                        newCatForm.icon === emoji ? 'border-2 border-pink-400 bg-pink-50' : 'border border-gray-200 bg-white'
                      }`}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={newCatLoading}
                  className="px-5 py-2 bg-pink-500 text-white rounded-lg text-sm font-semibold hover:bg-pink-600 disabled:opacity-60">
                  {newCatLoading ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setNewCatOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            </form>
          )}
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
