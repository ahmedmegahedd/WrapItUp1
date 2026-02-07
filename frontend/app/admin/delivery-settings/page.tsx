'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, addDays, startOfToday, parseISO, isBefore } from 'date-fns'
import api from '@/lib/api'

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
      console.error('Error updating day:', error)
      alert(error?.response?.data?.message || 'Failed to update day')
    } finally {
      setSaving(false)
    }
  }

  async function bulkMarkUnavailable(dates: string[]) {
    if (!confirm(`Mark ${dates.length} days as unavailable?`)) return

    setSaving(true)
    try {
      const days = dates.map(date => ({
        date,
        status: 'unavailable' as DeliveryDayStatus,
      }))
      await api.post('/delivery/admin/delivery-days/bulk', { days })
      await loadDeliveryDays()
    } catch (error: any) {
      console.error('Error bulk updating:', error)
      alert(error?.response?.data?.message || 'Failed to update days')
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
      console.error('Error updating capacity:', error)
      alert(error?.response?.data?.message || 'Failed to update capacity')
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
    } catch (error: any) {
      console.error('Error saving time slot:', error)
      alert(error?.response?.data?.message || 'Failed to save time slot')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTimeSlot(id: string) {
    if (!confirm('Are you sure you want to delete this time slot?')) return

    setSaving(true)
    try {
      await api.delete(`/delivery/admin/time-slots/${id}`)
      await loadTimeSlots()
    } catch (error: any) {
      console.error('Error deleting time slot:', error)
      alert(error?.response?.data?.message || 'Failed to delete time slot')
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
      console.error('Error toggling time slot:', error)
      alert(error?.response?.data?.message || 'Failed to update time slot')
    } finally {
      setSaving(false)
    }
  }

  async function reorderTimeSlots(newOrder: TimeSlot[]) {
    setSaving(true)
    try {
      await api.post('/delivery/admin/time-slots/reorder', {
        slotIds: newOrder.map(slot => slot.id),
      })
      await loadTimeSlots()
    } catch (error: any) {
      console.error('Error reordering:', error)
      alert(error?.response?.data?.message || 'Failed to reorder time slots')
    } finally {
      setSaving(false)
    }
  }

  // ========== RENDER HELPERS ==========

  function getStatusColor(status: DeliveryDayStatus) {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'fully_booked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300'
    }
  }

  function getStatusLabel(status: DeliveryDayStatus) {
    switch (status) {
      case 'available':
        return 'Available'
      case 'fully_booked':
        return 'Fully Booked'
      case 'unavailable':
        return 'Unavailable'
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

  // Create date map for quick lookup
  const daysMap = new Map(deliveryDays.map(day => [day.date, day]))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('days')}
            className={`pb-3 px-4 font-medium ${
              activeTab === 'days'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Delivery Days
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            className={`pb-3 px-4 font-medium ${
              activeTab === 'slots'
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Time Slots
          </button>
        </nav>
      </div>

      {/* Delivery Days Tab */}
      {activeTab === 'days' && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.start}
                  onChange={(e) =>
                    setSelectedDateRange({ ...selectedDateRange, start: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={selectedDateRange.end}
                  onChange={(e) =>
                    setSelectedDateRange({ ...selectedDateRange, end: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={loadDeliveryDays}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Load Dates
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
              {calendarDates.map((dateStr) => {
                const day = daysMap.get(dateStr)
                const date = parseISO(dateStr)
                const isPast = isBefore(date, startOfToday())
                const isToday = format(date, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd')

                return (
                  <div
                    key={dateStr}
                    className={`bg-white p-2 border-r border-b border-gray-100 min-h-[80px] ${
                      isPast ? 'opacity-50' : ''
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </span>
                      {day && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(day.status)}`}
                        >
                          {getStatusLabel(day.status)}
                        </span>
                      )}
                    </div>
                    {day && day.capacity && (
                      <div className="text-xs text-gray-500 mb-1">
                        {day.current_orders || 0} / {day.capacity}
                      </div>
                    )}
                    {!isPast && (
                      <div className="mt-1 space-y-1">
                        <select
                          value={day?.status || 'available'}
                          onChange={(e) => updateDayStatus(dateStr, e.target.value as DeliveryDayStatus)}
                          disabled={saving}
                          className="w-full text-xs px-1 py-0.5 border rounded"
                        >
                          <option value="available">Available</option>
                          <option value="fully_booked">Fully Booked</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Capacity"
                          value={day?.capacity || ''}
                          onChange={(e) =>
                            updateDayCapacity(dateStr, e.target.value ? parseInt(e.target.value) : null)
                          }
                          disabled={saving}
                          className="w-full text-xs px-1 py-0.5 border rounded"
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const nextWeek = calendarDates.slice(0, 7)
                  bulkMarkUnavailable(nextWeek)
                }}
                disabled={saving}
                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Mark Next 7 Days Unavailable
              </button>
              <button
                onClick={() => {
                  const weekends = calendarDates.filter(
                    (d) => [0, 6].includes(parseISO(d).getDay())
                  )
                  bulkMarkUnavailable(weekends)
                }}
                disabled={saving}
                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Mark All Weekends Unavailable
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to reset all delivery days? This will remove all availability settings and make all dates available by default.')) return
                  
                  setSaving(true)
                  try {
                    await api.post('/delivery/admin/delivery-days/reset')
                    await loadDeliveryDays()
                    alert('All delivery days have been reset to default')
                  } catch (error: any) {
                    console.error('Error resetting delivery days:', error)
                    alert(error?.response?.data?.message || 'Failed to reset delivery days')
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white border border-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Reset All to Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots Tab */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Delivery Time Slots</h2>
            <button
              onClick={() => {
                setEditingSlot(null)
                setShowSlotForm(true)
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              + Add Time Slot
            </button>
          </div>

          {/* Time Slot Form */}
          {showSlotForm && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4">
                {editingSlot ? 'Edit Time Slot' : 'New Time Slot'}
              </h3>
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

          {/* Time Slots List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Label</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time Range</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className={!slot.is_active ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">{slot.display_order}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{slot.label}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleTimeSlotActive(slot.id, slot.is_active)}
                        disabled={saving}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          slot.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSlot(slot)
                            setShowSlotForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTimeSlot(slot.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timeSlots.length === 0 && (
              <div className="p-8 text-center text-gray-500">No time slots configured</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Time Slot Form Component
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          required
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., 8:00 AM - 10:00 AM"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
        <input
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border rounded-lg"
          min="0"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="is_active" className="text-sm text-gray-700">
          Active (visible to customers)
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
