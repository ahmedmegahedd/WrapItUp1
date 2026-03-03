'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { supabase } from '@/lib/supabase'
import ImagePreviewCrop from '@/components/ImagePreviewCrop'
import Toggle from '../_components/Toggle'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

type HeroImage = {
  id: string
  image_url: string
  is_active: boolean
  created_at: string
}

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
  const { toasts, showToast, dismissToast } = useToast()

  async function loadImages() {
    try {
      const res = await api.get('/admin/homepage/hero-images')
      setImages(res.data || [])
    } catch {
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
    } catch {
      // silent
    }
  }

  async function saveHeroText() {
    setHeroTextSaving(true)
    try {
      await api.patch('/admin/homepage/hero-text', heroText)
      showToast('success', 'Hero text saved')
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save hero text')
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
          home_section_order: Array.isArray(d.home_section_order)
            ? d.home_section_order
            : defaultSectionOrder,
          promotion_visible: d.promotion_visible !== false,
          promotion_title: d.promotion_title ?? 'Special offer',
          promotion_message: d.promotion_message ?? 'Free delivery on orders over 250 EGP',
          final_cta_headline: d.final_cta_headline ?? 'Ready to surprise someone?',
          final_cta_subtext: d.final_cta_subtext ?? 'Browse our collections and order in minutes.',
          final_cta_button: d.final_cta_button ?? 'Browse all collections',
          featured_products_limit:
            typeof d.featured_products_limit === 'number' ? d.featured_products_limit : 8,
        })
      }
    } catch {
      // silent
    }
  }

  async function saveAppSettings() {
    setAppSettingsSaving(true)
    try {
      await api.patch('/admin/homepage/app-settings', appSettings)
      showToast('success', 'App settings saved')
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save settings')
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
      showToast('error', 'Supabase is not configured.')
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
      await api.post('/admin/homepage/hero-images', {
        image_url: data.publicUrl,
        set_as_active: setAsActiveOnAdd,
      })
      await loadImages()
      URL.revokeObjectURL(croppedImageUrl)
      showToast('success', 'Hero image uploaded')
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Upload failed')
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
      showToast('success', 'Active hero image updated')
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to set active')
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/admin/homepage/hero-images/${id}`)
      await loadImages()
      showToast('success', 'Image removed')
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to remove image')
    }
  }

  const sectionCardStyle: React.CSSProperties = {
    background: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius)',
    boxShadow: 'var(--admin-shadow)',
    padding: 20,
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 780, margin: '0 auto' }}>
      {showImagePreview && (
        <ImagePreviewCrop
          imageUrl={previewImageUrl}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}

      <AdminPageHeader
        title="App Hero"
        subtitle="Hero image and text shown on the mobile app home screen"
      />

      {/* Hero text */}
      <div style={sectionCardStyle}>
        <div className="admin-section-header">Hero Text</div>
        <p style={{ fontSize: 13, color: 'var(--admin-text-3)', marginBottom: 16 }}>
          Edit the headline, subtext, and button label shown on the app home hero. Use a new line for a line break.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 600 }}>
          <div>
            <label style={labelStyle}>Headline (1)</label>
            <textarea
              value={heroText.headline}
              onChange={(e) => setHeroText((t) => ({ ...t, headline: e.target.value }))}
              rows={2}
              className="admin-input"
              placeholder="Luxury breakfast gifts for unforgettable mornings"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Subtext (2)</label>
            <textarea
              value={heroText.subtext}
              onChange={(e) => setHeroText((t) => ({ ...t, subtext: e.target.value }))}
              rows={3}
              className="admin-input"
              placeholder="Thoughtfully curated breakfast trays…"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Button label (3)</label>
            <input
              type="text"
              value={heroText.button_label}
              onChange={(e) => setHeroText((t) => ({ ...t, button_label: e.target.value }))}
              className="admin-input"
              placeholder="Explore Collections"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={saveHeroText}
              disabled={heroTextSaving}
              className="admin-btn-primary"
            >
              {heroTextSaving ? 'Saving…' : 'Save Hero Text'}
            </button>
          </div>
        </div>
      </div>

      {/* Upload hero image */}
      <div style={sectionCardStyle}>
        <div className="admin-section-header">Upload Hero Image</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 'var(--admin-radius-sm)',
              background: uploading ? 'var(--admin-surface-2)' : 'var(--admin-accent)',
              color: uploading ? 'var(--admin-text-3)' : 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {uploading ? '⏳ Uploading…' : '🖼️ Choose image'}
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          <Toggle
            checked={setAsActiveOnAdd}
            onChange={setSetAsActiveOnAdd}
            label="Set as active when adding"
          />
        </div>
      </div>

      {/* App home screen settings */}
      <div style={sectionCardStyle}>
        <div className="admin-section-header">App Home Screen</div>
        <p style={{ fontSize: 13, color: 'var(--admin-text-3)', marginBottom: 20 }}>
          Control which sections appear on the app home screen, their order, and copy.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
          {/* Section order */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 10 }}>
              Section Order &amp; Visibility
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 10 }}>
              Only checked sections are shown, in the listed order.
            </p>
            <div style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden' }}>
              {defaultSectionOrder.map((id, i) => {
                const included = appSettings.home_section_order.includes(id)
                const idx = appSettings.home_section_order.indexOf(id)
                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderBottom: i < defaultSectionOrder.length - 1 ? '1px solid var(--admin-border)' : 'none',
                      background: included ? 'var(--admin-surface)' : 'var(--admin-surface-2)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleSection(id)}
                      style={{ flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: included ? 'var(--admin-text)' : 'var(--admin-text-3)' }}>
                      {sectionLabels[id] ?? id}
                    </span>
                    {included && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => moveSection(id, 'up')}
                          disabled={idx === 0}
                          style={{ padding: '3px 8px', fontSize: 12, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 4, fontFamily: 'inherit', opacity: idx === 0 ? 0.3 : 1 }}
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => moveSection(id, 'down')}
                          disabled={idx === appSettings.home_section_order.length - 1}
                          style={{ padding: '3px 8px', fontSize: 12, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 4, fontFamily: 'inherit', opacity: idx === appSettings.home_section_order.length - 1 ? 0.3 : 1 }}
                        >↓</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Featured products limit */}
          <div>
            <label style={labelStyle}>Featured Products Limit</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min={1}
                max={20}
                value={appSettings.featured_products_limit}
                onChange={(e) =>
                  setAppSettings((s) => ({ ...s, featured_products_limit: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 8)) }))
                }
                className="admin-input"
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 13, color: 'var(--admin-text-3)' }}>products in &quot;Best sellers&quot;</span>
            </div>
          </div>

          {/* Promotion banner */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 12 }}>Promotion Banner</div>
            <div style={{ marginBottom: 12 }}>
              <Toggle
                checked={appSettings.promotion_visible}
                onChange={(v) => setAppSettings((s) => ({ ...s, promotion_visible: v }))}
                label="Show promotion banner on home"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" value={appSettings.promotion_title} onChange={(e) => setAppSettings((s) => ({ ...s, promotion_title: e.target.value }))} className="admin-input" placeholder="e.g. Special offer" />
              <input type="text" value={appSettings.promotion_message} onChange={(e) => setAppSettings((s) => ({ ...s, promotion_message: e.target.value }))} className="admin-input" placeholder="e.g. Free delivery on orders over 250 EGP" />
            </div>
          </div>

          {/* Final CTA */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-2)', marginBottom: 12 }}>Final CTA Block</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" value={appSettings.final_cta_headline} onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_headline: e.target.value }))} className="admin-input" placeholder="Headline" />
              <input type="text" value={appSettings.final_cta_subtext} onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_subtext: e.target.value }))} className="admin-input" placeholder="Subtext" />
              <input type="text" value={appSettings.final_cta_button} onChange={(e) => setAppSettings((s) => ({ ...s, final_cta_button: e.target.value }))} className="admin-input" placeholder="Button label" />
            </div>
          </div>

          <div>
            <button type="button" onClick={saveAppSettings} disabled={appSettingsSaving} className="admin-btn-primary">
              {appSettingsSaving ? 'Saving…' : 'Save App Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Hero images list */}
      <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', boxShadow: 'var(--admin-shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--admin-border)', fontWeight: 600, fontSize: 14 }}>
          App Hero Images
        </div>
        {loading ? (
          <div style={{ padding: 20 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-skeleton" style={{ height: 64, marginBottom: 10, borderRadius: 8 }} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-3)', fontSize: 14 }}>
            No hero images yet. Upload one above.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {images.map((img, i) => (
              <li
                key={img.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 20px',
                  borderBottom: i < images.length - 1 ? '1px solid var(--admin-border)' : 'none',
                  background: img.is_active ? 'var(--admin-success-light)' : 'transparent',
                }}
              >
                <div style={{ width: 96, height: 54, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--admin-border)', background: 'var(--admin-surface-2)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-2)' }}>
                    {new Date(img.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {img.is_active && (
                    <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, background: 'var(--admin-success-light)', color: 'var(--admin-success)', padding: '2px 8px', borderRadius: 100, marginTop: 3 }}>
                      Active
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!img.is_active && (
                    <button type="button" onClick={() => setActive(img.id)} className="admin-btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
                      Set as active
                    </button>
                  )}
                  <button type="button" onClick={() => remove(img.id)} style={{ fontSize: 12, padding: '5px 12px', background: 'none', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', color: 'var(--admin-danger)', fontFamily: 'inherit' }}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
