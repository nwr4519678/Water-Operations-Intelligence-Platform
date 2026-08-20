export type SupportedLocale = 'ar' | 'en'

export const resources = {
  en: {
    appName: 'Water Operations Intelligence',
    navigation: {
      overview: 'Overview',
      stations: 'Stations',
      alarms: 'Alarms',
      reports: 'Reports',
    },
    actions: {
      retry: 'Retry',
      close: 'Close',
      cancel: 'Cancel',
      apply: 'Apply filters',
      clear: 'Clear filters',
      previous: 'Previous page',
      next: 'Next page',
    },
    states: {
      loading: 'Loading data',
      empty: 'No data available',
      error: 'Something went wrong',
      stale: 'Data may be out of date',
      forbidden: 'You do not have permission to view this data',
    },
  },
  ar: {
    appName: 'ذكاء عمليات المياه',
    navigation: {
      overview: 'نظرة عامة',
      stations: 'المحطات',
      alarms: 'التنبيهات',
      reports: 'التقارير',
    },
    actions: {
      retry: 'إعادة المحاولة',
      close: 'إغلاق',
      cancel: 'إلغاء',
      apply: 'تطبيق الفلاتر',
      clear: 'مسح الفلاتر',
      previous: 'الصفحة السابقة',
      next: 'الصفحة التالية',
    },
    states: {
      loading: 'جارٍ تحميل البيانات',
      empty: 'لا توجد بيانات',
      error: 'حدث خطأ ما',
      stale: 'قد تكون البيانات قديمة',
      forbidden: 'ليس لديك صلاحية لعرض هذه البيانات',
    },
  },
} as const

export type TranslationResource = (typeof resources)[SupportedLocale]

export function getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
