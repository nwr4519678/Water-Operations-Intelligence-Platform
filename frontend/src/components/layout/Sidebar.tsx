// src/components/layout/Sidebar.tsx
import React from "react"
import { NavLink } from "react-router-dom"
import { useAlarmsList } from "../../hooks/useViewerQueries"
import {
  LayoutDashboard,
  Map,
  Sparkles,
  AlertTriangle,
  FileText,
  User,
  Settings,
} from "lucide-react"

export const Sidebar: React.FC = () => {
  const { data: alarmsData } = useAlarmsList({ status: "ACTIVE" })
  const activeAlarmsCount = alarmsData?.totalCount || 3

  const navItems = [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/map", label: "Map & Stations", icon: Map },
    { to: "/ai", label: "AI Hub", icon: Sparkles },
    {
      to: "/alarms",
      label: "Alarms",
      icon: AlertTriangle,
      badge: activeAlarmsCount,
    },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/account", label: "Account", icon: User },
    { to: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <span className="water-mark">💧</span>
        <div>
          <strong>
            Water <span>Ops</span>
          </strong>
          <small>National Telemetry Gateway</small>
        </div>
      </div>

      {/* Main Navigation */}
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i>
                <Icon size={16} strokeWidth={2.2} />
              </i>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <b>{item.badge}</b>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* System Status Box */}
      <div className="system-status">
        <span>
          <i className="dot good" /> National Network
        </span>
        <strong>410 Stations Live</strong>
        <div className="pulse-line">⌁</div>
        <small>Dual satellite & GSM feeds</small>
      </div>

      <button className="collapse" type="button">
        ⇐ <span>Collapse</span>
      </button>
    </aside>
  )
}
