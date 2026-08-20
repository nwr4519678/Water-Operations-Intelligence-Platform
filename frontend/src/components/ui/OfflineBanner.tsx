import { useEffect, useState } from 'react';
import { translate } from '../../i18n';

export function OfflineBanner({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online ? null : (
    <aside className="offline-banner" role="status">
      {translate(locale, 'offline')}
    </aside>
  );
}
