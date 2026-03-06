'use client'

const APPROVAL_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: '⏳ Pending Review',   bg: '#FEF9E7', color: '#B8860B' },
  approved:  { label: '✅ Approved',          bg: '#EBF3FF', color: '#1A56DB' },
  active:    { label: '🟢 Active',           bg: '#EBF5EF', color: '#4A7C5C' },
  rejected:  { label: '❌ Rejected',         bg: '#FDEDEC', color: '#C0392B' },
}

export default function ApprovalStatusBadge({ status }: { status: string }) {
  const config = APPROVAL_CONFIG[status] ?? { label: status, bg: '#F3F0EB', color: '#6B5E52' }
  return (
    <span
      style={{
        background: config.bg,
        color: config.color,
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  )
}
