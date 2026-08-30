// src/components/layout/Header.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { useAlarmsList, useOperationsOverview } from '../../hooks/useViewerQueries';
import { Bell, Menu, Search, AlertTriangle, ChevronRight, Clock3 } from 'lucide-react';
import { formatRelative } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { UserRound, ShieldCheck, LogOut, ChevronDown, Building2 } from 'lucide-react';

export const Header: React.FC<{ onMenuClick?: () => void; sidebarCollapsed?: boolean }> = ({ onMenuClick, sidebarCollapsed = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const setGlobalSearchOpen = useUiStore((state) => state.setGlobalSearchOpen);
  const { currentUser, logout } = useAuth();
  const { data: alarmsData } = useAlarmsList({ status: 'ACTIVE' });
  const { data: overviewData } = useOperationsOverview();
  const activeAlarmsCount = alarmsData?.totalCount ?? 0;
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const stationCount = overviewData?.totalStations ?? 410;

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotificationOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, []);

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Overview', subtitle: `Real-time national water network telemetry across ${stationCount} monitoring nodes in Egypt` };
    if (path === '/map') return { title: 'Map & Stations', subtitle: `${stationCount} interactive monitoring stations (MapLibre GL JS + deck.gl WebGL GIS)` };
    if (path.startsWith('/stations/')) return { title: 'Station Telemetry', subtitle: 'High-frequency telemetry metrics & AI forecasting' };
    if (path === '/ai') return { title: 'AI Hub', subtitle: 'Autonomous anomaly detection & predictive maintenance' };
    if (path === '/alarms') return { title: 'Alarms', subtitle: 'National alarm audit log & root cause diagnosis' };
    if (path === '/reports') return { title: 'Reports', subtitle: 'Official telemetry summaries & compliance audits' };
    if (path === '/account') return { title: 'My Account & Institutional Profile', subtitle: 'Operator credentials, role permissions, cybersecurity & personal access tokens' };
    if (path === '/settings') return { title: 'Settings', subtitle: 'User preferences & notification dispatch matrix' };
    return { title: 'Water Operations Platform', subtitle: 'Viewer Portal' };
  };


  const info = getPageInfo();

  return (
    <header className="topbar">
      <button
        className="menu"
        type="button"
        onClick={onMenuClick}
        aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!sidebarCollapsed}
        title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <Menu size={19} strokeWidth={2} />
      </button>
      <div className="page-title">
        <h1>{info.title}</h1>
        <p>{info.subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Global Search across the loaded station registry */}
        <label
          className="search cursor-pointer"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <Search size={15} aria-hidden="true" />
          <input
            readOnly
            placeholder="Search stations, alarms, or reports..."
            className="cursor-pointer"
          />
        </label>

        {/* Notification Bell */}
        <div className="notification-wrap" ref={notificationRef}>
          <button
            className={`icon-button notification ${notificationOpen ? 'is-open' : ''}`}
            type="button"
            onClick={() => setNotificationOpen((open) => !open)}
            title="Latest notifications"
            aria-label="Latest notifications"
            aria-haspopup="dialog"
            aria-expanded={notificationOpen}
          >
            <Bell size={18} strokeWidth={2} aria-hidden="true" />
            {activeAlarmsCount > 0 && <b>{activeAlarmsCount > 99 ? '99+' : activeAlarmsCount}</b>}
          </button>
          {notificationOpen && (
            <div className="notification-popover" role="dialog" aria-label="Latest notifications">
              <div className="notification-popover-head">
                <div><strong>Latest notifications</strong><span>Active operational events</span></div>
                <span className="notification-count">{activeAlarmsCount} active</span>
              </div>
              <div className="notification-list">
                {(alarmsData?.items ?? []).slice(0, 4).map((alarm) => (
                  <button key={alarm.alarmId} type="button" className="notification-item" onClick={() => { setNotificationOpen(false); navigate('/alarms'); }}>
                    <span className={`notification-severity severity-${alarm.severity.toLowerCase()}`}><AlertTriangle size={14} /></span>
                    <span className="notification-copy"><strong>{alarm.message}</strong><small>{alarm.stationName} · {formatRelative(alarm.raisedAtUtc)}</small></span>
                    <ChevronRight size={15} />
                  </button>
                ))}
                {(!alarmsData?.items || alarmsData.items.length === 0) && <div className="notification-empty"><Clock3 size={18} /><span>No active notifications</span></div>}
              </div>
              <button type="button" className="notification-view-all" onClick={() => { setNotificationOpen(false); navigate('/alarms'); }}>Open alarm center <ChevronRight size={15} /></button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="user-menu-wrap" ref={userMenuRef}>
          <button
            type="button"
            className={`user user-trigger ${userMenuOpen ? 'is-open' : ''}`}
            onClick={() => setUserMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-label="Open operator profile menu"
            title="Open operator profile menu"
          >
            <span className="user-avatar"><UserRound size={15} /></span>
            <span className="user-identity"><strong>{currentUser?.name || 'Eng. Mohamed Atef'}</strong><small>National Operations Center</small></span>
            <ChevronDown className="user-chevron" size={14} />
          </button>
          {userMenuOpen && (
            <div className="user-popover" role="menu" aria-label="Operator profile menu">
              <div className="user-popover-head">
                <span className="user-popover-avatar">{String(currentUser?.name || 'MA').slice(0, 2).toUpperCase()}</span>
                <div><strong>{currentUser?.name || 'Eng. Mohamed Atef'}</strong><small>{currentUser?.email || 'viewer.ops@water.gov.eg'}</small></div>
              </div>
              <div className="user-popover-status"><ShieldCheck size={15} /><span><strong>Viewer access</strong><small>Active institutional session</small></span><i /></div>
              <div className="user-popover-details"><span><Building2 size={13} /> Ministry of Water Resources & Irrigation</span><span><UserRound size={13} /> National Operations Center</span></div>
              <button type="button" className="user-menu-action" onClick={() => { setUserMenuOpen(false); navigate('/account'); }} role="menuitem"><UserRound size={15} /> Open account profile</button>
              <button type="button" className="user-menu-logout" onClick={async () => { setUserMenuOpen(false); await logout(); navigate('/login'); }} role="menuitem"><LogOut size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
