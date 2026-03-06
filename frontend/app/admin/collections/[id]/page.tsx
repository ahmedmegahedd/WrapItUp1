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

export default function AdminCollectionEditPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string
  const isNew = collectionId === 'new'

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0,
    show_on_homepage: false,
    product_ids: [] as string[],
    product_orders: {} as Record<string, number>,
  })
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadProducts()
    if (!isNew) {
      loadCollection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  async function loadProducts() {
    try {
      const response = await api.get('/admin/products')
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  async function loadCollection() {
    try {
      const response = await api.get(`/admin/collections/${collectionId}`)
      const collection = response.data
      const productOrders: Record<string, number> = {}
      collection.collection_products?.forEach((cp: any, index: number) => {
        productOrders[cp.product_id] = cp.display_order ?? index
      })
      setFormData({
        name: collection.name || '',
        slug: collection.slug || '',
        description: collection.description || '',
        image_url: collection.image_url || '',
        is_active: collection.is_active ?? true,
        display_order: collection.display_order || 0,
        show_on_homepage: collection.show_on_homepage ?? false,
        product_ids: collection.collection_products?.map((cp: any) => cp.product_id) || [],
        product_orders: productOrders,
      })
    } catch (error) {
      console.error('Error loading collection:', error)
      showToast('error', 'Failed to load collection')
    }
  }

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
      const filePath = `collections/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob)
      if (uploadError) {
        throw uploadError
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setFormData((prev) => ({
        ...prev,
        image_url: data.publicUrl,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const sortedProductIds = [...formData.product_ids].sort((a, b) => {
        const orderA = formData.product_orders[a] ?? 0
        const orderB = formData.product_orders[b] ?? 0
        return orderA - orderB
      })

      const payload: any = {
        name: formData.name,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order.toString()),
        show_on_homepage: formData.show_on_homepage,
        product_ids: sortedProductIds,
      }

      if (formData.slug) payload.slug = formData.slug
      if (formData.description) payload.description = formData.description
      if (formData.image_url) payload.image_url = formData.image_url

      if (isNew) {
        await api.post('/admin/collections', payload)
      } else {
        await api.patch(`/admin/collections/${collectionId}`, payload)
      }

      router.push('/admin/collections')
    } catch (error: any) {
      console.error('Error saving collection:', error)
      let errorMessage = 'Failed to save collection'
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message
        if (backendMessage.includes('duplicate key') && backendMessage.includes('slug')) {
          errorMessage = 'A collection with this slug already exists. Please use a unique slug.'
        } else if (backendMessage.includes('validation')) {
          errorMessage = `Validation error: ${backendMessage}`
        } else {
          errorMessage = backendMessage
        }
      }
      showToast('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function toggleProduct(productId: string) {
    setFormData((prev) => {
      const isIncluded = prev.product_ids.includes(productId)
      const newProductIds = isIncluded
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId]
      const newProductOrders = { ...prev.product_orders }
      if (!isIncluded) {
        newProductOrders[productId] = newProductIds.length - 1
      } else {
        delete newProductOrders[productId]
      }
      return {
        ...prev,
        product_ids: newProductIds,
        product_orders: newProductOrders,
      }
    })
  }

  function moveProductUp(productId: string) {
    setFormData((prev) => {
      const currentOrder = prev.product_orders[productId] ?? 0
      if (currentOrder === 0) return prev
      const newOrders = { ...prev.product_orders }
      const swapProduct = Object.keys(newOrders).find(
        (id) => newOrders[id] === currentOrder - 1
      )
      if (swapProduct) {
        newOrders[swapProduct] = currentOrder
        newOrders[productId] = currentOrder - 1
      }
      return { ...prev, product_orders: newOrders }
    })
  }

  function moveProductDown(productId: string) {
    setFormData((prev) => {
      const currentOrder = prev.product_orders[productId] ?? 0
      const maxOrder = Math.max(...Object.values(prev.product_orders), -1)
      if (currentOrder >= maxOrder) return prev
      const newOrders = { ...prev.product_orders }
      const swapProduct = Object.keys(newOrders).find(
        (id) => newOrders[id] === currentOrder + 1
      )
      if (swapProduct) {
        newOrders[swapProduct] = currentOrder
        newOrders[productId] = currentOrder + 1
      }
      return { ...prev, product_orders: newOrders }
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  return (
    <div className="admin-product-form-wrap">
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
        title={isNew ? 'New Collection' : 'Edit Collection'}
        breadcrumbs={[
          { label: 'Collections', href: '/admin/collections' },
          { label: isNew ? 'New' : 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Basic Info */}
          <div className="admin-card">
            <p className="admin-section-header">Basic Information</p>

            <div className="admin-product-grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                  placeholder="e.g., Birthday Collection"
                />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="admin-input"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="admin-input"
                style={{ resize: 'vertical' }}
                placeholder="Describe this collection..."
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                }
                className="admin-input"
                style={{ maxWidth: 120 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle
                  checked={formData.is_active}
                  onChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle
                  checked={formData.show_on_homepage}
                  onChange={(v) => setFormData({ ...formData, show_on_homepage: v })}
                />
                <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Show on Homepage</span>
              </div>
            </div>
          </div>

          {/* Collection Image */}
          <div className="admin-card">
            <p className="admin-section-header">Collection Image</p>

            <div className="admin-image-grid" style={{ marginBottom: formData.image_url ? 16 : 0 }}>
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed var(--admin-border)',
                    borderRadius: 'var(--admin-radius)',
                    padding: '20px 12px',
                    textAlign: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 24 }}>📷</span>
                  <span style={{ fontSize: 13, color: 'var(--admin-text-2)', fontWeight: 500 }}>
                    {uploading ? 'Uploading...' : 'Take Photo'}
                  </span>
                </div>
              </label>
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed var(--admin-border)',
                    borderRadius: 'var(--admin-radius)',
                    padding: '20px 12px',
                    textAlign: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🖼️</span>
                  <span style={{ fontSize: 13, color: 'var(--admin-text-2)', fontWeight: 500 }}>
                    Choose from Library
                  </span>
                </div>
              </label>
            </div>

            {formData.image_url && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 'var(--admin-radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--admin-border)',
                  }}
                >
                  <Image
                    src={formData.image_url}
                    alt="Collection preview"
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                  className="admin-btn-ghost"
                  style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Products */}
          <div className="admin-card">
            <p className="admin-section-header">Products</p>

            {formData.product_ids.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--admin-text-2)',
                    marginBottom: 10,
                  }}
                >
                  Selected Products ({formData.product_ids.length})
                </p>
                <div
                  style={{
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {[...formData.product_ids]
                    .sort(
                      (a, b) =>
                        (formData.product_orders[a] ?? 0) - (formData.product_orders[b] ?? 0)
                    )
                    .map((productId) => {
                      const product = products.find((p) => p.id === productId)
                      if (!product) return null
                      return (
                        <div
                          key={productId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--admin-border)',
                            background: 'var(--admin-surface)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => moveProductUp(productId)}
                            className="admin-btn-ghost"
                            style={{ padding: '2px 8px', fontSize: 13 }}
                            disabled={formData.product_orders[productId] === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveProductDown(productId)}
                            className="admin-btn-ghost"
                            style={{ padding: '2px 8px', fontSize: 13 }}
                            disabled={
                              formData.product_orders[productId] >=
                              formData.product_ids.length - 1
                            }
                          >
                            ↓
                          </button>
                          <span style={{ flex: 1, fontSize: 14, color: 'var(--admin-text)' }}>
                            {product.title}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>
                            #{(formData.product_orders[productId] ?? 0) + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleProduct(productId)}
                            style={{
                              fontSize: 13,
                              color: 'var(--admin-danger)',
                              background: 'none',
                              border: 'none',
                              padding: '2px 6px',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 10 }}>
              Available Products
            </p>
            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-sm)',
                padding: '8px 12px',
              }}
            >
              {products
                .filter((product) => !formData.product_ids.includes(product.id))
                .map((product) => (
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
                      checked={false}
                      onChange={() => toggleProduct(product.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--admin-accent)' }}
                    />
                    <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>{product.title}</span>
                  </label>
                ))}
              {products.filter((p) => !formData.product_ids.includes(p.id)).length === 0 && (
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--admin-text-3)',
                    textAlign: 'center',
                    padding: '12px 0',
                  }}
                >
                  All products are selected
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'var(--admin-surface)',
              borderTop: '1px solid var(--admin-border)',
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/admin/collections')}
              className="admin-btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="admin-btn-primary">
              {loading ? 'Saving...' : 'Save Collection'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
