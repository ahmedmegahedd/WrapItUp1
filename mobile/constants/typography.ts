/**
 * App-wide typography scale.
 * Import individual tokens or the full `typography` object.
 */
export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
};

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const letterSpacings = {
  tight: -0.3,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  widest: 1.0,
};

export const typography = {
  display: { fontSize: fontSizes['5xl'], fontWeight: fontWeights.extrabold, letterSpacing: letterSpacings.tight },
  h1: { fontSize: fontSizes['4xl'], fontWeight: fontWeights.bold, letterSpacing: letterSpacings.tight },
  h2: { fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold },
  h3: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.semibold },
  h4: { fontSize: fontSizes.xl, fontWeight: fontWeights.semibold },
  title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular },
  bodySmall: { fontSize: fontSizes.sm, fontWeight: fontWeights.regular },
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.regular },
  label: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold, letterSpacing: letterSpacings.wider },
  button: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, letterSpacing: letterSpacings.wide },
  buttonSm: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, letterSpacing: letterSpacings.wide },
  price: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },
  priceLg: { fontSize: fontSizes['2xl'], fontWeight: fontWeights.extrabold },
};
