'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function AdminAddonsPage() {
  const router = useRouter()
  const [addons, setAddons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAddons()
  }, [])

  async function loadAddons() {
    try {
      const response = await api.get('/addons?includeInactive=true')
      setAddons(response.data || [])
    } catch (error) {
      console.error('Error loading add-ons:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this add-on?')) return

    try {
      await api.delete(`/addons/${id}`)
      loadAddons()
    } catch (error) {
      console.error('Error deleting add-on:', error)
      alert('Failed to delete add-on')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add-ons</h1>
        <Link
          href="/admin/addons/new"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          New Add-on
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {addons.length > 0 ? (
              addons.map((addon) => (
                <tr key={addon.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{addon.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    ${parseFloat(addon.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        addon.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/addons/${addon.id}`}
                      className="text-gray-900 hover:text-gray-700 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(addon.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No add-ons found. Create your first add-on to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
