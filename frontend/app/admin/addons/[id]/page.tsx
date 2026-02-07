'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'

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
        product_ids: [], // Will need to fetch separately
      })
    } catch (error) {
      console.error('Error loading add-on:', error)
    }
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
      alert('Supabase is not configured.')
      return
    }

    setUploading(true)
    try {
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()

      const fileExt = 'png'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `addons/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, data.publicUrl],
      }))

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
      alert(error?.response?.data?.message || 'Failed to save add-on')
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
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'New Add-on' : 'Edit Add-on'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block font-semibold mb-2">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Price *</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Images</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="mb-4"
          />
          {uploading && <div className="text-gray-600">Uploading...</div>}
          <div className="grid grid-cols-4 gap-4">
            {formData.image_urls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <Image
                  src={url}
                  alt={`Add-on ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Assign to Products</label>
          <div className="max-h-64 overflow-y-auto border rounded p-4 space-y-2">
            {products.map((product) => (
              <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.product_ids.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="rounded"
                />
                <span className="text-gray-900">{product.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="text-gray-900">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/addons')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
