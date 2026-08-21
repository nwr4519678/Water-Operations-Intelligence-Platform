export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en', { maximumFractionDigits }).format(value);
}
