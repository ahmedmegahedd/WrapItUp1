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

  useEffect(() => {
    loadImages()
    loadHeroText()
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
      <h1 className="text-3xl font-bold mb-6">Homepage Hero</h1>
      <p className="text-gray-600 mb-8">
        Upload hero images and customize the text shown on the hero. Only one image can be active at a time.
      </p>

      {/* Hero text */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Hero text</h2>
        <p className="text-sm text-gray-500 mb-4">
          Edit the headline, subtext, and button label shown on the homepage hero. Use a new line in the headline for a line break.
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
        <h2 className="text-lg font-semibold mb-4">Upload new hero image</h2>
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

      {/* List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Hero images</h2>
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
