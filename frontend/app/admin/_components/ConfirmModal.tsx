'use client'

interface ConfirmModalProps {
  open: boolean
  title?: string
  message: React.ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,20,16,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius-lg)',
          boxShadow: 'var(--admin-shadow-md)',
          padding: 28,
          maxWidth: 420,
          width: '100%',
          animation: 'scale-in 0.18s ease',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 10 }}>
          {title}
        </h3>
        <div style={{ fontSize: 14, color: 'var(--admin-text-2)', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="admin-btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: danger ? 'var(--admin-danger)' : 'var(--admin-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--admin-radius-sm)',
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
