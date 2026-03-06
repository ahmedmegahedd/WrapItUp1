/**
 * Permission keys for admin RBAC.
 * When adding a new admin page, add a new key here and insert into admin_permissions (or use sync endpoint).
 */
export const ADMIN_PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_VIEW: 'users.view',
  PRODUCTS_VIEW: 'products.view',
  COLLECTIONS_VIEW: 'collections.view',
  NAVBAR_VIEW: 'navbar.view',
  ADDONS_VIEW: 'addons.view',
  ORDERS_VIEW: 'orders.view',
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_DESTINATIONS_VIEW: 'delivery_destinations.view',
  PROMO_CODES_VIEW: 'promo_codes.view',
  REWARDS_VIEW: 'rewards.view',
  HOMEPAGE_VIEW: 'homepage.view',
  ANALYTICS_VIEW: 'analytics.view',
  ADMIN_CONTROLS_VIEW: 'admin_controls.view',
  INVENTORY_VIEW: 'inventory.view',
  COLLABORATORS_VIEW: 'collaborators.view',
} as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
