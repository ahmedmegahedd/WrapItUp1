/**
 * Account screen design tokens — aligned with pink brand palette.
 */
export const accountColors = {
  background: '#FDF2F8',
  backgroundElevated: '#FFFFFF',
  cream: '#FDF2F8',
  beige: '#FCE7F3',
  charcoal: '#111827',
  charcoalMuted: '#6B7280',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#6B7280',
  gold: '#F59E0B',
  goldMuted: '#F59E0B',
  border: '#FCE7F3',
  borderLight: '#FCE7F3',
  success: '#10B981',
  error: '#EF4444',
  destructive: '#EF4444',
  link: '#EC4899',
};

export const accountSpacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  sectionGap: 32,
};

export const accountTypography = {
  welcome: { fontSize: 28, fontWeight: '300' as const },
  welcomeSubtitle: { fontSize: 15, lineHeight: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '500' as const },
  cardValue: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 13 },
  button: { fontSize: 16, fontWeight: '500' as const },
};

export const accountBorderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 9999,
};

export const accountShadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
};
