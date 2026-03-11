'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string
  name: string
  name_ar: string | null
  color: string
  icon: string
  sort_order: number
}

type Material = {
  id: string
  name: string
  name_ar: string | null
  unit: string
  stock_quantity: number
  low_stock_threshold: number | null
  notes: string | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  category_id: string | null
  material_categories: Category | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_EMOJI: Record<string, string> = {
  'gift-outline': '🎁',
  'snow-outline': '🥩',
  'leaf-outline': '🥬',
  'nutrition-outline': '🍎',
  'wine-outline': '🧃',
  'basket-outline': '🛒',
  'sparkles-outline': '✨',
  'print-outline': '🖨️',
  'construct-outline': '📎',
  'cube-outline': '📦',
  'help-circle-outline': '❓',
}

const PRESET_COLORS = ['#EC4899', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#6B7280', '#F97316']
const PRESET_EMOJIS = ['🎁', '🥩', '🥬', '🍎', '🧃', '🛒', '✨', '🖨️', '📎', '📦', '🧴', '🍳']

function getIconDisplay(icon: string): string {
  return ICON_EMOJI[icon] ?? icon
}

// ─── RestockModal ─────────────────────────────────────────────────────────────

function RestockModal({
  materialId,
  materialName,
  onClose,
  onSuccess,
}: {
  materialId: string
  materialName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = parseFloat(quantity)
    if (Number.isNaN(q) || q <= 0) { alert('Enter a valid quantity'); return }
    setLoading(true)
    try {
      await api.post(`/admin/inventory/${materialId}/restock`, { quantity: q, note: note.trim() || undefined })
      onSuccess()
      onClose()
    } catch {
      alert('Failed to restock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div style={{ background: 'var(--admin-surface)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: 'var(--admin-shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 20 }}>Restock: {materialName}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 6 }}>Quantity</label>
            <input
              type="number" step="any" min="0.001" required value={quantity}
              onChange={e => setQuantity(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14, background: 'var(--admin-surface)', color: 'var(--admin-text)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 6 }}>Note (optional)</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 14, background: 'var(--admin-surface)', color: 'var(--admin-text)', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1px solid var(--admin-border)', borderRadius: 8, background: 'transparent', color: 'var(--admin-text-2)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', background: 'var(--admin-accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Material['stock_status'] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    in_stock:     { bg: '#D1FAE5', color: '#065F46', label: 'In Stock' },
    low_stock:    { bg: '#FEF3C7', color: '#92400E', label: 'Low Stock' },
    out_of_stock: { bg: '#FEE2E2', color: '#991B1B', label: 'Out of Stock' },
  }
  const cfg = map[status] ?? { bg: '#F3F0EB', color: '#6B5E52', label: status }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [restockMaterial, setRestockMaterial] = useState<{ id: string; name: string } | null>(null)

  // Category management
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)
  const [newCatOpen, setNewCatOpen] = useState(false)
  const [newCatLoading, setNewCatLoading] = useState(false)
  const [newCatForm, setNewCatForm] = useState({ name: '', name_ar: '', color: '#EC4899', icon: '🎁' })
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; name_ar: string } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [matsRes, catsRes] = await Promise.all([
        api.get('/admin/inventory'),
        api.get('/admin/inventory/categories'),
      ])
      const mats: Material[] = matsRes.data || []
      const cats: Category[] = catsRes.data || []
      setMaterials(mats)
      setCategories(cats)
      setOpenCategories(prev => {
        if (prev.size > 0) return prev
        return new Set([...cats.map(c => c.id), 'uncategorized'])
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleCategory = (id: string) =>
    setOpenCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const expandAll = () => setOpenCategories(new Set([...categories.map(c => c.id), 'uncategorized']))
  const collapseAll = () => setOpenCategories(new Set())

  // Build sections
  const uncategorizedMaterials = materials.filter(m => !m.category_id)
  const sections = [
    ...categories.map(cat => ({
      id: cat.id, name: cat.name, name_ar: cat.name_ar,
      color: cat.color, icon: cat.icon,
      materials: materials.filter(m => m.category_id === cat.id),
    })),
    ...(uncategorizedMaterials.length > 0 ? [{
      id: 'uncategorized', name: 'Uncategorized', name_ar: 'غير مصنف',
      color: '#9CA3AF', icon: 'help-circle-outline',
      materials: uncategorizedMaterials,
    }] : []),
  ]

  const lowStockCount = materials.filter(m => m.stock_status === 'low_stock' || m.stock_status === 'out_of_stock').length
  const outOfStockCount = materials.filter(m => m.stock_status === 'out_of_stock').length

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatForm.name.trim()) return
    setNewCatLoading(true)
    try {
      await api.post('/admin/inventory/categories', {
        name: newCatForm.name.trim(),
        name_ar: newCatForm.name_ar.trim() || undefined,
        color: newCatForm.color,
        icon: newCatForm.icon,
      })
      setNewCatOpen(false)
      setNewCatForm({ name: '', name_ar: '', color: '#EC4899', icon: '🎁' })
      await loadData()
    } catch {
      alert('Failed to create category')
    } finally {
      setNewCatLoading(false)
    }
  }

  async function handleSaveCategoryName() {
    if (!editingCat) return
    try {
      await api.patch(`/admin/inventory/categories/${editingCat.id}`, {
        name: editingCat.name,
        name_ar: editingCat.name_ar || undefined,
      })
      await loadData()
    } catch {
      console.error('Failed to update category')
    } finally {
      setEditingCat(null)
    }
  }

  async function handleDeleteCategory(id: string, count: number) {
    if (count > 0) { alert(`Cannot delete: ${count} material(s) assigned. Reassign them first.`); return }
    if (!confirm('Delete this category?')) return
    try {
      await api.delete(`/admin/inventory/categories/${id}`)
      await loadData()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      alert(Array.isArray(msg) ? msg.join(' ') : msg || 'Failed to delete')
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-3)' }}>Loading…</div>
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>Inventory</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/admin/inventory/shopping-list"
            style={{ padding: '9px 16px', border: '1px solid var(--admin-border)', borderRadius: 9, background: 'var(--admin-surface)', color: 'var(--admin-text)', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            🛒 Shopping List
          </Link>
          <Link
            href="/admin/inventory/new"
            style={{ padding: '9px 18px', background: 'var(--admin-accent)', color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            + Add Material
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { value: materials.length, label: 'Total Materials', color: 'var(--admin-text)' },
          { value: lowStockCount, label: 'Low Stock', color: '#B45309' },
          { value: outOfStockCount, label: 'Out of Stock', color: '#DC2626' },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-2)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Low stock banner */}
      {lowStockCount > 0 && (
        <div style={{ marginBottom: 16, padding: '11px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, fontSize: 14, color: '#92400E' }}>
          ⚠️ {lowStockCount} material{lowStockCount !== 1 ? 's' : ''} are running low
        </div>
      )}

      {/* Expand / Collapse All */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 10, alignItems: 'center' }}>
        <button onClick={expandAll} style={{ fontSize: 12, color: '#EC4899', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>Expand All</button>
        <span style={{ color: 'var(--admin-text-3)', fontSize: 12 }}>·</span>
        <button onClick={collapseAll} style={{ fontSize: 12, color: '#EC4899', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>Collapse All</button>
      </div>

      {/* Category Sections */}
      {sections.map(section => {
        const isOpen = openCategories.has(section.id)
        const lowInSection = section.materials.filter(m => m.stock_status === 'low_stock' || m.stock_status === 'out_of_stock').length
        return (
          <div key={section.id} style={{ marginBottom: 6 }}>
            {/* Header */}
            <button
              onClick={() => toggleCategory(section.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
                borderRadius: isOpen ? '12px 12px 0 0' : 12,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                <span style={{ fontSize: 17, lineHeight: 1 }}>{getIconDisplay(section.icon)}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>{section.name}</span>
                <span style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-3)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100 }}>
                  {section.materials.length} item{section.materials.length !== 1 ? 's' : ''}
                </span>
                {lowInSection > 0 && (
                  <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100 }}>
                    ⚠ {lowInSection} low
                  </span>
                )}
              </div>
              <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', color: 'var(--admin-text-3)', fontSize: 11, flexShrink: 0 }}>▼</span>
            </button>

            {/* Body */}
            {isOpen && (
              <div style={{ border: '1px solid var(--admin-border)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', marginBottom: 2 }}>
                {section.materials.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 13, fontStyle: 'italic' }}>
                    No materials in this category yet
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--admin-surface-2)' }}>
                        {['Name', 'Unit', 'Stock', 'Threshold', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.materials.map((m, i) => (
                        <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid var(--admin-border)' : 'none' }}>
                          <td style={{ padding: '11px 16px', fontWeight: 600, fontSize: 14, color: 'var(--admin-text)' }}>{m.name}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--admin-text-2)' }}>{m.unit}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--admin-text)' }}>{m.stock_quantity}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: 'var(--admin-text-2)' }}>{m.low_stock_threshold ?? '—'}</td>
                          <td style={{ padding: '11px 16px' }}><StatusBadge status={m.stock_status} /></td>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                              <Link href={`/admin/inventory/${m.id}`} style={{ fontSize: 13, color: 'var(--admin-accent)', textDecoration: 'none', fontWeight: 500 }}>Edit</Link>
                              <button
                                type="button"
                                onClick={() => setRestockMaterial({ id: m.id, name: m.name })}
                                style={{ fontSize: 13, color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                              >Restock</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Manage Categories */}
      <div style={{ marginTop: 28 }}>
        <button
          onClick={() => setManageCategoriesOpen(v => !v)}
          style={{ fontSize: 13, color: 'var(--admin-text-3)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
        >
          <span>⚙</span>
          <span>Manage Categories</span>
          <span style={{ fontSize: 10, marginTop: 1 }}>{manageCategoriesOpen ? '▲' : '▼'}</span>
        </button>

        {manageCategoriesOpen && (
          <div style={{ marginTop: 12, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 12, padding: 20 }}>
            {categories.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--admin-text-3)', textAlign: 'center', padding: '12px 0' }}>
                No categories yet.
              </div>
            )}
            {categories.map(cat => {
              const catCount = materials.filter(m => m.category_id === cat.id).length
              const isEditing = editingCat?.id === cat.id
              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{getIconDisplay(cat.icon)}</span>
                  {isEditing ? (
                    <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                      <input
                        value={editingCat.name}
                        onChange={e => setEditingCat(p => p ? { ...p, name: e.target.value } : p)}
                        onBlur={handleSaveCategoryName}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveCategoryName() }}
                        autoFocus
                        style={{ flex: 1, padding: '5px 9px', border: '1px solid var(--admin-border)', borderRadius: 6, fontSize: 13, background: 'var(--admin-surface)', color: 'var(--admin-text)' }}
                      />
                      <input
                        value={editingCat.name_ar}
                        onChange={e => setEditingCat(p => p ? { ...p, name_ar: e.target.value } : p)}
                        onBlur={handleSaveCategoryName}
                        placeholder="Arabic name"
                        dir="rtl"
                        style={{ flex: 1, padding: '5px 9px', border: '1px solid var(--admin-border)', borderRadius: 6, fontSize: 13, background: 'var(--admin-surface)', color: 'var(--admin-text)' }}
                      />
                    </div>
                  ) : (
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--admin-text)', fontWeight: 500 }}>
                      {cat.name}
                      {cat.name_ar && <span style={{ color: 'var(--admin-text-3)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>({cat.name_ar})</span>}
                      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--admin-text-3)', fontWeight: 400 }}>
                        {catCount} material{catCount !== 1 ? 's' : ''}
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => setEditingCat({ id: cat.id, name: cat.name, name_ar: cat.name_ar ?? '' })}
                    style={{ fontSize: 12, color: 'var(--admin-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 5 }}
                  >Edit</button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, catCount)}
                    disabled={catCount > 0}
                    title={catCount > 0 ? `${catCount} materials assigned — reassign first` : 'Delete category'}
                    style={{ fontSize: 12, color: catCount > 0 ? 'var(--admin-text-3)' : '#DC2626', background: 'none', border: 'none', cursor: catCount > 0 ? 'not-allowed' : 'pointer', padding: '3px 8px', borderRadius: 5, opacity: catCount > 0 ? 0.45 : 1 }}
                  >Delete</button>
                </div>
              )
            })}

            {/* Create new category */}
            {!newCatOpen ? (
              <button
                onClick={() => setNewCatOpen(true)}
                style={{ width: '100%', marginTop: 14, padding: '12px', border: '2px dashed #F9A8D4', borderRadius: 12, background: 'transparent', color: '#EC4899', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                + Create New Category
              </button>
            ) : (
              <form onSubmit={handleCreateCategory} style={{ marginTop: 14, padding: 16, background: 'var(--admin-surface-2)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 5 }}>Name (EN) *</label>
                    <input
                      required value={newCatForm.name}
                      onChange={e => setNewCatForm(f => ({ ...f, name: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 13, background: 'var(--admin-surface)', color: 'var(--admin-text)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 5 }}>Name (AR)</label>
                    <input
                      value={newCatForm.name_ar}
                      onChange={e => setNewCatForm(f => ({ ...f, name_ar: e.target.value }))}
                      dir="rtl"
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 13, background: 'var(--admin-surface)', color: 'var(--admin-text)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 7 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c} type="button"
                        onClick={() => setNewCatForm(f => ({ ...f, color: c }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: newCatForm.color === c ? '3px solid var(--admin-text)' : '3px solid transparent', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 7 }}>Icon</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PRESET_EMOJIS.map(emoji => (
                      <button
                        key={emoji} type="button"
                        onClick={() => setNewCatForm(f => ({ ...f, icon: emoji }))}
                        style={{ width: 38, height: 38, borderRadius: 8, fontSize: 18, border: newCatForm.icon === emoji ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)', background: newCatForm.icon === emoji ? 'var(--admin-accent-light)' : 'var(--admin-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="submit" disabled={newCatLoading}
                    style={{ padding: '9px 22px', background: '#EC4899', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: newCatLoading ? 0.7 : 1 }}
                  >
                    {newCatLoading ? 'Creating…' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewCatOpen(false); setNewCatForm({ name: '', name_ar: '', color: '#EC4899', icon: '🎁' }) }}
                    style={{ padding: '9px 16px', background: 'none', border: 'none', fontSize: 13, color: 'var(--admin-text-3)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {restockMaterial && (
        <RestockModal
          materialId={restockMaterial.id}
          materialName={restockMaterial.name}
          onClose={() => setRestockMaterial(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
