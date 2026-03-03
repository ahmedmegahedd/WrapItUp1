import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  action?: {
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ReactNode
  }
}

export default function AdminPageHeader({ title, subtitle, breadcrumbs, action }: AdminPageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, color: 'var(--admin-text-3)' }}>
          {breadcrumbs.map((bc, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span>›</span>}
              {bc.href ? (
                <Link href={bc.href} style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
                  {bc.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--admin-text-2)' }}>{bc.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0, lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 14, color: 'var(--admin-text-2)', marginTop: 4, marginBottom: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          action.href ? (
            <Link href={action.href} className="admin-btn-primary" style={{ textDecoration: 'none' }}>
              {action.icon}
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="admin-btn-primary">
              {action.icon}
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
