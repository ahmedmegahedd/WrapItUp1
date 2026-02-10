/**
 * Format a number with thousand separators (e.g. 1500 -> "1,500").
 * Use for prices, points, and any number above 999.
 */
export function formatNumber(value: number, decimals?: number): string {
  const n = Number(value);
  if (decimals != null) {
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  const s = n.toFixed(2).replace(/\.?0+$/, '');
  const [intPart, fracPart] = s.split('.');
  const withCommas = Number(intPart).toLocaleString('en-US');
  return fracPart ? `${withCommas}.${fracPart}` : withCommas;
}

/**
 * Format a price for display: EGP currency, commas for thousands, no trailing .00
 * e.g. 100 -> "EGP 100", 1500 -> "EGP 1,500", 99.5 -> "EGP 99.5"
 */
export function formatPrice(amount: number): string {
  const n = Number(amount);
  const s = n.toFixed(2).replace(/\.?0+$/, '');
  const [intPart, fracPart] = s.split('.');
  const withCommas = Number(intPart).toLocaleString('en-US');
  const formatted = fracPart ? `${withCommas}.${fracPart}` : withCommas;
  return `EGP ${formatted}`;
}
