// src/components/layout/Header.tsx
import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useUiStore } from "../../store/uiStore"
import { useAlarmsList } from "../../hooks/useViewerQueries"

export const Header: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const setGlobalSearchOpen = useUiStore((state) => state.setGlobalSearchOpen)
  const { data: alarmsData } = useAlarmsList({ status: "ACTIVE" })
  const activeAlarmsCount = alarmsData?.totalCount || 3

  const getPageInfo = () => {
    const path = location.pathname
    if (path === "/")
      return {
        title: "Overview",
        subtitle:
          "Real-time national water network telemetry across 410 monitoring nodes in Egypt",
      }
    if (path === "/map")
      return {
        title: "Map & Stations",
        subtitle:
          "410 interactive monitoring stations (Leaflet + MarkerCluster)",
      }
    if (path.startsWith("/stations/"))
      return {
        title: "Station Telemetry",
        subtitle: "High-frequency telemetry metrics & AI forecasting",
      }
    if (path === "/ai")
      return {
        title: "AI Hub",
        subtitle: "Autonomous anomaly detection & predictive maintenance",
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
      <button className="menu" type="button">
        ☰
      </button>
      <div className="page-title">
        <h1>{info.title}</h1>
        <p>{info.subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Global Search across 410 stations */}
        <label
          className="search cursor-pointer"
          onClick={() => setGlobalSearchOpen(true)}
        >
          <span>⌕</span>
          <input
            readOnly
            placeholder="Search stations (English / عربي)..."
            className="cursor-pointer"
          />
        </label>

        {/* Notification Bell */}
        <button
          className="icon-button notification"
          type="button"
          onClick={() => navigate("/alarms")}
          title="Active Alarms"
        >
          ♧<b>{activeAlarmsCount}</b>
        </button>

        {/* User Profile */}
        <div
          className="user cursor-pointer"
          onClick={() => navigate("/account")}
          title="View Account Profile"
        >
          <span>◉</span>
          <div>
            <strong>Eng. Mohamed Atef</strong>
            <small>National Operations Center</small>
          </div>
        </div>
      </div>
    </header>
  )
}
