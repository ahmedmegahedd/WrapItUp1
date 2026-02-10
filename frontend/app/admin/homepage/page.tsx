'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'

type HeroImage = {
  id: string
  image_url: string
  is_active: boolean
  created_at: string
}

export default function AdminHomepagePage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [setAsActiveOnAdd, setSetAsActiveOnAdd] = useState(true)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [heroText, setHeroText] = useState({
    headline: 'Luxury breakfast gifts for unforgettable mornings',
    subtext:
      'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
    button_label: 'Explore Collections',
  })
  const [heroTextSaving, setHeroTextSaving] = useState(false)

  type AppSettings = {
    home_section_order: string[]
    promotion_visible: boolean
    promotion_title: string
    promotion_message: string
    final_cta_headline: string
    final_cta_subtext: string
    final_cta_button: string
    featured_products_limit: number
  }
  const defaultSectionOrder = [
    'hero',
    'featured_collections',
    'featured_products',
    'promotion',
    'value_proposition',
    'final_cta',
  ]
  const sectionLabels: Record<string, string> = {
    hero: 'Hero',
    featured_collections: 'Featured collections',
    featured_products: 'Featured products',
    promotion: 'Promotion banner',
    value_proposition: 'Why choose us',
    final_cta: 'Final CTA',
  }
  const [appSettings, setAppSettings] = useState<AppSettings>({
    home_section_order: defaultSectionOrder,
    promotion_visible: true,
    promotion_title: 'Special offer',
    promotion_message: 'Free delivery on orders over 250 EGP',
    final_cta_headline: 'Ready to surprise someone?',
    final_cta_subtext: 'Browse our collections and order in minutes.',
    final_cta_button: 'Browse all collections',
    featured_products_limit: 8,
  })
  const [appSettingsSaving, setAppSettingsSaving] = useState(false)

  async function loadImages() {
    try {
      const res = await api.get('/admin/homepage/hero-images')
      setImages(res.data || [])
    } catch (e) {
      console.error(e)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  async function loadHeroText() {
    try {
      const res = await api.get('/admin/homepage/hero-text')
      const d = res.data
      if (d && (d.headline != null || d.subtext != null || d.button_label != null)) {
        setHeroText({
          headline: d.headline ?? 'Luxury breakfast gifts for unforgettable mornings',
          subtext:
            d.subtext ??
            'Thoughtfully curated breakfast trays and gift boxes that turn ordinary mornings into extraordinary moments of love and connection.',
          button_label: d.button_label ?? 'Explore Collections',
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function saveHeroText() {
    setHeroTextSaving(true)
    try {
      await api.patch('/admin/homepage/hero-text', heroText)
      alert('Hero text saved.')
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save')
    } finally {
      setHeroTextSaving(false)
    }
  }

  async function loadAppSettings() {
    try {
      const res = await api.get('/admin/homepage/app-settings')
      const d = res.data
      if (d) {
        setAppSettings({
          home_section_order: Array.isArray(d.home_section_order) ? d.home_section_order : defaultSectionOrder,
          promotion_visible: d.promotion_visible !== false,
          promotion_title: d.promotion_title ?? 'Special offer',
          promotion_message: d.promotion_message ?? 'Free delivery on orders over 250 EGP',
          final_cta_headline: d.final_cta_headline ?? 'Ready to surprise someone?',
          final_cta_subtext: d.final_cta_subtext ?? 'Browse our collections and order in minutes.',
          final_cta_button: d.final_cta_button ?? 'Browse all collections',
          featured_products_limit: typeof d.featured_products_limit === 'number' ? d.featured_products_limit : 8,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function saveAppSettings() {
    setAppSettingsSaving(true)
    try {
      await api.patch('/admin/homepage/app-settings', appSettings)
      alert('App settings saved.')
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save')
    } finally {
      setAppSettingsSaving(false)
    }
  }

  function toggleSection(sectionId: string) {
    setAppSettings((prev) => {
      const order = [...prev.home_section_order]
      const idx = order.indexOf(sectionId)
      if (idx >= 0) {
        order.splice(idx, 1)
      } else {
        order.push(sectionId)
      }
      return { ...prev, home_section_order: order }
    })
  }

  function moveSection(sectionId: string, dir: 'up' | 'down') {
    setAppSettings((prev) => {
      const order = [...prev.home_section_order]
      const idx = order.indexOf(sectionId)
      if (idx < 0) return prev
      const newIdx = dir === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= order.length) return prev
      ;[order[idx], order[newIdx]] = [order[newIdx], order[idx]]
      return { ...prev, home_section_order: order }
    })
  }

  useEffect(() => {
    loadImages()
    loadHeroText()
    loadAppSettings()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
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
      const filePath = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.png`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      await api.post('/admin/homepage/hero-images', {
        image_url: publicUrl,
        set_as_active: setAsActiveOnAdd,
      })
      await loadImages()
      URL.revokeObjectURL(croppedImageUrl)
    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    setShowImagePreview(false)
    if (previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl)
    }
    setPreviewImageUrl('')
  }

  async function setActive(id: string) {
    try {
      await api.patch(`/admin/homepage/hero-images/${id}/set-active`)
      await loadImages()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to set active')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this hero image? It will no longer appear in the list.')) return
    try {
      await api.delete(`/admin/homepage/hero-images/${id}`)
      await loadImages()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}
      <h1 className="text-3xl font-bold mb-6">App hero</h1>
      <p className="text-gray-600 mb-8">
        Hero image and text shown on the mobile app home screen. Only one image can be active at a time.
      </p>

      {/* Hero text */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Hero text</h2>
        <p className="text-sm text-gray-500 mb-4">
          Edit the headline, subtext, and button label shown on the app home hero. Use a new line in the headline for a line break.
        </p>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline (1)</label>
            <textarea
              value={heroText.headline}
              onChange={(e) => setHeroText((t) => ({ ...t, headline: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Luxury breakfast gifts for unforgettable mornings"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtext (2)</label>
            <textarea
              value={heroText.subtext}
              onChange={(e) => setHeroText((t) => ({ ...t, subtext: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Thoughtfully curated breakfast trays..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button label (3)</label>
            <input
              type="text"
              value={heroText.button_label}
              onChange={(e) => setHeroText((t) => ({ ...t, button_label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Explore Collections"
            />
          </div>
          <button
            type="button"
            onClick={saveHeroText}
            disabled={heroTextSaving}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {heroTextSaving ? 'Saving…' : 'Save hero text'}
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload new app hero image</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileSelect}
              className="sr-only"
            />
            <span
              className={`px-4 py-2 rounded-lg border transition-colors ${
                uploading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {uploading ? 'Uploading…' : 'Choose image'}
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={setAsActiveOnAdd}
              onChange={(e) => setSetAsActiveOnAdd(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Set as active when adding</span>
          </label>
        </div>
      </div>

      {/* App home screen settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">App home screen</h2>
        <p className="text-sm text-gray-500 mb-6">
          Control which sections appear on the app home screen and their copy. Section order and visibility, promotion banner, final CTA, and featured products count.
        </p>

        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Section order & visibility</h3>
            <p className="text-sm text-gray-500 mb-2">Reorder or hide sections. Only checked sections are shown, in the order below.</p>
            <ul className="space-y-1 border rounded-lg p-2 bg-gray-50">
              {defaultSectionOrder.map((id) => {
                const included = appSettings.home_section_order.includes(id)
                const idx = appSettings.home_section_order.indexOf(id)
                return (
                  <li key={id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleSection(id)}
                      className="rounded"
                    />
                    <span className="flex-1">{sectionLabels[id] ?? id}</span>
                    {included && (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(id, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-0.5 text-xs border rounded disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(id, 'down')}
                          disabled={idx === appSettings.home_section_order.length - 1}
                          className="px-2 py-0.5 text-xs border rounded disabled:opacity-40"
                        >
                          Down
                        </button>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <label className="block font-medium text-gray-800 mb-1">Featured products limit</label>
            <input
              type="number"
              min={1}
              max={20}
              value={appSettings.featured_products_limit}
              onChange={(e) =>
                setAppSettings((s) => ({
                  ...s,
                  featured_products_limit: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 8)),
                }))
              }
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="ml-2 text-sm text-gray-500">products shown in “Best sellers”</span>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-800 mb-3">Promotion banner</h3>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={appSettings.promotion_visible}
                onChange={(e) => setAppSettings((s) => ({ ...s, promotion_visible: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Show promotion banner on home</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={appSettings.promotion_title}
                onChange={(e) => setAppSettings((s) => ({ ...s, promotion_title: e.target.value }))}
                placeholder="e.g. Special offer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={appSettings.promotion_message}
                onChange={(e) => setAppSettings((s) => ({ ...s, promotion_message: e.target.value }))}
                placeholder="e.g. Free delivery on orders over 250 EGP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-800 mb-3">Final CTA block</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={appSettings.final_cta_headline}
                onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_headline: e.target.value }))}
                placeholder="Headline"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={appSettings.final_cta_subtext}
                onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_subtext: e.target.value }))}
                placeholder="Subtext"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={appSettings.final_cta_button}
                onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_button: e.target.value }))}
                placeholder="Button label"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveAppSettings}
            disabled={appSettingsSaving}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {appSettingsSaving ? 'Saving…' : 'Save app settings'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">App hero images</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : images.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hero images yet. Upload one above.</div>
        ) : (
          <ul className="divide-y">
            {images.map((img) => (
              <li key={img.id} className="flex items-center gap-4 p-4">
                <div className="relative w-24 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500">
                    {new Date(img.created_at).toLocaleDateString()}
                  </span>
                  {img.is_active && (
                    <span className="ml-3 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!img.is_active && (
                    <button
                      type="button"
                      onClick={() => setActive(img.id)}
                      className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                    >
                      Set as active
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    className="px-3 py-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
