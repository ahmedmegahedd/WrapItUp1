interface StatusBadgeProps {
  status: string
  type?: 'order' | 'payment' | 'product' | 'default'
}

const ORDER_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:          { bg: '#FEF9E7', color: '#B8860B', label: 'Pending' },
  confirmed:        { bg: '#D1FAE5', color: '#065F46', label: 'Confirmed' },
  preparing:        { bg: '#EBF3FF', color: '#1A56DB', label: 'Preparing' },
  out_for_delivery: { bg: '#F3EEFF', color: '#6B21A8', label: 'Out for Delivery' },
  delivered:        { bg: '#EBF5EF', color: '#4A7C5C', label: 'Delivered' },
  cancelled:        { bg: '#FDEDEC', color: '#C0392B', label: 'Cancelled' },
}

const PAYMENT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  paid:         { bg: '#EBF5EF', color: '#4A7C5C', label: 'Paid' },
  pending:      { bg: '#FEF9E7', color: '#B8860B', label: 'Pending' },
  PENDING_CASH: { bg: '#FEF9E7', color: '#B8860B', label: 'COD Pending' },
  failed:       { bg: '#FDEDEC', color: '#C0392B', label: 'Failed' },
}

const PRODUCT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  active:   { bg: '#EBF5EF', color: '#4A7C5C', label: 'Active' },
  inactive: { bg: '#FDEDEC', color: '#C0392B', label: 'Inactive' },
}

export default function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  let map: Record<string, { bg: string; color: string; label: string }> = {}
  if (type === 'order') map = ORDER_STATUS
  else if (type === 'payment') map = PAYMENT_STATUS
  else if (type === 'product') map = PRODUCT_STATUS

  const config = map[status] ?? {
    bg: '#F3F0EB',
    color: '#6B5E52',
    label: status.replace(/_/g, ' '),
  }

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
        textTransform: 'capitalize',
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  )
}
