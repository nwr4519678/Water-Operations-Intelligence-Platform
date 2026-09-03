// src/components/layout/Sidebar.tsx
import React, { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAlarmsList, useOperationsOverview } from "../../hooks/useViewerQueries"
import { loadWaterStations } from "../../data/stationLoader"
import { useAuth } from "../../hooks/useAuth"
import {
  LayoutDashboard,
  Map,
  Sparkles,
  AlertTriangle,
  FileText,
  User,
  Settings,
  Droplets,
  Radio,
  LogOut,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react"

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { data: alarmsData } = useAlarmsList({ status: "ACTIVE" })
  const activeAlarmsCount = alarmsData?.totalCount ?? 0
  const { data: overviewData } = useOperationsOverview()
  const [dahitiCounts, setDahitiCounts] = useState({ total: 19, online: 13 })

  useEffect(() => {
    let active = true
    loadWaterStations()
      .then((res) => {
        if (active && res && Array.isArray(res.stations)) {
          setDahitiCounts({
            total: res.stations.length,
            online: res.stations.filter((s) => s.connectionState === "online").length,
          })
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  const stationCount = overviewData?.totalStations || dahitiCounts.total || 19
  const onlineCount = overviewData?.onlineStations ?? dahitiCounts.online ?? 13
  const healthPercent = Math.round((onlineCount / Math.max(1, stationCount)) * 100)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const navSections = [
    {
      label: "TELEMETRY & OPERATIONS",
      items: [
        { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
        { to: "/map", label: "Map & Stations", icon: Map },
        { to: "/ai", label: "AI Anomaly Hub", icon: Sparkles, tag: "AI" },
        {
          to: "/alarms",
          label: "Active Alarms",
          icon: AlertTriangle,
          badge: activeAlarmsCount,
        },
      ],
    },
    {
      label: "GOVERNANCE & SYSTEM",
      items: [
        { to: "/reports", label: "Compliance Reports", icon: FileText },
        { to: "/account", label: "Operator Profile", icon: User },
        { to: "/settings", label: "System Settings", icon: Settings },
      ],
    },
  ]

  const userInitial = currentUser?.email?.charAt(0).toUpperCase() || "O"
  const userName = currentUser?.name || currentUser?.email?.split("@")[0] || "Operator"

  return (
    <aside className="scada-sidebar">
      {/* ── Brand Header ── */}
      <div className="scada-brand">
        <div className="scada-brand__symbol">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div className="scada-brand__text">
          <div className="scada-brand__title">
            <span>Water</span>Ops
          </div>
          <div className="scada-brand__badge-line">
            <span className="scada-brand__gov">MWRI · EGYPT</span>
            <span className="scada-brand__dot" />
            <span className="scada-brand__tier">SCADA</span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tree ── */}
      <div className="scada-nav-groups">
        {navSections.map((section) => (
          <div key={section.label} className="scada-group">
            <div className="scada-group__title">{section.label}</div>
            <nav className="scada-nav">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `scada-link ${isActive ? "active" : ""}`
                    }
                  >
                    <span className="scada-link__indicator" />
                    <span className="scada-link__icon">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="scada-link__name">{item.label}</span>

                    {item.tag && (
                      <span className="scada-link__tag">{item.tag}</span>
                    )}

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="scada-link__alarm-badge">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* ── Telemetry Quick Insight Widget ── */}
      <div className="scada-telemetry-widget">
        <div className="scada-telemetry-widget__header">
          <div className="scada-telemetry-widget__status">
            <span className="scada-telemetry-widget__pulse" />
            <span>National Grid</span>
          </div>
          <span className="scada-telemetry-widget__percent">{healthPercent}%</span>
        </div>

        <div className="scada-telemetry-widget__bar">
          <div
            className="scada-telemetry-widget__fill"
            style={{ width: `${healthPercent}%` }}
          />
        </div>

        <div className="scada-telemetry-widget__metrics">
          <div className="scada-telemetry-widget__item">
            <span className="scada-telemetry-widget__key">Active</span>
            <span className="scada-telemetry-widget__val">{onlineCount}/{stationCount}</span>
          </div>
          <div className="scada-telemetry-widget__divider" />
          <div className="scada-telemetry-widget__item">
            <span className="scada-telemetry-widget__key">Aswan</span>
            <span className="scada-telemetry-widget__val">178.1m</span>
          </div>
          <div className="scada-telemetry-widget__divider" />
          <div className="scada-telemetry-widget__item">
            <span className="scada-telemetry-widget__key">Ping</span>
            <span className="scada-telemetry-widget__val">142ms</span>
          </div>
        </div>
      </div>

      {/* ── Operator User Footer ── */}
      <div className="scada-user-footer">
        <div className="scada-user-footer__avatar">
          {userInitial}
        </div>
        <div className="scada-user-footer__info">
          <div className="scada-user-footer__name">{userName}</div>
          <div className="scada-user-footer__role">
            <Shield size={10} className="text-emerald-500" />
            <span>Viewer Role</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of console"
          className="scada-user-footer__logout"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
