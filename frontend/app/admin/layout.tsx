'use client'

import './admin.css'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { canAccessPath } from '@/lib/admin-permissions'

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

const ICONS: Record<string, string> = {
  grid:       'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  box:        'M21 8l-9-5-9 5v8l9 5 9-5V8zM12 3v18M3.27 6.96L12 12l8.73-5.04',
  package:    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  folder:     'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  plusCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v8M8 12h8',
  menu:       'M3 12h18M3 6h18M3 18h18',
  bag:        'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  users:      'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  handshake:  'M12 2l2.5 2.5L12 7l-2.5-2.5L12 2zM9 10l2.5 2.5L9 15l-2.5-2.5L9 10zm6 0l2.5 2.5L15 15l-2.5-2.5L15 10zM2 14l2.5 2.5L2 19l-2.5-2.5L2 14zm20 0l2.5 2.5L22 19l-2.5-2.5L22 14zM9 19l2.5 2.5L9 24l-2.5-2.5L9 19zm6 0l2.5 2.5L15 24l-2.5-2.5L15 19z',
  truck:      'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  mapPin:     'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  tag:        'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  home:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  chart:      'M18 20V10M12 20V4M6 20v-6',
  settings:   'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-1.09A1.65 1.65 0 009 19.4a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 009 13a1.65 1.65 0 00-1.51-1H6.5A2 2 0 014 9.5 2 2 0 016.5 7.5h1.09A1.65 1.65 0 009 6a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 0013 5a1.65 1.65 0 001-1.51V3.5A2 2 0 0115 1.5a2 2 0 012 2v1.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-1.09a1.65 1.65 0 00-1.51 1z',
  chevronL:   'M15 18l-6-6 6-6',
  chevronR:   'M9 18l6-6-6-6',
  logout:     'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  x:          'M18 6L6 18M6 6l12 12',
  hamburger:  'M3 12h18M3 6h18M3 18h18',
}

type NavItemDef = { href: string; label: string; icon: string; exact?: boolean; badge?: 'pending' | 'pending_products'; superAdminOnly?: boolean }

const NAV_GROUPS: { label: string; items: NavItemDef[] }[] = [
  {
    label: 'OVERVIEW',
    items: [{ href: '/admin', label: 'Dashboard', icon: 'grid', exact: true, badge: 'pending' as const }],
  },
  {
    label: 'CATALOG',
    items: [
      { href: '/admin/products', label: 'Products', icon: 'box', badge: 'pending_products' },
      { href: '/admin/collections', label: 'Collections', icon: 'folder' },
      { href: '/admin/addons', label: 'Add-ons', icon: 'plusCircle' },
      { href: '/admin/navbar-collections', label: 'Navbar', icon: 'menu' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { href: '/admin/inventory', label: 'Inventory', icon: 'package' },
      { href: '/admin/inventory/shopping-list', label: 'Shopping List', icon: 'tag' },
    ],
  },
  {
    label: 'ORDERS & CUSTOMERS',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: 'bag', badge: 'pending' },
      { href: '/admin/users', label: 'Users', icon: 'users' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/admin/collaborators', label: 'Collaborators', icon: 'handshake', superAdminOnly: true },
      { href: '/admin/delivery-settings', label: 'Delivery', icon: 'truck' },
      { href: '/admin/delivery-destinations', label: 'Destinations', icon: 'mapPin' },
      { href: '/admin/promo-codes', label: 'Promo Codes', icon: 'tag' },
      { href: '/admin/rewards', label: 'Rewards', icon: 'star' },
    ],
  },
  {
    label: 'CONTENT & SETTINGS',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: 'home' },
      { href: '/admin/analytics', label: 'Analytics', icon: 'chart' },
      { href: '/admin/admin-controls', label: 'Admin Controls', icon: 'settings' },
    ],
  },
]

function NavItem({ item, isActive, collapsed, badge, onClick }: {
  item: NavItemDef; isActive: boolean; collapsed: boolean; badge?: number; onClick?: () => void
}) {
  const iconPath = ICONS[item.icon] ?? ICONS.grid
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`admin-nav-item${isActive ? ' active' : ''}`}
      title={collapsed ? item.label : undefined}
      style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '8px 12px' }}
    >
      <span style={{ position: 'relative', flexShrink: 0 }}>
        <Icon d={iconPath} size={20} />
        {badge != null && badge > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -6, background: 'var(--admin-danger)', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 999, padding: '1px 4px', lineHeight: 1.4, minWidth: 14, textAlign: 'center' }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminUser, setAdminUser] = useState<{ email: string; permissions: string[]; is_super_admin: boolean; is_collaborator?: boolean; collaborator_brand_name?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingProductsCount, setPendingProductsCount] = useState(0)

  useEffect(() => {
    async function checkAuth() {
      if (pathname === '/admin/login') { setLoading(false); return }
      const token = localStorage.getItem('admin_token')
      if (!token) { router.push('/admin/login'); return }
      try {
        const res = await api.get('/admin/auth/me')
        const user = res.data?.user
        if (user) {
          setAdminUser({
            email: user.email ?? '',
            permissions: Array.isArray(user.permissions) ? user.permissions : [],
            is_super_admin: user.is_super_admin === true,
            is_collaborator: user.is_collaborator === true,
            collaborator_brand_name: user.collaborator_brand_name ?? null,
          })
        } else {
          setAdminUser(null)
          router.push('/admin/login')
        }
      } catch {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [pathname, router])

  useEffect(() => {
    if (pathname === '/admin/login' || !adminUser || loading) return
    const allowed = canAccessPath(pathname, adminUser.permissions, adminUser.is_super_admin)
    if (!allowed) {
      router.replace('/admin')
    }
  }, [pathname, adminUser, loading, router])

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin_sidebar_collapsed', String(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (!adminUser) return
    api.get('/admin/orders', { params: { status: 'pending' } })
      .then((res) => setPendingCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => {})
  }, [adminUser, pathname])

  useEffect(() => {
    if (!adminUser?.is_super_admin) return
    api.get('/admin/products', { params: { type: 'collaborator', approvalStatus: 'pending' } })
      .then((res) => setPendingProductsCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => {})
  }, [adminUser?.is_super_admin, pathname])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  function isActive(item: NavItemDef) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  if (loading) {
    return (
      <div className="admin-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--admin-border)', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <span style={{ color: 'var(--admin-text-2)', fontSize: 14 }}>Loading…</span>
        </div>
      </div>
    )
  }

  if (!adminUser) return null

  const sidebarWidth = collapsed ? 64 : 240

  const filterNavGroups = () => {
    const isCollaborator = adminUser?.is_collaborator === true
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.superAdminOnly && !adminUser?.is_super_admin) return false
        if (isCollaborator) return item.href === '/admin/products' || item.href === '/admin/orders' || item.href === '/admin'
        return canAccessPath(item.href, adminUser.permissions, adminUser.is_super_admin)
      }),
    })).filter((g) => g.items.length > 0)
  }

  const renderNavGroups = (forDrawer = false) => (
    <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
      {filterNavGroups().map((group) => (
        <div key={group.label} style={{ marginBottom: 16 }}>
          {!(forDrawer ? false : collapsed) && (
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-3)', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 4 }}>
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive(item)}
              collapsed={forDrawer ? false : collapsed}
              badge={item.badge === 'pending' ? pendingCount : item.badge === 'pending_products' ? pendingProductsCount : undefined}
              onClick={forDrawer ? () => setDrawerOpen(false) : undefined}
            />
          ))}
        </div>
      ))}
    </nav>
  )

  const adminEmail = adminUser.email || 'Admin'
  const adminInitial = adminEmail.charAt(0).toUpperCase() || 'A'
  const collaboratorBadge = adminUser?.is_collaborator && adminUser?.collaborator_brand_name ? `Collaborator · ${adminUser.collaborator_brand_name}` : null

  return (
    <div className="admin-root" style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Desktop Sidebar (sticky, part of flex flow) ── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          transition: 'width 0.25s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: 'var(--admin-surface)',
          borderRight: '1px solid var(--admin-border)',
          flexDirection: 'column',
          overflowX: 'hidden',
          zIndex: 100,
        }}
      >
        <div style={{ padding: collapsed ? '20px 0' : '20px 16px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 72, flexShrink: 0 }}>
          {collapsed
            ? <span style={{ fontSize: 22 }}>🎁</span>
            : <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--admin-accent)', whiteSpace: 'nowrap' }}>🎁 Wrap It Up</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-3)', marginTop: 2 }}>Admin Panel</div>
              </div>
          }
        </div>

        {renderNavGroups(false)}

        <div style={{ borderTop: '1px solid var(--admin-border)', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {adminInitial}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
                {collaboratorBadge && <div style={{ fontSize: 10, color: 'var(--admin-accent)', marginTop: 1 }}>{collaboratorBadge}</div>}
                <button type="button" onClick={logout} style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: 'var(--admin-text-3)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 'unset', minWidth: 'unset' }}>
                  Sign out
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            style={{ width: '100%', padding: 10, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-3)', borderTop: collapsed ? 'none' : '1px solid var(--admin-border)', minHeight: 'unset', fontFamily: 'inherit', gap: 6, fontSize: 12, paddingLeft: 16, paddingRight: 16 }}
          >
            {!collapsed && <span>Collapse</span>}
            <Icon d={collapsed ? ICONS.chevronR : ICONS.chevronL} size={16} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="lg:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 200, gap: 12 }}>
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ background: 'none', border: 'none', padding: 11, color: 'var(--admin-text)', cursor: 'pointer', minHeight: 44, minWidth: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={ICONS.hamburger} size={22} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--admin-accent)', flex: 1, textAlign: 'center' }}>🎁 Wrap It Up</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {collaboratorBadge && <span style={{ fontSize: 11, color: 'var(--admin-accent)', fontWeight: 600 }}>{collaboratorBadge}</span>}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)', fontWeight: 700, fontSize: 13 }}>
            {adminInitial}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} className="lg:hidden" style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.45)', zIndex: 300 }} />
          <aside className="lg:hidden" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: 'var(--admin-surface)', zIndex: 301, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--admin-accent)' }}>🎁 Wrap It Up</span>
              <button type="button" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', padding: 10, cursor: 'pointer', color: 'var(--admin-text-2)', minHeight: 44, minWidth: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICONS.x} size={20} />
              </button>
            </div>
            {renderNavGroups(true)}
            <div style={{ borderTop: '1px solid var(--admin-border)', padding: 16, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--admin-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {adminInitial}
              </div>
<div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
              {collaboratorBadge && <div style={{ fontSize: 10, color: 'var(--admin-accent)', marginTop: 1 }}>{collaboratorBadge}</div>}
              </div>
              <button type="button" onClick={logout} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--admin-text-3)', minHeight: 'unset', minWidth: 'unset', borderRadius: 6 }} title="Sign out">
                <Icon d={ICONS.logout} size={18} />
              </button>
            </div>
          </aside>
        </>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <div className="lg:hidden" style={{ height: 56, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: 'clamp(16px, 3vw, 32px)', minWidth: 0 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
