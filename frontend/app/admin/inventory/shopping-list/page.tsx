'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

const EXTRAS_KEY = 'wrapitup_shopping_extras'

const ICON_EMOJI: Record<string, string> = {
  'gift-outline': '🎁', 'snow-outline': '🥩', 'leaf-outline': '🥬',
  'nutrition-outline': '🍎', 'wine-outline': '🧃', 'basket-outline': '🛒',
  'sparkles-outline': '✨', 'print-outline': '🖨️', 'construct-outline': '📎',
  'cube-outline': '📦', 'help-circle-outline': '❓',
}

type Category = { id: string; name: string; color: string; icon: string }

type ShoppingItem = {
  materialId: string
  name: string
  unit: string
  currentStock: number
  threshold: number | null
  suggestedQuantity: number
  reason: string
  category_id: string | null
}

type ExtraItem = {
  id: string
  name: string
  quantity: string
  unit: string
  note: string
  completed: boolean
}

function loadExtras(): ExtraItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(EXTRAS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveExtras(items: ExtraItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(items))
}

function getIconDisplay(icon: string): string {
  return ICON_EMOJI[icon] ?? icon
}

export default function ShoppingListPage() {
  const [suggested, setSuggested] = useState<ShoppingItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [extras, setExtras] = useState<ExtraItem[]>([])
  const [loading, setLoading] = useState(true)
  const [restockingId, setRestockingId] = useState<string | null>(null)
  const [restockQty, setRestockQty] = useState<Record<string, string>>({})

  const loadSuggested = useCallback(async () => {
    try {
      const [listRes, catsRes] = await Promise.all([
        api.get('/admin/inventory/shopping-list'),
        api.get('/admin/inventory/categories'),
      ])
      setSuggested(listRes.data || [])
      setCategories(catsRes.data || [])
    } catch {
      setSuggested([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSuggested()
    setExtras(loadExtras())
  }, [loadSuggested])

  function handlePrint() { window.print() }

  function handleClearCompleted() {
    const remaining = extras.filter(e => !e.completed)
    setExtras(remaining)
    saveExtras(remaining)
  }

  async function handleMarkPurchased(item: ShoppingItem) {
    const materialId = item.materialId
    const qtyStr = restockQty[materialId] ?? String(item.suggestedQuantity)
    const qty = parseFloat(qtyStr)
    if (Number.isNaN(qty) || qty <= 0) { alert('Enter a valid quantity'); return }
    setRestockingId(materialId)
    try {
      await api.post(`/admin/inventory/${materialId}/restock`, { quantity: qty, note: 'Shopping list' })
      setRestockQty(prev => { const next = { ...prev }; delete next[materialId]; return next })
      await loadSuggested()
    } catch {
      alert('Failed to restock')
    } finally {
      setRestockingId(null)
    }
  }

  function setRestockInput(id: string, value: string) {
    setRestockQty(prev => ({ ...prev, [id]: value }))
  }

  function addExtra() {
    const newItem: ExtraItem = { id: `extra-${Date.now()}`, name: '', quantity: '', unit: '', note: '', completed: false }
    const next = [...extras, newItem]
    setExtras(next); saveExtras(next)
  }

  function updateExtra(id: string, field: keyof ExtraItem, value: string | boolean) {
    const next = extras.map(e => e.id === id ? { ...e, [field]: value } : e)
    setExtras(next); saveExtras(next)
  }

  function removeExtra(id: string) {
    const next = extras.filter(e => e.id !== id)
    setExtras(next); saveExtras(next)
  }

  function toggleExtraCompleted(id: string) {
    const next = extras.map(e => e.id === id ? { ...e, completed: !e.completed } : e)
    setExtras(next); saveExtras(next)
  }

  // Group suggested items by category
  const groupedByCategory = categories
    .map(cat => ({ ...cat, items: suggested.filter(item => item.category_id === cat.id) }))
    .filter(group => group.items.length > 0)

  const uncategorizedItems = suggested.filter(item => !item.category_id)

  // Render a items table inside a category section
  function renderItemsTable(items: ShoppingItem[]) {
    return (
      <table className="w-full print-table">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase no-print w-10">✅</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Suggested to Buy</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase no-print">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map(item => {
            const isRestocking = restockingId === item.materialId
            const showRestockInput = restockQty[item.materialId] !== undefined || isRestocking
            const stockClass = item.currentStock < 0
              ? 'text-red-600 font-medium'
              : item.threshold != null && item.currentStock <= item.threshold
                ? 'text-yellow-700'
                : ''
            return (
              <tr key={item.materialId} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 no-print">
                  <input type="checkbox" className="rounded border-gray-300" disabled readOnly checked={showRestockInput} />
                </td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className={`px-4 py-3 ${stockClass}`}>{item.currentStock} {item.unit}</td>
                <td className="px-4 py-3">{item.suggestedQuantity}</td>
                <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                <td className="px-4 py-3 no-print">
                  {!showRestockInput ? (
                    <button type="button" onClick={() => setRestockInput(item.materialId, String(item.suggestedQuantity))}
                      className="text-blue-600 hover:underline text-sm">
                      Mark as Purchased
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step="0.001" min="0.001"
                        value={restockQty[item.materialId] ?? item.suggestedQuantity}
                        onChange={e => setRestockInput(item.materialId, e.target.value)}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <button type="button" onClick={() => handleMarkPurchased(item)} disabled={isRestocking}
                        className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50">
                        {isRestocking ? '…' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className="shopping-list-page">
      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: inline !important; }
          .shopping-list-page { padding: 0; }
          .print-only-header { display: block !important; margin-bottom: 1rem; }
          nav, .no-print { display: none !important; }
        }
        .print-only-header { display: none; }
      `}</style>

      <div className="print-only-header"><h1>Shopping List</h1></div>

      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping List 🛒</h1>
          <p className="text-gray-600 mt-1">What to buy before your next prep day</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleClearCompleted}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Clear Completed
          </button>
          <button type="button" onClick={handlePrint}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Print List
          </button>
        </div>
      </div>

      {/* Suggested to Buy — grouped by category */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested to Buy</h2>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : suggested.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Nothing to buy right now. 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category groups */}
            {groupedByCategory.map(group => (
              <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                  <span className="text-base">{getIconDisplay(group.icon)}</span>
                  <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                  <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {renderItemsTable(group.items)}
              </div>
            ))}

            {/* Uncategorized */}
            {uncategorizedItems.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#9CA3AF', flexShrink: 0 }} />
                  <span className="text-base">❓</span>
                  <span className="font-semibold text-gray-800 text-sm">Uncategorized</span>
                  <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {uncategorizedItems.length} item{uncategorizedItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {renderItemsTable(uncategorizedItems)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* My Extra Items */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Extra Items</h2>
        <div className="mb-2 no-print">
          <button type="button" onClick={addExtra} className="text-blue-600 hover:underline">
            + Add Item
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full print-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase no-print w-10">✓</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase no-print w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {extras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                    No extra items. Add your own above.
                  </td>
                </tr>
              ) : (
                extras.map(e => (
                  <tr key={e.id} className={e.completed ? 'bg-gray-50 opacity-75' : ''}>
                    <td className="px-6 py-3 no-print">
                      <input type="checkbox" checked={e.completed} onChange={() => toggleExtraCompleted(e.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-3">
                      {typeof window === 'undefined' ? e.name : (
                        <input type="text" value={e.name} onChange={ev => updateExtra(e.id, 'name', ev.target.value)}
                          placeholder="Item name" className="w-full px-2 py-1 border rounded text-sm no-print" />
                      )}
                      {typeof window !== 'undefined' && <span className="print-only">{e.name || '—'}</span>}
                    </td>
                    <td className="px-6 py-3">
                      <input type="text" value={e.quantity} onChange={ev => updateExtra(e.id, 'quantity', ev.target.value)}
                        placeholder="0" className="w-20 px-2 py-1 border rounded text-sm no-print" />
                      <span className="print-only">{e.quantity || '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <input type="text" value={e.unit} onChange={ev => updateExtra(e.id, 'unit', ev.target.value)}
                        placeholder="unit" className="w-20 px-2 py-1 border rounded text-sm no-print" />
                      <span className="print-only">{e.unit || '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <input type="text" value={e.note} onChange={ev => updateExtra(e.id, 'note', ev.target.value)}
                        placeholder="Note" className="w-full px-2 py-1 border rounded text-sm no-print" />
                      <span className="print-only">{e.note || '—'}</span>
                    </td>
                    <td className="px-6 py-3 no-print">
                      <button type="button" onClick={() => removeExtra(e.id)} className="text-red-600 hover:underline">×</button>
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
