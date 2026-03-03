'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, addDays, startOfToday, parseISO, isBefore } from 'date-fns'
import api from '@/lib/api'
import AdminPageHeader from '../_components/AdminPageHeader'
import Toggle from '../_components/Toggle'
import SkeletonRows from '../_components/SkeletonRows'
import Toast, { useToast } from '../_components/Toast'
import ConfirmModal from '../_components/ConfirmModal'

type DeliveryDayStatus = 'available' | 'fully_booked' | 'unavailable'

interface DeliveryDay {
  id?: string
  date: string
  status: DeliveryDayStatus
  capacity?: number | null
  current_orders?: number
  admin_note?: string | null
}

interface TimeSlot {
  id: string
  label: string
  start_time: string
  end_time: string
  is_active: boolean
  display_order: number
}

export default function AdminDeliverySettingsPage() {
  const [activeTab, setActiveTab] = useState<'days' | 'slots'>('days')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toasts, showToast, dismissToast } = useToast()

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // Delivery Days
  const [deliveryDays, setDeliveryDays] = useState<DeliveryDay[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: format(startOfToday(), 'yyyy-MM-dd'),
    end: format(addDays(startOfToday(), 60), 'yyyy-MM-dd'),
  })

  // Time Slots
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [showSlotForm, setShowSlotForm] = useState(false)

  const loadDeliveryDays = useCallback(async () => {
    try {
      const response = await api.get(
        `/delivery/admin/delivery-days?startDate=${selectedDateRange.start}&endDate=${selectedDateRange.end}`
      )
      setDeliveryDays(response.data || [])
    } catch (error) {
      console.error('Error loading delivery days:', error)
    }
  }, [selectedDateRange])

  const loadTimeSlots = useCallback(async () => {
    try {
      const response = await api.get('/delivery/admin/time-slots')
      setTimeSlots(response.data || [])
    } catch (error) {
      console.error('Error loading time slots:', error)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      await Promise.all([loadDeliveryDays(), loadTimeSlots()])
      setLoading(false)
    }
    loadData()
  }, [loadDeliveryDays, loadTimeSlots])

  // ========== DELIVERY DAYS HANDLERS ==========

  async function updateDayStatus(date: string, status: DeliveryDayStatus) {
    setSaving(true)
    try {
      await api.put(`/delivery/admin/delivery-days/date/${date}`, { status })
      await loadDeliveryDays()
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to update day')
    } finally {
      setSaving(false)
    }
  }

  async function bulkMarkUnavailable(dates: string[]) {
    setSaving(true)
    try {
      const days = dates.map((date) => ({
        date,
        status: 'unavailable' as DeliveryDayStatus,
      }))
      await api.post('/delivery/admin/delivery-days/bulk', { days })
      await loadDeliveryDays()
      showToast('success', `${dates.length} days marked unavailable`)
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to update days')
    } finally {
      setSaving(false)
    }
  }

  async function updateDayCapacity(date: string, capacity: number | null) {
    setSaving(true)
    try {
      await api.put(`/delivery/admin/delivery-days/date/${date}`, { capacity })
      await loadDeliveryDays()
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to update capacity')
    } finally {
      setSaving(false)
    }
  }

  // ========== TIME SLOTS HANDLERS ==========

  async function saveTimeSlot(slot: Partial<TimeSlot>) {
    setSaving(true)
    try {
      if (editingSlot) {
        await api.put(`/delivery/admin/time-slots/${editingSlot.id}`, slot)
      } else {
        await api.post('/delivery/admin/time-slots', slot)
      }
      await loadTimeSlots()
      setEditingSlot(null)
      setShowSlotForm(false)
      showToast('success', editingSlot ? 'Time slot updated' : 'Time slot created')
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to save time slot')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTimeSlot(id: string) {
    setSaving(true)
    try {
      await api.delete(`/delivery/admin/time-slots/${id}`)
      await loadTimeSlots()
      showToast('success', 'Time slot deleted')
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to delete time slot')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTimeSlotActive(id: string, isActive: boolean) {
    setSaving(true)
    try {
      await api.put(`/delivery/admin/time-slots/${id}`, { is_active: !isActive })
      await loadTimeSlots()
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to update time slot')
    } finally {
      setSaving(false)
    }
  }

  // ========== RENDER HELPERS ==========

  function getStatusStyle(status: DeliveryDayStatus): React.CSSProperties {
    switch (status) {
      case 'available':
        return {
          background: 'var(--admin-success-light)',
          color: 'var(--admin-success)',
          border: '1px solid #B8DEC8',
        }
      case 'fully_booked':
        return {
          background: 'var(--admin-warning-light)',
          color: 'var(--admin-warning)',
          border: '1px solid #E0C040',
        }
      case 'unavailable':
        return {
          background: 'var(--admin-danger-light)',
          color: 'var(--admin-danger)',
          border: '1px solid #F1BCBA',
        }
    }
  }

  function getStatusLabel(status: DeliveryDayStatus) {
    switch (status) {
      case 'available':
        return 'On'
      case 'fully_booked':
        return 'Full'
      case 'unavailable':
        return 'Off'
    }
  }

  // Generate calendar dates
  const calendarDates: string[] = []
  const start = parseISO(selectedDateRange.start)
  const end = parseISO(selectedDateRange.end)
  let current = start
  while (current <= end) {
    calendarDates.push(format(current, 'yyyy-MM-dd'))
    current = addDays(current, 1)
  }

  const daysMap = new Map(deliveryDays.map((day) => [day.date, day]))
  const today = format(startOfToday(), 'yyyy-MM-dd')
  const startDayOfWeek = start.getDay()

  return (
    <div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {confirmModal && (
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Confirm"
          onConfirm={() => {
            confirmModal.onConfirm()
            setConfirmModal(null)
          }}
          onCancel={() => setConfirmModal(null)}
          danger
        />
      )}

      <AdminPageHeader title="Delivery Settings" />

      {/* Tabs */}
      <div
        style={{
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: 24,
          display: 'flex',
          gap: 4,
        }}
      >
        {(['days', 'slots'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--admin-accent)'
                  : '2px solid transparent',
              color: activeTab === tab ? 'var(--admin-accent)' : 'var(--admin-text-2)',
              marginBottom: -1,
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {tab === 'days' ? 'Delivery Days' : 'Time Slots'}
          </button>
        ))}
      </div>

      {/* ===== DELIVERY DAYS TAB ===== */}
      {activeTab === 'days' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Date Range Selector */}
          <div className="admin-card">
            <p className="admin-section-header">Date Range</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--admin-text-2)',
                    marginBottom: 6,
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.start}
                  onChange={(e) =>
                    setSelectedDateRange({ ...selectedDateRange, start: e.target.value })
                  }
                  className="admin-input"
                  style={{ width: 160 }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--admin-text-2)',
                    marginBottom: 6,
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.end}
                  onChange={(e) =>
                    setSelectedDateRange({ ...selectedDateRange, end: e.target.value })
                  }
                  className="admin-input"
                  style={{ width: 160 }}
                />
              </div>
              <button onClick={loadDeliveryDays} className="admin-btn-ghost">
                Load Dates
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Day headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: 'var(--admin-surface-2)',
                borderBottom: '1px solid var(--admin-border)',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--admin-text-2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--admin-text-3)',
                  fontSize: 14,
                }}
              >
                Loading calendar...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {/* Empty cells for day-of-week offset */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      minHeight: 90,
                      background: 'var(--admin-surface-2)',
                      borderRight: '1px solid var(--admin-border)',
                      borderBottom: '1px solid var(--admin-border)',
                    }}
                  />
                ))}

                {calendarDates.map((dateStr) => {
                  const day = daysMap.get(dateStr)
                  const date = parseISO(dateStr)
                  const isPast = isBefore(date, startOfToday())
                  const isToday = dateStr === today

                  return (
                    <div
                      key={dateStr}
                      style={{
                        background: isToday
                          ? 'var(--admin-accent-light)'
                          : isPast
                          ? 'var(--admin-surface-2)'
                          : 'var(--admin-surface)',
                        borderRight: '1px solid var(--admin-border)',
                        borderBottom: '1px solid var(--admin-border)',
                        padding: 8,
                        minHeight: 90,
                        opacity: isPast && !isToday ? 0.55 : 1,
                        outline: isToday ? '2px solid var(--admin-accent)' : 'none',
                        outlineOffset: -2,
                      }}
                    >
                      {/* Date number + status badge */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isToday ? 700 : 600,
                            color: isToday ? 'var(--admin-accent)' : 'var(--admin-text)',
                          }}
                        >
                          {format(date, 'd')}
                        </span>
                        {day && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 600,
                              ...getStatusStyle(day.status),
                            }}
                          >
                            {getStatusLabel(day.status)}
                          </span>
                        )}
                      </div>

                      {/* Capacity info */}
                      {day?.capacity && (
                        <div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginBottom: 4 }}>
                          {day.current_orders || 0}/{day.capacity}
                        </div>
                      )}

                      {/* Controls for future dates */}
                      {!isPast && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <select
                            value={day?.status || 'available'}
                            onChange={(e) =>
                              updateDayStatus(dateStr, e.target.value as DeliveryDayStatus)
                            }
                            disabled={saving}
                            style={{
                              width: '100%',
                              fontSize: 10,
                              padding: '2px 4px',
                              border: '1px solid var(--admin-border)',
                              borderRadius: 4,
                              background: 'var(--admin-surface)',
                              color: 'var(--admin-text)',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="available">Available</option>
                            <option value="fully_booked">Fully Booked</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Cap."
                            value={day?.capacity || ''}
                            onChange={(e) =>
                              updateDayCapacity(
                                dateStr,
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            disabled={saving}
                            style={{
                              width: '100%',
                              fontSize: 10,
                              padding: '2px 4px',
                              border: '1px solid var(--admin-border)',
                              borderRadius: 4,
                              background: 'var(--admin-surface)',
                              color: 'var(--admin-text)',
                            }}
                            min="1"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="admin-card">
            <p className="admin-section-header">Quick Actions</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  const nextWeek = calendarDates.slice(0, 7)
                  setConfirmModal({
                    open: true,
                    title: 'Mark Unavailable',
                    message: `Mark the next ${nextWeek.length} days as unavailable?`,
                    onConfirm: () => bulkMarkUnavailable(nextWeek),
                  })
                }}
                disabled={saving}
                className="admin-btn-ghost"
                style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
              >
                Mark Next 7 Days Unavailable
              </button>
              <button
                onClick={() => {
                  const weekends = calendarDates.filter((d) =>
                    [0, 6].includes(parseISO(d).getDay())
                  )
                  setConfirmModal({
                    open: true,
                    title: 'Mark Weekends Unavailable',
                    message: `Mark all ${weekends.length} weekends in this range as unavailable?`,
                    onConfirm: () => bulkMarkUnavailable(weekends),
                  })
                }}
                disabled={saving}
                className="admin-btn-ghost"
                style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
              >
                Mark All Weekends Unavailable
              </button>
              <button
                onClick={() => {
                  setConfirmModal({
                    open: true,
                    title: 'Reset All Delivery Days',
                    message:
                      'Reset all delivery days? This will remove all availability settings and make all dates available by default.',
                    onConfirm: async () => {
                      setSaving(true)
                      try {
                        await api.post('/delivery/admin/delivery-days/reset')
                        await loadDeliveryDays()
                        showToast('success', 'All delivery days reset to default')
                      } catch (error: any) {
                        showToast(
                          'error',
                          error?.response?.data?.message || 'Failed to reset delivery days'
                        )
                      } finally {
                        setSaving(false)
                      }
                    },
                  })
                }}
                disabled={saving}
                className="admin-btn-primary"
              >
                Reset All to Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TIME SLOTS TAB ===== */}
      {activeTab === 'slots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}
            >
              Delivery Time Slots
            </h2>
            <button
              onClick={() => {
                setEditingSlot(null)
                setShowSlotForm(true)
              }}
              className="admin-btn-primary"
            >
              + Add Time Slot
            </button>
          </div>

          {/* Time Slot Form */}
          {showSlotForm && (
            <div className="admin-card">
              <p className="admin-section-header">
                {editingSlot ? 'Edit Time Slot' : 'New Time Slot'}
              </p>
              <TimeSlotForm
                slot={editingSlot}
                onSave={saveTimeSlot}
                onCancel={() => {
                  setShowSlotForm(false)
                  setEditingSlot(null)
                }}
                saving={saving}
              />
            </div>
          )}

          {/* Time Slots Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Label</th>
                  <th>Time Range</th>
                  <th>Active</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows cols={5} rows={3} />
                ) : timeSlots.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        color: 'var(--admin-text-3)',
                        padding: '40px 0',
                      }}
                    >
                      No time slots configured
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slot) => (
                    <tr key={slot.id} style={{ opacity: !slot.is_active ? 0.5 : 1 }}>
                      <td style={{ color: 'var(--admin-text-2)', fontWeight: 500 }}>
                        {slot.display_order}
                      </td>
                      <td style={{ fontWeight: 600 }}>{slot.label}</td>
                      <td
                        style={{
                          color: 'var(--admin-text-2)',
                          fontFamily: 'monospace',
                          fontSize: 13,
                        }}
                      >
                        {slot.start_time} – {slot.end_time}
                      </td>
                      <td>
                        <Toggle
                          checked={slot.is_active}
                          onChange={() => toggleTimeSlotActive(slot.id, slot.is_active)}
                          disabled={saving}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setEditingSlot(slot)
                            setShowSlotForm(true)
                          }}
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
                          onClick={() => {
                            setConfirmModal({
                              open: true,
                              title: 'Delete Time Slot',
                              message: `Delete "${slot.label}"?`,
                              onConfirm: () => deleteTimeSlot(slot.id),
                            })
                          }}
                          disabled={saving}
                          style={{
                            fontSize: 13,
                            color: 'var(--admin-danger)',
                            background: 'none',
                            border: 'none',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ======= Time Slot Form Sub-Component =======
function TimeSlotForm({
  slot,
  onSave,
  onCancel,
  saving,
}: {
  slot: TimeSlot | null
  onSave: (slot: Partial<TimeSlot>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    label: slot?.label || '',
    start_time: slot?.start_time || '',
    end_time: slot?.end_time || '',
    is_active: slot?.is_active !== undefined ? slot.is_active : true,
    display_order: slot?.display_order || 0,
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--admin-text-2)',
    marginBottom: 6,
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Label *</label>
        <input
          type="text"
          required
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., 8:00 AM - 10:00 AM"
          className="admin-input"
          style={{ maxWidth: 320 }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          maxWidth: 320,
        }}
      >
        <div>
          <label style={labelStyle}>Start Time *</label>
          <input
            type="time"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="admin-input"
          />
        </div>
        <div>
          <label style={labelStyle}>End Time *</label>
          <input
            type="time"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="admin-input"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Display Order</label>
        <input
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
          }
          className="admin-input"
          style={{ maxWidth: 120 }}
          min="0"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle
          checked={formData.is_active}
          onChange={(v) => setFormData({ ...formData, is_active: v })}
        />
        <span style={{ fontSize: 14, color: 'var(--admin-text)' }}>
          Active (visible to customers)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} className="admin-btn-primary">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="admin-btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  )
}
