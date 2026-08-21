import en from '../locales/en/common.json';
import ar from '../locales/ar/common.json';

export type Locale = 'en' | 'ar';
export const dictionaries = { en, ar } as const;

export function translate(locale: Locale, key: keyof typeof en) {
  return dictionaries[locale][key];
}

export function directionFor(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
