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
    slug: '',
    description: '',
    base_price: '',
    discount_price: '',
    stock_quantity: '',
    points_value: '',
    is_active: true,
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
        slug: product.slug || '',
        description: product.description || '',
        base_price: product.base_price?.toString() || '',
        discount_price: product.discount_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        points_value: product.points_value?.toString() ?? '0',
        is_active: product.is_active ?? true,
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:100',message:'handleSubmit entry',data:{isNew,productId,formDataBefore:formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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

      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        points_value: parseInt(formData.points_value || '0', 10),
        variations: validVariations.length > 0 ? validVariations : undefined,
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:110',message:'variations filtered',data:{originalCount:formData.variations.length,validCount:validVariations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:117',message:'payload before API call',data:{payload,isNew},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      let response
      if (isNew) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:120',message:'POST API call start',data:{url:'/admin/products'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        response = await api.post('/admin/products', payload)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:122',message:'POST API call success',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:125',message:'PATCH API call start',data:{url:`/admin/products/${productId}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        response = await api.patch(`/admin/products/${productId}`, payload)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:127',message:'PATCH API call success',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:130',message:'navigation start',data:{target:'/admin/products'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      router.push('/admin/products')
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:133',message:'handleSubmit error',data:{errorMessage:error?.message,errorResponse:error?.response?.data,statusCode:error?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error saving product:', error)
      
      // Better error messages
      let errorMessage = 'Failed to save product'
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message
        if (backendMessage.includes('validation')) {
          errorMessage = `Validation error: ${backendMessage}`
        } else {
          errorMessage = backendMessage
        }
      }
      alert(errorMessage)
    } finally {
      setLoading(false)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:137',message:'handleSubmit exit',data:{loading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
  }

  function addVariation() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:134',message:'addVariation before',data:{currentVariationCount:formData.variations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const newState = {
        ...prev,
        variations: [...prev.variations, { name: '', display_order: 0, options: [] }],
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:137',message:'addVariation after',data:{newVariationCount:newState.variations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return newState
    })
  }

  function removeVariation(index: number) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:141',message:'removeVariation before',data:{index,currentVariationCount:formData.variations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const newState = {
        ...prev,
        variations: prev.variations.filter((_: any, i: number) => i !== index),
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:144',message:'removeVariation after',data:{newVariationCount:newState.variations.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return newState
    })
  }

  function addVariationOption(variationIndex: number) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:148',message:'addVariationOption before',data:{variationIndex,currentOptionCount:formData.variations[variationIndex]?.options?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const variations = [...prev.variations]
      variations[variationIndex].options.push({ label: '', price_modifier: '0', stock_quantity: '0' })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:151',message:'addVariationOption after',data:{newOptionCount:variations[variationIndex].options.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
          <label className="block font-semibold mb-2">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            placeholder="Auto-generated if empty"
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
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:271',message:'removeImage before',data:{index,currentImageCount:formData.image_urls.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    const newImageUrls = formData.image_urls.filter((_: string, i: number) => i !== index)
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:274',message:'removeImage after',data:{newImageCount:newImageUrls.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
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
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:432',message:'removeOption before',data:{vIndex,oIndex,currentOptionCount:formData.variations[vIndex]?.options?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                        const variations = [...formData.variations]
                        variations[vIndex].options = variations[vIndex].options.filter((_: any, i: number) => i !== oIndex)
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:435',message:'removeOption after',data:{newOptionCount:variations[vIndex].options.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
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
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'products/[id]/page.tsx:380',message:'cancel button clicked',data:{target:'/admin/products'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
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
