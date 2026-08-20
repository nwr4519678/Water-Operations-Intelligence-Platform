export function formatDate(value: string, locale: 'en' | 'ar' = 'en') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function formatUnit(value: number, unit: string, locale: 'en' | 'ar' = 'en') {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}
