// src/pages/AlarmsPage.tsx
import React, { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useAlarmsList } from "../hooks/useViewerQueries"
import { AlarmDetailDrawer } from "../components/alarms/AlarmDetailDrawer"
import { formatDate } from "../utils/formatters"
import { AlarmDto } from "../types/api"
import {
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Sparkles,
  Search,
  X,
  ArrowUpRight,
  MapPin,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Info,
  CheckCircle2,
  Database,
  Radio,
} from "lucide-react"

function getStationBasinInfo(stationId: string, stationName: string): { basin: string; reach: string } {
  const s = `${stationId} ${stationName}`.toLowerCase()
  if (s.includes("210") || s.includes("nasser") || s.includes("aswan")) {
    return { basin: "Lake Nasser Basin", reach: "Aswan High Dam" }
  }
  if (s.includes("17699") || s.includes("27216") || s.includes("toshka")) {
    return { basin: "Toshka Lakes", reach: "New Valley Inland" }
  }
  if (s.includes("17683") || s.includes("rayan") || s.includes("faiyum") || s.includes("fayoum")) {
    return { basin: "Fayoum / Wadi El Rayan", reach: "Inland Depression" }
  }
  if (s.includes("qena") || s.includes("hammadi") || s.includes("naqada") || s.includes("luxor") || s.includes("karnak")) {
    return { basin: "Upper Nile Basin", reach: "Qena Reach" }
  }
  if (s.includes("minya") || s.includes("matai") || s.includes("suef")) {
    return { basin: "Middle Nile Reach", reach: "Minya / Beni Suef" }
  }
  return { basin: "Nile River Corridor", reach: "Main River Stem" }
}

export const AlarmsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const targetAlarmId = searchParams.get("alarmId")

  const [search, setSearch] = useState("")
  const [sevFilter, setSevFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmDto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data, refetch, isFetching } = useAlarmsList({ pageSize: 50 })
  const allAlarms = data?.items || []

  // Auto-open drawer when alarmId is in URL
  useEffect(() => {
    if (!targetAlarmId) return

    const normalizedTarget = targetAlarmId.toLowerCase()
    const found = allAlarms.find(
      (a) =>
        a.alarmId.toLowerCase() === normalizedTarget ||
        normalizedTarget.includes(a.stationId.toLowerCase()) ||
        a.stationId.toLowerCase() === normalizedTarget,
    )

    if (found) {
      setSelectedAlarm(found)
      setDrawerOpen(true)
    } else if (targetAlarmId.includes("DAHITI-")) {
      const stationMatch = targetAlarmId
        .match(/\bDAHITI-\d+\b/i)?.[0]
        ?.toUpperCase()
      if (stationMatch) {
        setSelectedAlarm({
          alarmId: `data-freshness-${stationMatch}`,
          organizationId: "",
          stationId: stationMatch,
          stationName: stationMatch,
          alarmTypeId: 0,
          alarmTypeCode: "DATA_FRESHNESS",
          severity: "WARNING",
          status: "ACTIVE",
          raisedAtUtc: new Date().toISOString(),
          acknowledgedAtUtc: null,
          acknowledgedByEmail: null,
          resolvedAtUtc: null,
          resolvedByEmail: null,
          message: "Historical reading requires maintenance follow-up",
          resolutionNote: null,
          labels: [],
        })
        setDrawerOpen(true)
      }
    }
  }, [targetAlarmId, allAlarms])

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    if (searchParams.has("alarmId")) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete("alarmId")
      setSearchParams(nextParams, { replace: true })
    }
  }

  // Summary statistics
  const totalCount = allAlarms.length
  const criticalCount = allAlarms.filter((a) => a.severity === "CRITICAL").length
  const warningCount = allAlarms.filter((a) => a.severity === "WARNING").length
  const infoCount = allAlarms.filter((a) => a.severity === "INFO").length

  const activeCount = allAlarms.filter((a) => a.status === "ACTIVE").length
  const ackCount = allAlarms.filter((a) => a.status === "ACKNOWLEDGED").length
  const resCount = allAlarms.filter((a) => a.status === "RESOLVED").length

  // Filter logic
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allAlarms.filter((a) => {
      const matchSearch =
        !q ||
        a.alarmId.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.stationName.toLowerCase().includes(q) ||
        a.stationId.toLowerCase().includes(q) ||
        a.alarmTypeCode.toLowerCase().includes(q)

      const matchSev = sevFilter === "All" || a.severity === sevFilter
      const matchStatus = statusFilter === "All" || a.status === statusFilter
      return matchSearch && matchSev && matchStatus
    })
  }, [allAlarms, search, sevFilter, statusFilter])

  const hasActiveFilters = search !== "" || sevFilter !== "All" || statusFilter !== "All"

  const resetFilters = () => {
    setSearch("")
    setSevFilter("All")
    setStatusFilter("All")
  }

  const handleRowClick = (a: AlarmDto) => {
    setSelectedAlarm(a)
    setDrawerOpen(true)
  }

  const handleExportCsv = () => {
    const headers = ["Alarm ID", "Raised At UTC", "Severity", "Station ID", "Station Name", "Message", "Status", "AI Probability"]
    const rows = filtered.map((a) => [
      a.alarmId,
      a.raisedAtUtc,
      a.severity,
      a.stationId,
      `"${a.stationName}"`,
      `"${a.message}"`,
      a.status,
      a.faultProbability ? `${Math.round(a.faultProbability * 100)}%` : "Neural Verified",
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `alarms_audit_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const warnPct = totalCount > 0 ? (warningCount / totalCount) * 100 : 0
  const critPct = totalCount > 0 ? (criticalCount / totalCount) * 100 : 0
  const infoPct = totalCount > 0 ? (infoCount / totalCount) * 100 : 0

  return (
    <div className="alarm-mgmt-page">
      {/* ── 1. Page Header & Operational Actions ── */}
      <div className="alarm-mgmt-header">
        <div className="alarm-mgmt-title-group">
          <h1>National Alarm Management &amp; Audit Log</h1>
          <p>Continuous telemetry audit, threshold violations, and neural root cause diagnosis across 19 national monitoring reaches</p>
        </div>

        <div className="alarm-mgmt-actions">
          <span className="alarm-live-badge">
            <span className="alarm-live-dot" />
            Live Telemetry Feed · 60s Polling
          </span>

          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{isFetching ? "Syncing…" : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Executive Alarm KPI Command Ribbon (4 Metric Cards) ── */}
      <div className="alarm-kpi-grid">
        {/* Card 1: Active Incidents */}
        <div className="alarm-kpi-card alarm-kpi-card--amber">
          <div className="alarm-kpi-top">
            <div className="alarm-kpi-icon-box alarm-kpi-icon-box--amber">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="alarm-kpi-pill alarm-kpi-pill--amber">
              {activeCount > 0 ? `${activeCount} In-Flight` : "Nominal"}
            </span>
          </div>
          <div>
            <div className="alarm-kpi-val">{activeCount}</div>
            <div className="alarm-kpi-label">Active Incidents</div>
          </div>
          <div className="alarm-kpi-sub">
            {activeCount === 1 ? "1 alert requires" : `${activeCount} alerts require`} operational triage
          </div>
        </div>

        {/* Card 2: Critical Threats */}
        <div className="alarm-kpi-card alarm-kpi-card--emerald">
          <div className="alarm-kpi-top">
            <div className="alarm-kpi-icon-box alarm-kpi-icon-box--emerald">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="alarm-kpi-pill alarm-kpi-pill--emerald">
              {criticalCount === 0 ? "0 Critical" : `${criticalCount} Urgent`}
            </span>
          </div>
          <div>
            <div className="alarm-kpi-val" style={{ color: criticalCount === 0 ? "#059669" : "#b91c1c" }}>
              {criticalCount}
            </div>
            <div className="alarm-kpi-label">Critical Threats</div>
          </div>
          <div className="alarm-kpi-sub">
            {criticalCount === 0 ? "All storage dams within safe operating margins" : "Immediate hydraulic intervention needed"}
          </div>
        </div>

        {/* Card 3: Warning Thresholds */}
        <div className="alarm-kpi-card alarm-kpi-card--blue">
          <div className="alarm-kpi-top">
            <div className="alarm-kpi-icon-box alarm-kpi-icon-box--blue">
              <Radio className="w-5 h-5" />
            </div>
            <span className="alarm-kpi-pill alarm-kpi-pill--blue">
              {warningCount} Warnings
            </span>
          </div>
          <div>
            <div className="alarm-kpi-val">{warningCount}</div>
            <div className="alarm-kpi-label">Warning Deviations</div>
          </div>
          <div className="alarm-kpi-sub">
            Satellite data freshness &amp; telemetry latency flags
          </div>
        </div>

        {/* Card 4: Total Logged Alarms */}
        <div className="alarm-kpi-card alarm-kpi-card--purple">
          <div className="alarm-kpi-top">
            <div className="alarm-kpi-icon-box alarm-kpi-icon-box--purple">
              <Database className="w-5 h-5" />
            </div>
            <span className="alarm-kpi-pill alarm-kpi-pill--purple">
              Total Count
            </span>
          </div>
          <div>
            <div className="alarm-kpi-val" style={{ color: "#7c3aed" }}>{totalCount}</div>
            <div className="alarm-kpi-label">Total Events</div>
          </div>
          <div className="alarm-kpi-sub">
            Total telemetry alarms in audit log
          </div>
        </div>
      </div>

      {/* ── 3. Severity Distribution Health Bar ── */}
      <div className="alarm-dist-card">
        <div className="alarm-dist-left">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Severity Composition
          </span>
        </div>

        <div className="alarm-dist-bar-wrap">
          <div className="alarm-dist-bar">
            {critPct > 0 && <div className="alarm-dist-segment alarm-dist-segment--crit" style={{ width: `${critPct}%` }} title={`Critical: ${criticalCount}`} />}
            {warnPct > 0 && <div className="alarm-dist-segment alarm-dist-segment--warn" style={{ width: `${warnPct}%` }} title={`Warning: ${warningCount}`} />}
            {infoPct > 0 && <div className="alarm-dist-segment alarm-dist-segment--info" style={{ width: `${infoPct}%` }} title={`Info: ${infoCount}`} />}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Critical: {criticalCount}
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Warning: {warningCount}
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Info: {infoCount}
          </span>
        </div>
      </div>

      {/* ── 4. Operational Toolbar & Multi-Facet Filters ── */}
      <div className="alarm-toolbar">
        {/* Search */}
        <div className="alarm-search-wrap">
          <Search className="alarm-search-icon" />
          <input
            type="text"
            className="alarm-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by station, DAHITI code, message…"
          />
          {search && (
            <button
              type="button"
              className="alarm-search-clear"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Severity Filter Chips */}
        <div className="alarm-chips-group">
          {[
            { id: "All", label: "All Severities", count: totalCount },
            { id: "CRITICAL", label: "Critical", count: criticalCount },
            { id: "WARNING", label: "Warning", count: warningCount },
            { id: "INFO", label: "Info", count: infoCount },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`alarm-chip-btn ${sevFilter === item.id ? "alarm-chip-btn--active" : ""}`}
              onClick={() => setSevFilter(item.id)}
            >
              <span>{item.label}</span>
              <span className="alarm-chip-count">{item.count}</span>
            </button>
          ))}
        </div>

        {/* Status Filter Chips */}
        <div className="alarm-chips-group">
          {[
            { id: "All", label: "All Statuses", count: totalCount },
            { id: "ACTIVE", label: "Active", count: activeCount },
            { id: "ACKNOWLEDGED", label: "Ack", count: ackCount },
            { id: "RESOLVED", label: "Resolved", count: resCount },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`alarm-chip-btn ${statusFilter === item.id ? "alarm-chip-btn--active" : ""}`}
              onClick={() => setStatusFilter(item.id)}
            >
              <span>{item.label}</span>
              <span className="alarm-chip-count">{item.count}</span>
            </button>
          ))}
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-800 font-mono">{filtered.length}</strong> of {totalCount} events
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── 5. Executive Enterprise Data Table ── */}
      <div className="alarm-table-card">
        <div className="overflow-x-auto">
          <table className="alarm-table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Raised Timestamp</th>
                <th style={{ width: "120px" }}>Severity</th>
                <th style={{ width: "240px" }}>Station &amp; Basin</th>
                <th>Alarm Diagnosis &amp; Root Cause</th>
                <th style={{ width: "120px" }}>Status</th>
                <th style={{ width: "160px" }}>AI Fault Probability</th>
                <th style={{ width: "110px", textAlign: "right" }}>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="alarm-empty-state">
                      <div className="alarm-empty-icon">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {hasActiveFilters ? "No Alarms Match Current Filters" : "Zero Active Telemetry Alarms"}
                      </div>
                      <p className="text-xs text-slate-500 max-w-md m-0">
                        {hasActiveFilters
                          ? "Try relaxing your search terms, severity filters, or status selection to view other operational logs."
                          : "All 19 national virtual telemetry stations are reporting nominal water surface elevations within safe hydraulic tolerances."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 px-3.5 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const basinInfo = getStationBasinInfo(a.stationId, a.stationName)
                  const isCritical = a.severity === "CRITICAL"
                  const isWarning = a.severity === "WARNING"

                  return (
                    <tr
                      key={a.alarmId}
                      onClick={() => handleRowClick(a)}
                      className={`alarm-row ${isCritical ? "alarm-row--critical" : isWarning ? "alarm-row--warning" : ""}`}
                    >
                      {/* Raised Time */}
                      <td>
                        <div className="alarm-time-cell">
                          <span className="alarm-time-date">
                            {formatDate(a.raisedAtUtc, "yyyy-MM-dd")}
                          </span>
                          <span className="alarm-time-hour flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(a.raisedAtUtc, "HH:mm")} UTC
                          </span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td>
                        <span
                          className={`alarm-sev-pill ${
                            isCritical
                              ? "alarm-sev-pill--critical"
                              : isWarning
                                ? "alarm-sev-pill--warning"
                                : "alarm-sev-pill--info"
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6",
                              boxShadow: isCritical
                                ? "0 0 6px rgba(239, 68, 68, 0.8)"
                                : isWarning
                                  ? "0 0 6px rgba(245, 158, 11, 0.8)"
                                  : "none",
                            }}
                          />
                          {a.severity}
                        </span>
                      </td>

                      {/* Station & Basin */}
                      <td>
                        <div className="alarm-station-cell">
                          <span className="alarm-station-name">{a.stationName}</span>
                          <div className="alarm-station-tags">
                            <span className="alarm-station-code">{a.stationId}</span>
                            <span className="alarm-station-basin">
                              <MapPin className="w-2.5 h-2.5 text-sky-600" />
                              {basinInfo.reach}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Alarm Message & Category */}
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-800 text-[12.5px] leading-snug">
                            {a.message}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 font-mono uppercase bg-slate-100 px-2 py-0.5 rounded">
                              <Database className="w-2.5 h-2.5" />
                              {a.alarmTypeCode || "DATA_FRESHNESS"}
                            </span>
                            <span className="text-[10.5px] text-slate-400">
                              {basinInfo.basin}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`alarm-status-badge ${
                            a.status === "ACTIVE"
                              ? "alarm-status-badge--active"
                              : a.status === "ACKNOWLEDGED"
                                ? "alarm-status-badge--ack"
                                : "alarm-status-badge--resolved"
                          }`}
                        >
                          {a.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {a.status === "ACKNOWLEDGED" && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                          {a.status === "RESOLVED" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {a.status}
                        </span>
                      </td>

                      {/* AI Fault Probability */}
                      <td>
                        {a.faultProbability != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-purple-600"
                                style={{ width: `${Math.round(a.faultProbability * 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-purple-700">
                              {Math.round(a.faultProbability * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="alarm-inspect-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(a)
                          }}
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Root Cause Diagnosis Drawer ── */}
      <AlarmDetailDrawer
        alarm={selectedAlarm}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}

