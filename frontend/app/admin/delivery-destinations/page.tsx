'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import AdminPageHeader from '../_components/AdminPageHeader'
import Toggle from '../_components/Toggle'
import StatusBadge from '../_components/StatusBadge'
import ConfirmModal from '../_components/ConfirmModal'
import Toast, { useToast } from '../_components/Toast'
import SkeletonRows from '../_components/SkeletonRows'

type Destination = {
  id: string
  name: string
  fee_egp: number
  display_order: number
  is_active: boolean
}

const emptyForm = { name: '', fee_egp: '', display_order: '0', is_active: true }

export default function AdminDeliveryDestinationsPage() {
  const [list, setList] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', fee_egp: '', display_order: 0, is_active: true })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { toasts, showToast, dismissToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api.get('/admin/delivery-destinations')
      setList(res.data || [])
    } catch (e) {
      console.error(e)
      showToast('error', 'Failed to load destinations')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/delivery-destinations', {
        name: form.name.trim(),
        fee_egp: parseFloat(form.fee_egp) || 0,
        display_order: parseInt(form.display_order, 10) || 0,
        is_active: form.is_active,
      })
      showToast('success', 'Destination created')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(d: Destination) {
    setEditingId(d.id)
    setEditForm({
      name: d.name,
      fee_egp: String(d.fee_egp),
      display_order: d.display_order,
      is_active: d.is_active,
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    try {
      await api.patch(`/admin/delivery-destinations/${editingId}`, {
        name: editForm.name.trim(),
        fee_egp: parseFloat(editForm.fee_egp) || 0,
        display_order: editForm.display_order,
        is_active: editForm.is_active,
      })
      showToast('success', 'Destination updated')
      setEditingId(null)
      load()
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/delivery-destinations/${deleteTarget.id}`)
      showToast('success', 'Destination deleted')
      load()
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeleteTarget(null)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Destination"
        message={`Delete "${deleteTarget?.name}"? Orders already placed will keep the stored fee.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <AdminPageHeader
        title="Delivery Destinations"
        action={{
          label: showForm ? 'Cancel' : '+ Add Destination',
          onClick: () => {
            setShowForm(!showForm)
            setForm(emptyForm)
          },
        }}
      />

      <p style={{ fontSize: 14, color: 'var(--admin-text-2)', marginBottom: 20 }}>
        Configure delivery destinations and fees (EGP). Customers choose one at checkout; the fee is saved with the order.
      </p>

      {/* Create Form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <p className="admin-section-header">New Destination</p>
          <form onSubmit={handleCreate}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 100px',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="admin-input"
                  placeholder="e.g., Cairo"
                />
              </div>
              <div>
                <label style={labelStyle}>Fee (EGP) *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={form.fee_egp}
                  onChange={(e) => setForm((f) => ({ ...f, fee_egp: e.target.value }))}
                  className="admin-input"
                  placeholder="160"
                />
              </div>
              <div>
                <label style={labelStyle}>Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                  className="admin-input"
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle
                  checked={form.is_active}
                  onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>Active</span>
              </div>
              <button type="submit" disabled={saving} className="admin-btn-primary">
                {saving ? 'Saving...' : 'Create Destination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Fee (EGP)</th>
              <th>Order</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={5} rows={4} />
            ) : list.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--admin-text-3)', padding: '40px 0' }}
                >
                  No destinations yet. Add one so customers can select delivery destination at checkout.
                </td>
              </tr>
            ) : (
              list.map((d) =>
                editingId === d.id ? (
                  <tr key={d.id}>
                    <td colSpan={5} style={{ padding: '12px 16px' }}>
                      <form onSubmit={handleUpdate}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <label
                              style={{ display: 'block', fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}
                            >
                              Name
                            </label>
                            <input
                              type="text"
                              required
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="admin-input"
                              style={{ width: 160 }}
                            />
                          </div>
                          <div>
                            <label
                              style={{ display: 'block', fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}
                            >
                              Fee (EGP)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={editForm.fee_egp}
                              onChange={(e) => setEditForm((f) => ({ ...f, fee_egp: e.target.value }))}
                              className="admin-input"
                              style={{ width: 100 }}
                            />
                          </div>
                          <div>
                            <label
                              style={{ display: 'block', fontSize: 12, color: 'var(--admin-text-3)', marginBottom: 4 }}
                            >
                              Order
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={editForm.display_order}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  display_order: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="admin-input"
                              style={{ width: 80 }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
                            <Toggle
                              checked={editForm.is_active}
                              onChange={(v) => setEditForm((f) => ({ ...f, is_active: v }))}
                            />
                            <span style={{ fontSize: 13, color: 'var(--admin-text-2)' }}>Active</span>
                          </div>
                          <button type="submit" disabled={saving} className="admin-btn-primary">
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="admin-btn-ghost"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>E£ {Number(d.fee_egp).toFixed(2)}</td>
                    <td style={{ color: 'var(--admin-text-2)' }}>{d.display_order}</td>
                    <td>
                      <StatusBadge status={d.is_active ? 'active' : 'inactive'} type="product" />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(d)}
                        style={{
                          fontSize: 13,
                          color: 'var(--admin-accent)',
                          background: 'none',
                          border: 'none',
                          marginRight: 12,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: d.id, name: d.name })}
                        style={{ fontSize: 13, color: 'var(--admin-danger)', background: 'none', border: 'none' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
