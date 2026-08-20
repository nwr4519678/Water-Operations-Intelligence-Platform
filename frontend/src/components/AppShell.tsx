import { NavLink, Outlet } from 'react-router-dom';
import type { Session } from '../types/auth';

type NavItem = { path: string; label: string };

export function AppShell({ nav, session }: { nav: NavItem[]; session: Session }) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand"><strong>WaterTelemetry</strong><span>Viewer workspace</span></div>
        <nav>{nav.map((item) => <NavLink key={item.path} to={`/${item.path}`}>{item.label}</NavLink>)}</nav>
      </aside>
      <div className="app-main">
        <header className="topbar"><div><span className="eyebrow">CONTROL ROOM</span><strong>{session.displayName}</strong></div><span className="status-pill">Read-only</span></header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
