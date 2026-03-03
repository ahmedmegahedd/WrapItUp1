'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

type Material = {
  id: string
  name: string
  name_ar: string | null
  unit: string
  stock_quantity: number
  low_stock_threshold: number | null
  notes: string | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

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
    if (Number.isNaN(q) || q <= 0) {
      alert('Enter a valid quantity')
      return
    }
    setLoading(true)
    try {
      await api.post(`/admin/inventory/${materialId}/restock`, {
        quantity: q,
        note: note.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to restock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Restock: {materialName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Quantity</label>
            <input
              type="number"
              step="any"
              min="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminInventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [restockMaterial, setRestockMaterial] = useState<{ id: string; name: string } | null>(null)

  async function loadMaterials() {
    try {
      const res = await api.get('/admin/inventory')
      setMaterials(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  const lowStockCount = materials.filter(
    (m) => m.stock_status === 'low_stock' || m.stock_status === 'out_of_stock'
  ).length
  const outOfStockCount = materials.filter((m) => m.stock_status === 'out_of_stock').length
  const displayList = lowStockOnly
    ? materials.filter((m) => m.stock_status === 'low_stock' || m.stock_status === 'out_of_stock')
    : materials

  const statusBadge = (status: Material['stock_status']) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">In Stock</span>
      case 'low_stock':
        return <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">Low Stock</span>
      case 'out_of_stock':
        return <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-800">Out of Stock</span>
      default:
        return <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory/shopping-list"
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            🛒 View Shopping List
          </Link>
          <Link
            href="/admin/inventory/new"
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Add Material
          </Link>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <span className="text-amber-900">
            ⚠️ {lowStockCount} material(s) are running low
          </span>
          <button
            type="button"
            onClick={() => setLowStockOnly((v) => !v)}
            className="px-3 py-1.5 bg-amber-200 text-amber-900 rounded hover:bg-amber-300 text-sm font-medium"
          >
            {lowStockOnly ? 'Show All' : 'View Low Stock'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{materials.length}</div>
          <div className="text-gray-800">Total Materials</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-800">{lowStockCount}</div>
          <div className="text-gray-800">Low Stock</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-800">{outOfStockCount}</div>
          <div className="text-gray-800">Out of Stock</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-gray-500">
                  {lowStockOnly ? 'No low-stock materials.' : 'No materials yet.'}
                </td>
              </tr>
            ) : (
              displayList.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{m.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{m.stock_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {m.low_stock_threshold != null ? m.low_stock_threshold : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{statusBadge(m.stock_status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/inventory/${m.id}`}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setRestockMaterial({ id: m.id, name: m.name })}
                      className="text-green-600 hover:underline"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {restockMaterial && (
        <RestockModal
          materialId={restockMaterial.id}
          materialName={restockMaterial.name}
          onClose={() => setRestockMaterial(null)}
          onSuccess={loadMaterials}
        />
      )}
    </div>
  )
}
