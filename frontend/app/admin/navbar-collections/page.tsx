'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Toggle from '../_components/Toggle'
import SkeletonRows from '../_components/SkeletonRows'
import Toast, { useToast } from '../_components/Toast'
import AdminPageHeader from '../_components/AdminPageHeader'

type CollectionRow = {
  id: string
  name: string
  slug: string
  show_in_nav: boolean
  display_order: number
}

export default function NavbarCollectionsPage() {
  const [collections, setCollections] = useState<CollectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    try {
      const res = await api.get('/admin/collections')
      const list = (res.data || []) as CollectionRow[]
      const sorted = [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      setCollections(sorted.map((c) => ({ ...c, show_in_nav: c.show_in_nav !== false })))
    } catch {
      showToast('error', 'Failed to load collections')
    } finally {
      setLoading(false)
    }
  }

  function moveUp(index: number) {
    if (index <= 0) return
    const next = [...collections]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setCollections(next)
  }

  function moveDown(index: number) {
    if (index >= collections.length - 1) return
    const next = [...collections]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setCollections(next)
  }

  function setShowInNav(index: number, value: boolean) {
    const next = [...collections]
    next[index] = { ...next[index], show_in_nav: value }
    setCollections(next)
  }

  async function handleSave() {
    setSaving(true)
    try {
      for (const c of collections) {
        await api.patch(`/admin/collections/${c.id}`, { show_in_nav: c.show_in_nav })
      }
      await api.patch('/admin/collections/nav-order', {
        orderedIds: collections.map((c) => c.id),
      })
      showToast('success', 'Navbar collections saved')
    } catch {
      showToast('error', 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const arrowBtnStyle: React.CSSProperties = {
    padding: '5px 7px',
    background: 'var(--admin-surface)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius-sm)',
    color: 'var(--admin-text-2)',
    lineHeight: 1,
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'background 0.12s ease',
  }

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 700, margin: '0 auto' }}>
      <AdminPageHeader
        title="Navbar Collections"
        subtitle="Choose which collections appear in the site navbar dropdown and their order"
        action={{
          label: saving ? 'Saving…' : 'Save Changes',
          onClick: handleSave,
        }}
      />

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Order</th>
              <th>Collection</th>
              <th style={{ width: 140 }}>Show in Navbar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={3} rows={4} />
            ) : collections.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    textAlign: 'center',
                    padding: '48px 20px',
                    color: 'var(--admin-text-3)',
                    fontSize: 14,
                  }}
                >
                  No collections found
                </td>
              </tr>
            ) : (
              collections.map((c, index) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        style={{ ...arrowBtnStyle, opacity: index === 0 ? 0.3 : 1 }}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === collections.length - 1}
                        style={{
                          ...arrowBtnStyle,
                          opacity: index === collections.length - 1 ? 0.3 : 1,
                        }}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-text-3)' }}>{c.slug}</div>
                  </td>
                  <td>
                    <Toggle
                      checked={c.show_in_nav}
                      onChange={(v) => setShowInNav(index, v)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
