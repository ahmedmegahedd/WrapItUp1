'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'
import AdminPageHeader from '../../_components/AdminPageHeader'
import Toggle from '../../_components/Toggle'
import Toast, { useToast } from '../../_components/Toast'

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
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    if (!isNew) loadReward()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showToast('error', 'Failed to load reward')
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
      showToast('error', 'Supabase is not configured.')
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
      showToast('error', 'Failed to upload image')
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
      showToast('error', error?.response?.data?.message || 'Failed to save reward')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      <AdminPageHeader
        title={isNew ? 'New Reward' : 'Edit Reward'}
        breadcrumbs={[
          { label: 'Rewards', href: '/admin/rewards' },
          { label: isNew ? 'New' : 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        {/* Details Card */}
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <p className="admin-section-header">Reward Details</p>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="admin-input"
              placeholder="e.g., Free Delivery"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-input"
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder="Describe what the customer gets when they redeem this reward"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Points Required *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.points_required}
              onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
              className="admin-input"
              style={{ maxWidth: 160 }}
              placeholder="e.g., 500"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle
              checked={formData.is_active}
              onChange={(v) => setFormData({ ...formData, is_active: v })}
            />
            <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Active (visible to customers)</span>
          </div>
        </div>

        {/* Image Card */}
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <p className="admin-section-header">Reward Image</p>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'center',
              marginBottom: formData.image_url ? 16 : 0,
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: 28, marginBottom: 8 }}>🎁</span>
            <span style={{ fontSize: 14, color: 'var(--admin-text-2)' }}>
              {uploading ? 'Uploading...' : 'Click to upload reward image'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
              PNG, JPG, WEBP — square recommended
            </span>
          </label>

          {formData.image_url && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  borderRadius: 'var(--admin-radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--admin-border)',
                }}
              >
                <Image src={formData.image_url} alt="" fill className="object-cover" sizes="80px" />
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                className="admin-btn-ghost"
                style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.push('/admin/rewards')} className="admin-btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="admin-btn-primary">
            {loading ? 'Saving...' : 'Save Reward'}
          </button>
        </div>
      </form>
    </div>
  )
}
