'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'

export default function AdminRewardEditPage() {
  const params = useParams()
  const router = useRouter()
  const rewardId = params.id as string
  const isNew = rewardId === 'new'

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: '',
    image_url: '',
    is_active: true,
  })

  useEffect(() => {
    if (!isNew) loadReward()
  }, [rewardId])

  async function loadReward() {
    try {
      const response = await api.get(`/admin/rewards/${rewardId}`)
      const r = response.data
      setFormData({
        title: r.title || '',
        description: r.description || '',
        points_required: r.points_required?.toString() ?? '',
        image_url: r.image_url || '',
        is_active: r.is_active ?? true,
      })
    } catch (error) {
      console.error('Error loading reward:', error)
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImageUrl(e.target?.result as string)
      setShowImagePreview(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCropComplete(croppedImageUrl: string) {
    setShowImagePreview(false)
    if (!supabase) {
      alert('Supabase is not configured.')
      return
    }
    setUploading(true)
    try {
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const filePath = `rewards/${Math.random()}.png`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, blob)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }))
      URL.revokeObjectURL(croppedImageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    setShowImagePreview(false)
    setPreviewImageUrl('')
    if (previewImageUrl.startsWith('blob:')) URL.revokeObjectURL(previewImageUrl)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        points_required: parseInt(formData.points_required || '0', 10),
        image_url: formData.image_url || undefined,
        is_active: formData.is_active,
      }
      if (isNew) {
        await api.post('/admin/rewards', payload)
      } else {
        await api.patch(`/admin/rewards/${rewardId}`, payload)
      }
      router.push('/admin/rewards')
    } catch (error: any) {
      console.error('Error saving reward:', error)
      alert(error?.response?.data?.message || 'Failed to save reward')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'New Reward' : 'Edit Reward'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-w-xl">
        <div>
          <label className="block font-semibold mb-2">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Points required to redeem *</label>
          <input
            type="number"
            min="1"
            required
            value={formData.points_required}
            onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="mb-2"
          />
          {formData.image_url && (
            <div className="relative w-24 h-24 rounded overflow-hidden bg-gray-100 mt-2">
              <Image src={formData.image_url} alt="" fill className="object-cover" sizes="96px" />
            </div>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span>Active (visible to customers)</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/rewards')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
