'use client'

import { useEffect } from 'react'

export type ToastItem = {
  id: string
  type: 'success' | 'error'
  message: string
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="admin-toast-container">
      {toasts.map((t) => (
        <ToastEntry key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastEntry({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.type === 'success') {
      const timer = setTimeout(() => onDismiss(toast.id), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.type, onDismiss])

  return (
    <div className={`admin-toast ${toast.type}`}>
      <span style={{ fontSize: 16 }}>
        {toast.type === 'success' ? '✓' : '✕'}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.6,
          fontSize: 16,
          padding: 0,
          lineHeight: 1,
          color: 'inherit',
          minHeight: 'unset',
          minWidth: 'unset',
        }}
      >
        ×
      </button>
    </div>
  )
}

// Helper hook for using toasts
import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}
