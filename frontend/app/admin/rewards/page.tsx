'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRewards()
  }, [])

  async function loadRewards() {
    try {
      const response = await api.get('/admin/rewards')
      setRewards(response.data || [])
    } catch (error) {
      console.error('Error loading rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this reward?')) return
    try {
      await api.delete(`/admin/rewards/${id}`)
      loadRewards()
    } catch (error) {
      console.error('Error deleting reward:', error)
      alert('Failed to delete reward')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Points &amp; Rewards</h1>
        <Link
          href="/admin/rewards/new"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          New Reward
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points required</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <tr key={reward.id}>
                  <td className="px-6 py-4">
                    {reward.image_url ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={reward.image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{reward.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{reward.points_required} pts</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        reward.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {reward.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/rewards/${reward.id}`} className="text-gray-900 hover:text-gray-700 mr-4">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(reward.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No rewards yet. Create one to let customers redeem points.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
