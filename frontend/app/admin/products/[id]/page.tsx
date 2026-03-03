'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'
import Toggle from '../../_components/Toggle'
import Toast, { useToast } from '../../_components/Toast'
import AdminPageHeader from '../../_components/AdminPageHeader'

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
  const { toasts, showToast, dismissToast } = useToast()

  type MaterialOption = { id: string; name: string; unit: string; stock_quantity: number; stock_status: string }
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [recipe, setRecipe] = useState<Array<{ materialId: string; quantity: string }>>([])

  useEffect(() => {
    api.get('/admin/inventory').then((res) => setMaterials(res.data || [])).catch(() => setMaterials([]))
  }, [])
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
    if (!isNew) {
      try {
        const recipeRes = await api.get(`/admin/inventory/product/${productId}`)
        const rows = (recipeRes.data || []).map((r: { material_id: string; quantity: number }) => ({
          materialId: r.material_id,
          quantity: String(r.quantity),
        }))
        setRecipe(rows)
      } catch {
        setRecipe([])
      }
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
      showToast('error', 'Supabase is not configured. Please check your .env.local file.')
      return
    }
    setUploading(true)
    try {
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const fileExt = 'png'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `products/${fileName}`
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

      if (formData.minimum_order_enabled) {
        const minQty = parseInt(formData.minimum_quantity, 10)
        if (!Number.isInteger(minQty) || minQty < 1) {
          showToast('error', 'When minimum order quantity is enabled, minimum quantity must be at least 1.')
          setLoading(false)
          return
        }
      }

      const basePrice = parseFloat(formData.base_price)
      const stockQty = parseInt(formData.stock_quantity, 10)
      if (Number.isNaN(basePrice) || basePrice < 0) {
        showToast('error', 'Please enter a valid base price (number ≥ 0).')
        setLoading(false)
        return
      }
      if (Number.isNaN(stockQty) || stockQty < 0) {
        showToast('error', 'Please enter a valid stock quantity (whole number ≥ 0).')
        setLoading(false)
        return
      }

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

      let savedProductId: string
      if (isNew) {
        const createRes = await api.post('/admin/products', payload)
        savedProductId = createRes.data?.id ?? productId
      } else {
        await api.patch(`/admin/products/${productId}`, payload)
        savedProductId = productId
      }
      const validRecipe = recipe
        .filter((r) => r.materialId && parseFloat(r.quantity) > 0)
        .map((r) => ({ materialId: r.materialId, quantity: parseFloat(r.quantity) }))
      if (savedProductId) {
        try {
          await api.put(`/admin/inventory/product/${savedProductId}`, { materials: validRecipe })
        } catch (err) {
          console.warn('Failed to save recipe:', err)
        }
      }
      router.push('/admin/products')
    } catch (error: any) {
      console.error('Error saving product:', error)
      let errorMessage = 'Failed to save product'
      const msg = error?.response?.data?.message
      if (msg) {
        errorMessage = Array.isArray(msg) ? msg.join(' ') : String(msg)
      }
      showToast('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  function addVariation() {
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, { name: '', display_order: 0, options: [] }],
    }))
  }

  function removeVariation(index: number) {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_: any, i: number) => i !== index),
    }))
  }

  function addVariationOption(variationIndex: number) {
    setFormData((prev) => {
      const variations = [...prev.variations]
      variations[variationIndex].options.push({ label: '', price_modifier: '0', stock_quantity: '0' })
      return { ...prev, variations }
    })
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius-sm)',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'var(--admin-surface)',
    color: 'var(--admin-text)',
    width: '100%',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius)',
    boxShadow: 'var(--admin-shadow)',
    padding: 20,
    marginBottom: 16,
  }

  return (
    <div style={{ padding: '24px 24px 100px', maxWidth: 780, margin: '0 auto' }}>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}

      <AdminPageHeader
        title={isNew ? 'New Product' : 'Edit Product'}
        breadcrumbs={[
          { label: 'Products', href: '/admin/products' },
          { label: isNew ? 'New' : 'Edit' },
        ]}
      />

      <form id="product-form" onSubmit={handleSubmit}>
        {/* Basic info */}
        <div style={sectionStyle}>
          <div className="admin-section-header">Basic Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="admin-input"
                placeholder="Product name"
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="admin-input"
                placeholder="Product description…"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <Toggle
                checked={formData.is_active}
                onChange={(v) => setFormData({ ...formData, is_active: v })}
                label="Active (visible in store)"
              />
            </div>
          </div>
        </div>

        {/* Pricing & stock */}
        <div style={sectionStyle}>
          <div className="admin-section-header">Pricing &amp; Stock</div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
            <div>
              <label style={labelStyle}>Base Price (E£) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                className="admin-input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={labelStyle}>Discount Price (E£)</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                className="admin-input"
                placeholder="Leave blank for no discount"
              />
            </div>
            <div>
              <label style={labelStyle}>Stock Quantity *</label>
              <input
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="admin-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Loyalty & ordering */}
        <div style={sectionStyle}>
          <div className="admin-section-header">Loyalty &amp; Order Rules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Loyalty Points</label>
              <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 6 }}>
                Points earned by the customer when purchasing this product.
              </p>
              <input
                type="number"
                min="0"
                value={formData.points_value}
                onChange={(e) => setFormData({ ...formData, points_value: e.target.value })}
                className="admin-input"
                style={{ maxWidth: 160 }}
                placeholder="0"
              />
            </div>
            <div>
              <Toggle
                checked={formData.minimum_order_enabled}
                onChange={(v) =>
                  setFormData({
                    ...formData,
                    minimum_order_enabled: v,
                    minimum_quantity: v ? formData.minimum_quantity || '1' : '',
                  })
                }
                label="Enforce minimum order quantity"
              />
              {formData.minimum_order_enabled && (
                <div style={{ marginTop: 12, marginLeft: 54 }}>
                  <label style={labelStyle}>Minimum quantity</label>
                  <input
                    type="number"
                    min={1}
                    required={formData.minimum_order_enabled}
                    value={formData.minimum_quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minimum_quantity: e.target.value }))
                    }
                    className="admin-input"
                    style={{ maxWidth: 120 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <div className="admin-section-header">Images</div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              border: '2px dashed var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              padding: '20px',
              marginBottom: 16,
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: 'var(--admin-surface-2)',
              opacity: uploading ? 0.6 : 1,
              fontSize: 14,
              color: 'var(--admin-text-2)',
            }}
          >
            <span style={{ fontSize: 20 }}>🖼️</span>
            {uploading ? 'Uploading…' : 'Click to upload image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {formData.image_urls.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: 10,
              }}
            >
              {formData.image_urls.map((url, index) => (
                <div
                  key={index}
                  style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}
                >
                  <Image
                    src={url}
                    alt={`Product ${index + 1}`}
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        image_urls: formData.image_urls.filter((_: string, i: number) => i !== index),
                      })
                    }
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(192,57,43,0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      minHeight: 'unset',
                      minWidth: 'unset',
                      fontSize: 14,
                      lineHeight: 1,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variations */}
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div className="admin-section-header" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
              Variations
            </div>
            <button
              type="button"
              onClick={addVariation}
              className="admin-btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              + Add Variation
            </button>
          </div>

          {formData.variations.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--admin-text-3)', textAlign: 'center', padding: '12px 0' }}>
              No variations. Add one if the product comes in different sizes, colors, etc.
            </p>
          )}

          {formData.variations.map((variation, vIndex) => (
            <div
              key={vIndex}
              style={{
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-sm)',
                padding: 14,
                marginBottom: 12,
                background: 'var(--admin-surface-2)',
              }}
            >
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Variation name (e.g., Size, Color)"
                  value={variation.name}
                  onChange={(e) => {
                    const variations = [...formData.variations]
                    variations[vIndex].name = e.target.value
                    setFormData({ ...formData, variations })
                  }}
                  className="admin-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeVariation(vIndex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-danger)',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {variation.options.map(
                  (
                    option: { label: string; price_modifier: string; stock_quantity?: string },
                    oIndex: number,
                  ) => (
                    <div key={oIndex} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Option label"
                        value={option.label}
                        onChange={(e) => {
                          const variations = [...formData.variations]
                          variations[vIndex].options[oIndex].label = e.target.value
                          setFormData({ ...formData, variations })
                        }}
                        className="admin-input"
                        style={{ flex: 2, minWidth: 100 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="±Price"
                        value={option.price_modifier}
                        onChange={(e) => {
                          const variations = [...formData.variations]
                          variations[vIndex].options[oIndex].price_modifier = e.target.value
                          setFormData({ ...formData, variations })
                        }}
                        className="admin-input"
                        style={{ width: 90 }}
                        title="Price modifier (+ or -)"
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
                        className="admin-input"
                        style={{ width: 80 }}
                        title="Stock for this option"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const variations = [...formData.variations]
                          variations[vIndex].options = variations[vIndex].options.filter(
                            (_: any, i: number) => i !== oIndex,
                          )
                          setFormData({ ...formData, variations })
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-text-3)',
                          fontSize: 18,
                          lineHeight: 1,
                          fontFamily: 'inherit',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => addVariationOption(vIndex)}
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-accent)',
                    background: 'none',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    textAlign: 'left',
                    marginTop: 4,
                  }}
                >
                  + Add Option
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recipe / Ingredients */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="admin-section-header" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
              Recipe / Ingredients
            </div>
            <button
              type="button"
              onClick={() => setRecipe((prev) => [...prev, { materialId: '', quantity: '' }])}
              className="admin-btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              + Add Ingredient
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--admin-text-3)', marginBottom: 16 }}>
            Define what materials are used to make 1 unit of this product
          </p>
          {recipe.map((row, idx) => {
            const mat = materials.find((m) => m.id === row.materialId)
            return (
              <div key={idx} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <select
                  value={row.materialId}
                  onChange={(e) =>
                    setRecipe((prev) => {
                      const next = [...prev]
                      next[idx] = { ...next[idx], materialId: e.target.value }
                      return next
                    })
                  }
                  className="admin-input"
                  style={{ flex: '1 1 180px', minWidth: 180 }}
                >
                  <option value="">Select material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
                {mat && (mat.stock_status === 'low_stock' || mat.stock_status === 'out_of_stock') && (
                  <span style={{ fontSize: 11, background: 'var(--admin-warning-light)', color: 'var(--admin-warning)', padding: '2px 8px', borderRadius: 999 }}>
                    ⚠️ Low
                  </span>
                )}
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    setRecipe((prev) => {
                      const next = [...prev]
                      next[idx] = { ...next[idx], quantity: e.target.value }
                      return next
                    })
                  }
                  className="admin-input"
                  style={{ width: 100 }}
                />
                {mat && <span style={{ fontSize: 13, color: 'var(--admin-text-3)' }}>{mat.unit}</span>}
                <button
                  type="button"
                  onClick={() => setRecipe((prev) => prev.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-text-3)', fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            )
          })}
          {recipe.length > 0 && (() => {
            const hasNegative = recipe.some((r) => {
              const mat = materials.find((m) => m.id === r.materialId)
              return mat && mat.stock_quantity < 0
            })
            if (hasNegative) return <p style={{ fontSize: 13, color: 'var(--admin-warning)', marginTop: 8 }}>⚠️ Needs restock</p>
            const covered = recipe
              .filter((r) => r.materialId && parseFloat(r.quantity) > 0)
              .map((r) => {
                const mat = materials.find((m) => m.id === r.materialId)
                if (!mat) return Infinity
                const q = parseFloat(r.quantity)
                return q > 0 ? Math.floor(mat.stock_quantity / q) : Infinity
              })
            const minOrders = covered.length === 0 ? 0 : Math.min(...covered)
            if (minOrders === Infinity) return null
            return (
              <p style={{ fontSize: 13, color: 'var(--admin-text-2)', marginTop: 8 }}>
                📦 Current stock covers approximately {minOrders} orders
              </p>
            )
          })()}
        </div>
      </form>

      {/* Sticky save bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--admin-surface)',
          borderTop: '1px solid var(--admin-border)',
          padding: '14px 24px',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          zIndex: 100,
          boxShadow: '0 -4px 12px rgba(28,20,16,0.07)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="admin-btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="product-form"
          disabled={loading}
          className="admin-btn-primary"
          onClick={(e) => {
            e.preventDefault()
            // Trigger form submit manually
            const form = document.querySelector('form')
            if (form) form.requestSubmit()
          }}
        >
          {loading ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
        </button>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
