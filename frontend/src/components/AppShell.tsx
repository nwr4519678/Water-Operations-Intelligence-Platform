import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import type { Session } from '../types/auth';
import { directionFor, translate } from '../i18n';
import { OfflineBanner } from './ui';
import { alarms, stations } from '../features/viewer/data';

type NavItem = { path: string; label: string };

export function AppShell({ nav, session }: { nav: NavItem[]; session: Session }) {
  const [search, setSearch] = useState('');
  const results = search.length > 1 ? [...stations.map((item) => `${item.id} · ${item.name}`), ...alarms.map((item) => `${item.id} · ${item.title}`)].filter((item) => item.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];
  return (
    <div className="app-shell" dir={directionFor(session.locale)} lang={session.locale}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <strong>{translate(session.locale, 'appName')}</strong>
          <span>{translate(session.locale, 'viewerWorkspace')}</span>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.path} to={`/${item.path}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="global-search"><label className="sr-only" htmlFor="global-search">Search stations and alarms</label><input id="global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stations, alarms..." /><kbd>⌘ K</kbd>{results.length > 0 && <div className="search-results" role="listbox">{results.map((result) => <div role="option" key={result}>{result}</div>)}</div>}</div>
          <div>
            <span className="eyebrow">CONTROL ROOM</span>
            <strong>{session.displayName}</strong>
          </div>
          <span className="status-pill">{translate(session.locale, 'readOnly')}</span>
        </header>
        <OfflineBanner locale={session.locale} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
