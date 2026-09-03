// src/components/layout/Header.tsx
import React from "react"
import { useLocation } from "react-router-dom"
import { useUiStore } from "../../store/uiStore"
import { NotificationBell } from "../notifications/NotificationBell"
import { UserMenu } from "./UserMenu"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

export const Header: React.FC<{
  onMenuClick?: () => void
  sidebarOpen?: boolean
}> = ({ onMenuClick, sidebarOpen = true }) => {
  const location = useLocation()
  const setGlobalSearchOpen = useUiStore((state) => state.setGlobalSearchOpen)
  const getPageInfo = () => {
    const path = location.pathname
    if (path === "/")
      return {
        title: "Overview",
        subtitle:
          "Real-time water-level targets supplied by the backend database",
      }
    if (path === "/map")
      return {
        title: "Map & Stations",
        subtitle:
          "Database-backed DaHITI monitoring targets",
      }
    if (path.startsWith("/stations/"))
      return {
        title: "Station Telemetry",
        subtitle: "High-frequency telemetry metrics & AI forecasting",
      }
    if (path === "/ai")
      return {
        title: "AI Hub",
        subtitle: "Live anomaly detection from DaHITI observations",
      }
    if (path === "/alarms")
      return {
        title: "Alarms",
        subtitle: "National alarm audit log & root cause diagnosis",
      }
    if (path === "/reports")
      return {
        title: "Reports",
        subtitle: "Official telemetry summaries & compliance audits",
      }
    if (path === "/account")
      return {
        title: "My Account & Institutional Profile",
        subtitle:
          "Operator credentials, role permissions, cybersecurity & personal access tokens",
      }
    if (path === "/settings")
      return {
        title: "Settings",
        subtitle: "User preferences & notification dispatch matrix",
      }
    return { title: "Water Operations Platform", subtitle: "Viewer Portal" }
  }

  const info = getPageInfo()

  return (
    <header className="topbar">
      <button
        className="menu"
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle navigation"
        aria-expanded={sidebarOpen}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? (
          <PanelLeftClose size={18} className="menu-icon" />
        ) : (
          <PanelLeftOpen size={18} className="menu-icon" />
        )}
      </button>
      <div className="page-title">
        <h1>{info.title}</h1>
        <p>{info.subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Global Search across backend stations */}
        <label
          className="search cursor-pointer"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <span>⌕</span>
          <input
            readOnly
            placeholder="Search stations..."
            className="cursor-pointer"
          />
        </label>

        {/* Database-backed notification bell and message list */}
        <NotificationBell />

        {/* Real User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
