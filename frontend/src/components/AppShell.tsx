import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import type { Session } from '../types/auth';
import { directionFor, translate } from '../i18n';
import { OfflineBanner } from './ui';
import { alarms, stations } from '../features/viewer/data';

type NavItem = { path: string; label: string };
const navIcons: Record<string, string> = {
  '': '▦',
  map: '⌖',
  alarms: '♧',
  reports: '▤',
  'ai-insights': '✦',
};

export function AppShell({ nav, session }: { nav: NavItem[]; session: Session }) {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const results =
    search.length > 1
      ? [
          ...stations.map((item) => `${item.id} · ${item.name}`),
          ...alarms.map((item) => `${item.id} · ${item.title}`),
        ]
          .filter((item) => item.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 5)
      : [];
  return (
    <div className="app-shell" dir={directionFor(session.locale)} lang={session.locale}>
      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◊
          </span>
          <span className="brand-copy">
            <strong>{translate(session.locale, 'appName')}</strong>
            <span>{translate(session.locale, 'viewerWorkspace')}</span>
          </span>
          <button
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <nav>
          <span className="nav-caption">WORKSPACE</span>
          {nav
            .filter((item) => item.path !== 'stations')
            .map((item) => (
              <NavLink key={item.path} to={`/${item.path}`} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon" aria-hidden="true">
                  {navIcons[item.path] ?? '•'}
                </span>
                <span>{item.label}</span>
                {item.path === 'alarms' && <span className="nav-count">12</span>}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            <div>
              <b>System status</b>
              <strong>Healthy</strong>
              <small>All systems operational</small>
            </div>
            <span className="status-wave">⌁</span>
          </div>
          <span className="viewer-scope">
            <span className="scope-dot" />
            <span>Viewer access</span>
            <span className="scope-readonly">Read-only</span>
          </span>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="topbar-title">
            <span className="eyebrow">VIEWER WORKSPACE</span>
            <strong>Network overview</strong>
          </div>
          <div className="global-search">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <label className="sr-only" htmlFor="global-search">
              Search stations and alarms
            </label>
            <input
              id="global-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stations, alarms..."
            />
            <kbd>⌘ K</kbd>
            {results.length > 0 && (
              <div className="search-results" role="listbox">
                {results.map((result) => (
                  <div role="option" key={result}>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button notification-button"
              aria-label="Open notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              ♧<span>7</span>
            </button>
            <button className="icon-button" aria-label="Toggle theme">
              ☼
            </button>
            <div className="profile-chip">
              <span className="avatar">V</span>
              <span>
                <b>{session.displayName}</b>
                <small>Viewer</small>
              </span>
              <span className="chevron">⌄</span>
            </div>
          </div>
          {notificationsOpen && (
            <div className="notification-popover">
              <b>Notifications</b>
              <p>Data import completed successfully.</p>
              <small>2 min ago · Live</small>
            </div>
          )}
        </header>
        <OfflineBanner locale={session.locale} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
