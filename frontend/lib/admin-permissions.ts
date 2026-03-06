/**
 * Map admin routes to required permission keys.
 * Must match backend ADMIN_PERMISSIONS and admin_permissions table.
 */
export const ADMIN_PAGE_PERMISSIONS: Record<string, string> = {
  '/admin': 'dashboard.view',
  '/admin/users': 'users.view',
  '/admin/products': 'products.view',
  '/admin/collections': 'collections.view',
  '/admin/navbar-collections': 'navbar.view',
  '/admin/addons': 'addons.view',
  '/admin/orders': 'orders.view',
  '/admin/delivery-settings': 'delivery.view',
  '/admin/delivery-destinations': 'delivery_destinations.view',
  '/admin/promo-codes': 'promo_codes.view',
  '/admin/rewards': 'rewards.view',
  '/admin/homepage': 'homepage.view',
  '/admin/analytics': 'analytics.view',
  '/admin/admin-controls': 'admin_controls.view',
  '/admin/inventory': 'inventory.view',
  '/admin/inventory/shopping-list': 'inventory.view',
  '/admin/collaborators': 'collaborators.view',
}

export function canAccessPath(pathname: string, permissions: string[], isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true
  const path = pathname?.replace(/\/$/, '') || '/admin'
  const required = ADMIN_PAGE_PERMISSIONS[path] ?? ADMIN_PAGE_PERMISSIONS[path + '/'] ?? null
  if (!required) return true
  return permissions.includes(required)
}
