'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'

export default function AdminProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const isNew = productId === 'new'

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    base_price: '',
    discount_price: '',
    stock_quantity: '',
    points_value: '',
    is_active: true,
    minimum_order_enabled: false,
    minimum_quantity: '',
    image_urls: [] as string[],
    variations: [] as any[],
  })

  const [uploading, setUploading] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')

  useEffect(() => {
    if (!isNew) {
      loadProduct()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function loadProduct() {
    try {
      const response = await api.get(`/admin/products/${productId}`)
      const product = response.data
      setFormData({
        title: product.title || '',
        description: product.description || '',
        base_price: product.base_price?.toString() || '',
        discount_price: product.discount_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        points_value: product.points_value?.toString() ?? '0',
        is_active: product.is_active ?? true,
        minimum_order_enabled: product.minimum_quantity != null && product.minimum_quantity >= 1,
        minimum_quantity: product.minimum_quantity != null ? String(product.minimum_quantity) : '1',
        image_urls: product.product_images?.map((img: any) => img.image_url) || [],
        variations: product.product_variations?.map((v: any) => ({
          name: v.name,
          display_order: v.display_order,
          options: v.product_variation_options?.map((opt: any) => ({
            label: opt.label,
            price_modifier: opt.price_modifier?.toString() || '0',
            stock_quantity: opt.stock_quantity?.toString() ?? '0',
          })) || [],
        })) || [],
      })
    } catch (error) {
      console.error('Error loading product:', error)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview URL and show crop modal
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreviewImageUrl(url)
      setShowImagePreview(true)
    }
    reader.readAsDataURL(file)
    
    // Reset input
    e.target.value = ''
  }

  async function handleCropComplete(croppedImageUrl: string) {
    setShowImagePreview(false)
    
    if (!supabase) {
      alert('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
      return
    }

    setUploading(true)
    try {
      // Convert blob URL to blob
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      
      const fileExt = 'png'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, data.publicUrl],
      }))
      
      // Clean up blob URL
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
    // Clean up blob URL if it exists
    if (previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Filter out empty variation options and variations with no valid options
      const validVariations = formData.variations
        .map((v: any) => ({
          ...v,
          options: v.options
            .filter((opt: { label: string; price_modifier: string }) => opt.label.trim() !== '')
            .map((opt: { label: string; price_modifier: string; stock_quantity?: string }) => ({
              ...opt,
              price_modifier: parseFloat(opt.price_modifier || '0'),
              stock_quantity: parseInt(opt.stock_quantity || '0', 10),
            })),
        }))
        .filter((v: any) => v.name.trim() !== '' && v.options.length > 0)

      // Minimum order quantity: required when toggle is ON
      if (formData.minimum_order_enabled) {
        const minQty = parseInt(formData.minimum_quantity, 10)
        if (!Number.isInteger(minQty) || minQty < 1) {
          alert('When minimum order quantity is enabled, minimum quantity must be at least 1.')
          setLoading(false)
          return
        }
      }

      const basePrice = parseFloat(formData.base_price)
      const stockQty = parseInt(formData.stock_quantity, 10)
      if (Number.isNaN(basePrice) || basePrice < 0) {
        alert('Please enter a valid base price (number ≥ 0).')
        setLoading(false)
        return
      }
      if (Number.isNaN(stockQty) || stockQty < 0) {
        alert('Please enter a valid stock quantity (whole number ≥ 0).')
        setLoading(false)
        return
      }

      // Only send fields allowed by backend DTO (forbidNonWhitelisted rejects extra keys).
      // Build minimal payload: omit optional keys when empty so backend never gets invalid values.
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        base_price: basePrice,
        stock_quantity: stockQty,
        is_active: formData.is_active ?? true,
      }
      const desc = formData.description?.trim()
      if (desc) payload.description = desc
      const discountPrice = formData.discount_price ? parseFloat(formData.discount_price) : NaN
      if (!Number.isNaN(discountPrice) && discountPrice >= 0) payload.discount_price = discountPrice
      const pointsVal = parseInt(formData.points_value || '0', 10)
      if (!Number.isNaN(pointsVal) && pointsVal >= 0) payload.points_value = pointsVal
      if (formData.minimum_order_enabled) {
        const minQty = parseInt(formData.minimum_quantity, 10)
        if (!Number.isNaN(minQty) && minQty >= 1) payload.minimum_quantity = minQty
      } else if (!isNew) {
        payload.minimum_quantity = null
      }
      if (formData.image_urls?.length) payload.image_urls = formData.image_urls
      if (validVariations.length > 0) payload.variations = validVariations

      let response
      if (isNew) {
        response = await api.post('/admin/products', payload)
      } else {
        response = await api.patch(`/admin/products/${productId}`, payload)
      }

      router.push('/admin/products')
    } catch (error: any) {
      console.error('Error saving product:', error)
      if (error?.response?.data) {
        console.error('Backend response:', error.response.data)
      }
      let errorMessage = 'Failed to save product'
      const msg = error?.response?.data?.message
      if (msg) {
        errorMessage = Array.isArray(msg) ? msg.join(' ') : String(msg)
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function addVariation() {
    setFormData((prev) => {
      const newState = {
        ...prev,
        variations: [...prev.variations, { name: '', display_order: 0, options: [] }],
      }
      return newState
    })
  }

  function removeVariation(index: number) {
    setFormData((prev) => {
      const newState = {
        ...prev,
        variations: prev.variations.filter((_: any, i: number) => i !== index),
      }
      return newState
    })
  }

  function addVariationOption(variationIndex: number) {
    setFormData((prev) => {
      const variations = [...prev.variations]
      variations[variationIndex].options.push({ label: '', price_modifier: '0', stock_quantity: '0' })
      return { ...prev, variations }
    })
  }

  return (
    <div>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1} // Square aspect ratio for products
        />
      )}
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'New Product' : 'Edit Product'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
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
            rows={4}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Base Price *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Discount Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.discount_price}
              onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Stock Quantity *</label>
          <input
            type="number"
            required
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Points earned from this product</label>
          <p className="text-sm text-gray-600 mb-1">Customer earns this many loyalty points when purchasing this product.</p>
          <input
            type="number"
            min="0"
            value={formData.points_value}
            onChange={(e) => setFormData({ ...formData, points_value: e.target.value })}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={formData.minimum_order_enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minimum_order_enabled: e.target.checked,
                  minimum_quantity: e.target.checked ? formData.minimum_quantity || '1' : '',
                })
              }
            />
            <span>Minimum order quantity</span>
          </label>
          {formData.minimum_order_enabled && (
            <div className="ml-6 mt-2">
              <label className="block font-medium mb-1 text-gray-700">Minimum quantity</label>
              <input
                type="number"
                min={1}
                required={formData.minimum_order_enabled}
                value={formData.minimum_quantity}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimum_quantity: e.target.value,
                  }))
                }
                className="w-32 px-4 py-2 border rounded"
              />
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
            <span>Active</span>
          </label>
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
                  alt={`Product ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImageUrls = formData.image_urls.filter((_: string, i: number) => i !== index)
                    setFormData({
                      ...formData,
                      image_urls: newImageUrls,
                    })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block font-semibold">Variations</label>
            <button
              type="button"
              onClick={addVariation}
              className="text-blue-600 hover:underline"
            >
              + Add Variation
            </button>
          </div>
          {formData.variations.map((variation, vIndex) => (
            <div key={vIndex} className="border p-4 rounded mb-4">
              <div className="flex justify-between mb-2">
                <input
                  type="text"
                  placeholder="Variation name (e.g., Size)"
                  value={variation.name}
                  onChange={(e) => {
                    const variations = [...formData.variations]
                    variations[vIndex].name = e.target.value
                    setFormData({ ...formData, variations })
                  }}
                  className="flex-1 px-3 py-2 border rounded mr-2"
                />
                <button
                  type="button"
                  onClick={() => removeVariation(vIndex)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-2">
                {variation.options.map((option: { label: string; price_modifier: string; stock_quantity?: string }, oIndex: number) => (
                  <div key={oIndex} className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Option label"
                      value={option.label}
                      onChange={(e) => {
                        const variations = [...formData.variations]
                        variations[vIndex].options[oIndex].label = e.target.value
                        setFormData({ ...formData, variations })
                      }}
                      className="flex-1 min-w-[120px] px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price mod."
                      value={option.price_modifier}
                      onChange={(e) => {
                        const variations = [...formData.variations]
                        variations[vIndex].options[oIndex].price_modifier = e.target.value
                        setFormData({ ...formData, variations })
                      }}
                      className="w-24 px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Stock"
                      value={option.stock_quantity ?? '0'}
                      onChange={(e) => {
                        const variations = [...formData.variations]
                        variations[vIndex].options[oIndex].stock_quantity = e.target.value
                        setFormData({ ...formData, variations })
                      }}
                      className="w-20 px-3 py-2 border rounded"
                      title="Stock for this variation option"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const variations = [...formData.variations]
                        variations[vIndex].options = variations[vIndex].options.filter((_: any, i: number) => i !== oIndex)
                        setFormData({ ...formData, variations })
                      }}
                      className="text-red-600 hover:underline"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addVariationOption(vIndex)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            onClick={() => {
              router.push('/admin/products')
            }}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
