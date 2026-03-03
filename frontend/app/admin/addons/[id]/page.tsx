'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'
import AdminPageHeader from '../../_components/AdminPageHeader'
import Toggle from '../../_components/Toggle'
import Toast, { useToast } from '../../_components/Toast'

export default function AdminAddonEditPage() {
  const params = useParams()
  const router = useRouter()
  const addonId = params.id as string
  const isNew = addonId === 'new'

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true,
    image_urls: [] as string[],
    product_ids: [] as string[],
  })
  const { toasts, showToast, dismissToast } = useToast()

  const loadProducts = useCallback(async () => {
    try {
      const response = await api.get('/admin/products')
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }, [])

  const loadAddon = useCallback(async () => {
    try {
      const response = await api.get(`/addons/${addonId}`)
      const addon = response.data
      setFormData({
        name: addon.name || '',
        description: addon.description || '',
        price: addon.price?.toString() || '',
        is_active: addon.is_active ?? true,
        image_urls: addon.addon_images?.map((img: any) => img.image_url) || [],
        product_ids: [],
      })
    } catch (error) {
      console.error('Error loading add-on:', error)
      showToast('error', 'Failed to load add-on')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonId])

  useEffect(() => {
    loadProducts()
    if (!isNew) {
      loadAddon()
    }
  }, [addonId, isNew, loadProducts, loadAddon])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreviewImageUrl(url)
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
      const fileExt = 'png'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `addons/${fileName}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, blob)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, data.publicUrl],
      }))
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
    if (previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        is_active: formData.is_active,
        image_urls: formData.image_urls,
        product_ids: formData.product_ids,
      }
      if (isNew) {
        await api.post('/addons', payload)
      } else {
        await api.patch(`/addons/${addonId}`, payload)
      }
      router.push('/admin/addons')
    } catch (error: any) {
      console.error('Error saving add-on:', error)
      showToast('error', error?.response?.data?.message || 'Failed to save add-on')
    } finally {
      setLoading(false)
    }
  }

  function toggleProduct(productId: string) {
    setFormData((prev) => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId],
    }))
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
        title={isNew ? 'New Add-on' : 'Edit Add-on'}
        breadcrumbs={[
          { label: 'Add-ons', href: '/admin/addons' },
          { label: isNew ? 'New' : 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Basic Info */}
          <div className="admin-card">
            <p className="admin-section-header">Basic Information</p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="admin-input"
                placeholder="e.g., Extra Ribbon"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="admin-input"
                style={{ resize: 'vertical' }}
                placeholder="Describe the add-on..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Price (EGP) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="admin-input"
                style={{ maxWidth: 160 }}
                placeholder="e.g., 25.00"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle
                checked={formData.is_active}
                onChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Active (available to customers)</span>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card">
            <p className="admin-section-header">Images</p>

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
                marginBottom: formData.image_urls.length > 0 ? 16 : 0,
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 28, marginBottom: 8 }}>🖼️</span>
              <span style={{ fontSize: 14, color: 'var(--admin-text-2)' }}>
                {uploading ? 'Uploading...' : 'Click to upload image'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--admin-text-3)', marginTop: 4 }}>
                PNG, JPG, WEBP — square recommended
              </span>
            </label>

            {formData.image_urls.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: 12,
                }}
              >
                {formData.image_urls.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 'var(--admin-radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--admin-border)',
                    }}
                  >
                    <Image
                      src={url}
                      alt={`Add-on ${index + 1}`}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'var(--admin-danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        fontSize: 14,
                        lineHeight: '22px',
                        textAlign: 'center',
                        zIndex: 10,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign to Products */}
          <div className="admin-card">
            <p className="admin-section-header">Assign to Products</p>
            <p style={{ fontSize: 13, color: 'var(--admin-text-2)', marginBottom: 12 }}>
              Select which products this add-on is available for.
            </p>
            <div
              style={{
                maxHeight: 260,
                overflowY: 'auto',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-sm)',
                padding: 12,
              }}
            >
              {products.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--admin-text-3)', textAlign: 'center', padding: '20px 0' }}>
                  No products found
                </p>
              ) : (
                products.map((product) => (
                  <label
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 0',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--admin-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.product_ids.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>{product.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/admin/addons')} className="admin-btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="admin-btn-primary">
              {loading ? 'Saving...' : 'Save Add-on'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
