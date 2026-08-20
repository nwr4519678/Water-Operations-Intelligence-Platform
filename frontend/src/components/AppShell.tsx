import { NavLink, Outlet } from 'react-router-dom';
import type { Session } from '../types/auth';
import { directionFor, translate } from '../i18n';
import { OfflineBanner } from './ui';

type NavItem = { path: string; label: string };

export function AppShell({ nav, session }: { nav: NavItem[]; session: Session }) {
  return (
    <div className="app-shell" dir={directionFor(session.locale)} lang={session.locale}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><strong>{translate(session.locale, 'appName')}</strong><span>{translate(session.locale, 'viewerWorkspace')}</span></div>
        <nav>{nav.map((item) => <NavLink key={item.path} to={`/${item.path}`}>{item.label}</NavLink>)}</nav>
      </aside>
      <div className="app-main">
        <header className="topbar"><div><span className="eyebrow">CONTROL ROOM</span><strong>{session.displayName}</strong></div><span className="status-pill">{translate(session.locale, 'readOnly')}</span></header>
        <OfflineBanner locale={session.locale} />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
