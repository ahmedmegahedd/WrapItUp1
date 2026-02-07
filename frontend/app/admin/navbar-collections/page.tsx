'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

type CollectionRow = {
  id: string
  name: string
  slug: string
  show_in_nav: boolean
  display_order: number
}

export default function NavbarCollectionsPage() {
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    try {
      const res = await api.get('/admin/collections')
      const list = (res.data || []) as CollectionRow[]
      const sorted = [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      setCollections(sorted.map((c) => ({ ...c, show_in_nav: c.show_in_nav !== false })))
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: 'Failed to load collections' })
    } finally {
      setLoading(false)
    }
  }

  function moveUp(index: number) {
    if (index <= 0) return
    const next = [...collections]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setCollections(next)
  }

  function moveDown(index: number) {
    if (index >= collections.length - 1) return
    const next = [...collections]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setCollections(next)
  }

  function setShowInNav(index: number, value: boolean) {
    const next = [...collections]
    next[index] = { ...next[index], show_in_nav: value }
    setCollections(next)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      for (const c of collections) {
        await api.patch(`/admin/collections/${c.id}`, { show_in_nav: c.show_in_nav })
      }
      await api.patch('/admin/collections/nav-order', {
        orderedIds: collections.map((c) => c.id),
      })
      setMessage({ type: 'success', text: 'Navbar collections saved.' })
    } catch (e) {
      console.error(e)
      setMessage({ type: 'error', text: 'Failed to save. Try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Navbar Collections</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Navbar Collections</h1>
      <p className="text-gray-600 text-sm mb-6">
        Choose which collections appear in the site navbar dropdown and drag to reorder. Only active collections are shown on the site.
      </p>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">In navbar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collections.map((c, index) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Move up"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === collections.length - 1}
                        className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Move down"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="text-gray-400 text-sm ml-2">{c.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.show_in_nav}
                        onChange={(e) => setShowInNav(index, e.target.checked)}
                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Show in dropdown</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
