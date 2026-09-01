// src/components/layout/Sidebar.tsx
import React, { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import { useAlarmsList, useOperationsOverview } from "../../hooks/useViewerQueries"
import { loadWaterStations } from "../../data/stationLoader"
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
  const activeAlarmsCount = alarmsData?.totalCount ?? 0
  const { data: overviewData } = useOperationsOverview()
  const [dahitiCounts, setDahitiCounts] = useState({ total: 0, online: 0 })

  useEffect(() => {
    let active = true
    loadWaterStations()
      .then(({ stations }) => {
        if (active) {
          setDahitiCounts({
            total: stations.length,
            online: stations.filter((station) => station.connectionState === "online").length,
          })
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const stationCount = overviewData?.totalStations || dahitiCounts.total
  const onlineCount = overviewData?.onlineStations ?? dahitiCounts.online

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
        <strong>{onlineCount}/{stationCount} Stations Online</strong>
        <div className="pulse-line">⌁</div>
        <small>Backend database telemetry</small>
      </div>

      <button className="collapse" type="button">
        ⇐ <span>Collapse</span>
      </button>
    </aside>
  )
}
