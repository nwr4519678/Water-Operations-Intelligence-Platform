// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAlarmsList } from '../../hooks/useViewerQueries';
import {
  LayoutDashboard,
  Map,
  Sparkles,
  AlertTriangle,
  FileText,
  User,
  Settings, ChevronUp, ChevronDown,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { data: alarmsData } = useAlarmsList({ status: 'ACTIVE' });
  const activeAlarmsCount = alarmsData?.totalCount ?? 0;
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileVisible = settingsOpen || location.pathname === '/account';

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/map', label: 'Map & Stations', icon: Map },
    { to: '/ai', label: 'AI Hub', icon: Sparkles },
    { to: '/alarms', label: 'Alarms', icon: AlertTriangle, badge: activeAlarmsCount },
    { to: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      {/* Brand Header */}
      <div className="brand">
        <span className="water-mark">💧</span>
        <div>
          <strong>Water <span>Ops</span></strong>
          <small>National Telemetry Gateway</small>
        </div>
      </div>

      {/* Main Navigation */}
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <i>
                <Icon size={16} strokeWidth={2.2} />
              </i>
              <span className="sidebar-label">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <b>{item.badge}</b>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom-nav">
        {profileVisible && (
          <NavLink to="/account" className={({ isActive }) => `settings-child ${isActive ? 'active' : ''}`}>
            <i><User size={14} strokeWidth={2.2} /></i>
            <span className="sidebar-label">Profile</span>
          </NavLink>
        )}
        <NavLink to="/settings" onClick={() => setSettingsOpen(true)} className={({ isActive }) => `settings-parent ${isActive ? 'active' : ''}`}>
          <i><Settings size={16} strokeWidth={2.2} /></i>
          <span className="sidebar-label">Settings</span>
          <span className="settings-chevron sidebar-label">{profileVisible ? <ChevronDown size={13} /> : <ChevronUp size={13} />}</span>
        </NavLink>
      </div>
    </aside>
  );
};
