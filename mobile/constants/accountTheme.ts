/**
 * Luxury account screen design tokens.
 * Neutral palette: cream, soft beige, charcoal, muted gold accents.
 */
export const accountColors = {
  background: '#faf8f5',
  backgroundElevated: '#ffffff',
  cream: '#f5f1eb',
  beige: '#e8e2d9',
  charcoal: '#2c2c2c',
  charcoalMuted: '#5c5c5c',
  text: '#2c2c2c',
  textSecondary: '#5c5c5c',
  textMuted: '#8a8a8a',
  gold: '#b8860b',
  goldMuted: '#c9a227',
  border: '#e8e2d9',
  borderLight: '#f0ebe3',
  success: '#4a7c59',
  error: '#a63d3d',
  destructive: '#a63d3d',
  link: '#5c5c5c',
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
