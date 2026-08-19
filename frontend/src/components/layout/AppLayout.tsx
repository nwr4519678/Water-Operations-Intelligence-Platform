import { useMemo, useState } from 'react'
import { Bell, BookOpen, ChevronLeft, ChevronRight, Download, Gauge, LayoutDashboard, LogOut, Menu, Moon, Radio, Settings2, Sun, UserRound, Waves, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { getStation } from '../../services/mockData'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { SessionExpiryToast } from './SessionExpiryToast'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/devices', label: 'Devices', icon: Gauge },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/blog', label: 'Blog', icon: BookOpen },
  { to: '/download-center', label: 'Download Center', icon: Download },
  { to: '/device-config', label: 'Device Config', icon: Settings2 },
]

function breadcrumbs(pathname: string): string[] {
  if (pathname.startsWith('/devices/')) { const station = getStation(pathname.split('/')[2] ?? ''); return ['Dashboard', 'Devices', station?.name ?? 'Station'] }
  const direct: Record<string, string[]> = { '/dashboard': ['Dashboard'], '/devices': ['Dashboard', 'Devices'], '/alerts': ['Dashboard', 'Alerts'], '/download-center': ['Dashboard', 'Download Center'], '/device-config': ['Dashboard', 'Device Config'], '/profile': ['Dashboard', 'Profile'], '/blog': ['Dashboard', 'Blog'] }
  return direct[pathname] ?? ['Dashboard']
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const { logout, session } = useAuth()
  const { theme, toggleTheme, language, toggleLanguage } = useTheme()
  const crumbs = useMemo(() => breadcrumbs(pathname), [pathname])

  return <div className={`app-frame ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand"><Link to="/dashboard" className="brand-link"><span className="brand-icon"><Waves size={22} /></span><span className="brand-word">EchoCloud</span></Link><button className="mobile-only close-sidebar" type="button" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
      <nav className="side-nav" aria-label="Main navigation"><p>MENU</p>{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `side-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-status"><span className="pulse-dot" /><div><strong>Real-time connected</strong><small>Viewer access</small></div></div>
      <button className="collapse-button" type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">{collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
    </aside>
    {mobileOpen && <button aria-label="Close navigation overlay" className="nav-backdrop" type="button" onClick={() => setMobileOpen(false)} />}
    <div className="app-content"><header className="topbar"><button className="mobile-only menu-button" type="button" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><nav className="breadcrumbs" aria-label="Breadcrumb">{crumbs.map((crumb, index) => <span key={`${crumb}-${index}`}>{index > 0 && <b>/</b>}{crumb}</span>)}</nav><div className="top-actions"><div className="connection-banner"><Radio size={14} /><span>Connected</span><small>Real time</small></div><button className="icon-action" type="button" onClick={toggleLanguage}>{language === 'en' ? 'ع' : 'EN'}</button><button className="icon-action" type="button" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-action notification-action" type="button" aria-label="Notifications"><Bell size={18} /><i>1</i></button><div className="user-menu"><span>VM</span><div><strong>Viewer</strong><small>{session?.email}</small></div></div><button className="logout-action" type="button" onClick={logout}><LogOut size={17} /><span>Logout</span></button></div></header><main className="page-wrap"><Outlet /></main></div><SessionExpiryToast /></div>
}
