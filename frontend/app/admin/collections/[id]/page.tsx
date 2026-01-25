'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'

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
    product_orders: {} as Record<string, number>, // product_id -> display_order
  })

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
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:105',message:'handleSubmit entry',data:{isNew,collectionId,formDataBefore:formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    setLoading(true)

    try {
      // Sort product_ids by their display_order
      const sortedProductIds = [...formData.product_ids].sort((a, b) => {
        const orderA = formData.product_orders[a] ?? 0
        const orderB = formData.product_orders[b] ?? 0
        return orderA - orderB
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:115',message:'sorted product ids',data:{originalCount:formData.product_ids.length,sortedProductIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      const payload: any = {
        name: formData.name,
        is_active: formData.is_active,
        display_order: parseInt(formData.display_order.toString()),
        show_on_homepage: formData.show_on_homepage,
        product_ids: sortedProductIds,
      }

      // Only include optional fields if they have values
      if (formData.slug) payload.slug = formData.slug
      if (formData.description) payload.description = formData.description
      if (formData.image_url) payload.image_url = formData.image_url
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:128',message:'payload before API call',data:{payload,isNew},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      let response
      if (isNew) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:131',message:'POST API call start',data:{url:'/admin/collections'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        response = await api.post('/admin/collections', payload)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:133',message:'POST API call success',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:135',message:'PATCH API call start',data:{url:`/admin/collections/${collectionId}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        response = await api.patch(`/admin/collections/${collectionId}`, payload)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:137',message:'PATCH API call success',data:{status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:140',message:'navigation start',data:{target:'/admin/collections'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      router.push('/admin/collections')
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:143',message:'handleSubmit error',data:{errorMessage:error?.message,errorResponse:error?.response?.data,statusCode:error?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error saving collection:', error)
      
      // Better error messages
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
      alert(errorMessage)
    } finally {
      setLoading(false)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:147',message:'handleSubmit exit',data:{loading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
  }

  function toggleProduct(productId: string) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:145',message:'toggleProduct before',data:{productId,isIncluded:formData.product_ids.includes(productId),currentProductCount:formData.product_ids.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const isIncluded = prev.product_ids.includes(productId)
      const newProductIds = isIncluded
        ? prev.product_ids.filter((id) => id !== productId)
        : [...prev.product_ids, productId]
      
      // Initialize order for new products
      const newProductOrders = { ...prev.product_orders }
      if (!isIncluded) {
        newProductOrders[productId] = newProductIds.length - 1
      } else {
        delete newProductOrders[productId]
      }

      const newState = {
        ...prev,
        product_ids: newProductIds,
        product_orders: newProductOrders,
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:163',message:'toggleProduct after',data:{newProductCount:newState.product_ids.length,newOrder:newProductOrders[productId]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return newState
    })
  }

  function moveProductUp(productId: string) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:168',message:'moveProductUp before',data:{productId,currentOrder:formData.product_orders[productId] ?? 0,allOrders:formData.product_orders},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const currentOrder = prev.product_orders[productId] ?? 0
      if (currentOrder === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:171',message:'moveProductUp early return',data:{reason:'already at top'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return prev
      }

      const newOrders = { ...prev.product_orders }
      // Find product with order - 1 and swap
      const swapProduct = Object.keys(newOrders).find(
        (id) => newOrders[id] === currentOrder - 1
      )
      if (swapProduct) {
        newOrders[swapProduct] = currentOrder
        newOrders[productId] = currentOrder - 1
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:180',message:'moveProductUp after swap',data:{productId,newOrder:newOrders[productId],swapProduct,swapProductNewOrder:newOrders[swapProduct]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }

      return { ...prev, product_orders: newOrders }
    })
  }

  function moveProductDown(productId: string) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:187',message:'moveProductDown before',data:{productId,currentOrder:formData.product_orders[productId] ?? 0,maxOrder:Math.max(...Object.values(formData.product_orders), -1),allOrders:formData.product_orders},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setFormData((prev) => {
      const currentOrder = prev.product_orders[productId] ?? 0
      const maxOrder = Math.max(...Object.values(prev.product_orders), -1)
      if (currentOrder >= maxOrder) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:191',message:'moveProductDown early return',data:{reason:'already at bottom'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return prev
      }

      const newOrders = { ...prev.product_orders }
      // Find product with order + 1 and swap
      const swapProduct = Object.keys(newOrders).find(
        (id) => newOrders[id] === currentOrder + 1
      )
      if (swapProduct) {
        newOrders[swapProduct] = currentOrder
        newOrders[productId] = currentOrder + 1
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:200',message:'moveProductDown after swap',data:{productId,newOrder:newOrders[productId],swapProduct,swapProductNewOrder:newOrders[swapProduct]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }

      return { ...prev, product_orders: newOrders }
    })
  }

  return (
    <div>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1} // Square aspect ratio for collections
        />
      )}
      <h1 className="text-3xl font-bold mb-6">{isNew ? 'New Collection' : 'Edit Collection'}</h1>
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

        <div>
          <label className="block font-semibold mb-2">Collection Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full px-4 py-2 border rounded mb-2"
          />
          {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
          {formData.image_url && (
            <div className="mt-4 relative w-64 h-64 border rounded overflow-hidden">
              <Image
                src={formData.image_url}
                alt="Collection preview"
                fill
                sizes="256px"
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold mb-2">Display Order</label>
          <input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
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
            <span className="text-gray-900">Active</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.show_on_homepage}
              onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
            />
            <span className="text-gray-900">Show on Homepage</span>
          </label>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-gray-900">Products</label>
          <div className="space-y-4">
            {/* Selected Products (with ordering) */}
            {formData.product_ids.length > 0 && (
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 text-gray-900">Selected Products (drag to reorder)</h3>
                {[...formData.product_ids]
                  .sort((a, b) => {
                    const orderA = formData.product_orders[a] ?? 0
                    const orderB = formData.product_orders[b] ?? 0
                    return orderA - orderB
                  })
                  .map((productId) => {
                    const product = products.find((p) => p.id === productId)
                    if (!product) return null
                    return (
                      <div key={productId} className="flex items-center gap-2 mb-2 p-2 bg-white rounded border">
                        <button
                          type="button"
                          onClick={() => moveProductUp(productId)}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 text-gray-900"
                          disabled={formData.product_orders[productId] === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProductDown(productId)}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100 text-gray-900"
                          disabled={formData.product_orders[productId] >= formData.product_ids.length - 1}
                        >
                          ↓
                        </button>
                        <span className="flex-1 text-gray-900">{product.title}</span>
                        <span className="text-sm text-gray-600">
                          Order: {formData.product_orders[productId] ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleProduct(productId)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Available Products */}
            <div className="border rounded p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-3 text-gray-900">Available Products</h3>
              {products
                .filter((product) => !formData.product_ids.includes(product.id))
                .map((product) => (
                  <label key={product.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span className="text-gray-900">{product.title}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Collection'}
          </button>
          <button
            type="button"
            onClick={() => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/2525556f-403b-4ef7-be9e-f747e584a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'collections/[id]/page.tsx:377',message:'cancel button clicked',data:{target:'/admin/collections'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              router.push('/admin/collections')
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
