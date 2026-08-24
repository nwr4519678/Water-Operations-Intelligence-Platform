// src/pages/AlarmsPage.tsx
import React, { useState, useMemo } from "react"
import { useAlarmsList } from "../hooks/useViewerQueries"
import { AlarmDetailDrawer } from "../components/alarms/AlarmDetailDrawer"
import { formatDate } from "../utils/formatters"
import { AlarmDto } from "../types/api"

export const AlarmsPage: React.FC = () => {
  const [search, setSearch] = useState("")
  const [sevFilter, setSevFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmDto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data } = useAlarmsList({ pageSize: 50 })
  const allAlarms = data?.items || []

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allAlarms.filter((a) => {
      const matchSearch =
        `${a.alarmId} ${a.message} ${a.stationName} ${a.severity}`
          .toLowerCase()
          .includes(q)
      const matchSev = sevFilter === "All" || a.severity === sevFilter
      const matchStatus = statusFilter === "All" || a.status === statusFilter
      return matchSearch && matchSev && matchStatus
    })
  }, [allAlarms, search, sevFilter, statusFilter])

  const handleRowClick = (a: AlarmDto) => {
    setSelectedAlarm(a)
    setDrawerOpen(true)
  }

  return (
    <section className="dashboard">
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {/* Filters Bar */}
        <div className="filter-bar">
          <label className="search" style={{ width: 280 }}>
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by alarm, message, or station..."
            />
          </label>

          <div className="filter-group">
            {["All", "CRITICAL", "WARNING", "INFO"].map((sev) => (
              <button
                key={sev}
                type="button"
                className={`filter-chip ${
                  sevFilter === sev
                    ? sev === "CRITICAL"
                      ? "sev-critical active"
                      : sev === "WARNING"
                        ? "sev-warning active"
                        : "active"
                    : ""
                }`}
                onClick={() => setSevFilter(sev)}
              >
                {sev === "All" ? "All Severities" : sev}
              </button>
            ))}
          </div>

          <div className="filter-group">
            {["All", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-chip ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === "All" ? "All Statuses" : st}
              </button>
            ))}
          </div>

          <span className="filter-count">
            Showing {filtered.length} of {allAlarms.length} events
          </span>
        </div>

        {/* Alarms Table */}
        <div className="table-wrap" style={{ padding: "0 18px 18px" }}>
          <table>
            <thead>
              <tr>
                <th>Raised Time</th>
                <th>Severity</th>
                <th>Station</th>
                <th>Alarm Message</th>
                <th>Status</th>
                <th>AI Fault Probability</th>
                <th style={{ textAlign: "right" }}>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.alarmId}
                  onClick={() => handleRowClick(a)}
                  style={{ cursor: "pointer" }}
                  className="station-row"
                >
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "#64748b",
                    }}
                  >
                    {formatDate(a.raisedAtUtc, "yyyy-MM-dd HH:mm")}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        a.severity === "CRITICAL"
                          ? "offline"
                          : a.severity === "WARNING"
                            ? "warning"
                            : "online"
                      }`}
                      style={{
                        color:
                          a.severity === "CRITICAL"
                            ? "#eb4747"
                            : a.severity === "WARNING"
                              ? "#e6a00a"
                              : "#1677f0",
                        background:
                          a.severity === "CRITICAL"
                            ? "#fee2e2"
                            : a.severity === "WARNING"
                              ? "#fef3c7"
                              : "#e0f2fe",
                      }}
                    >
                      {a.severity}
                    </span>
                  </td>
                  <td>
                    <strong>{a.stationName}</strong>
                    <small style={{ display: "block", color: "#64748b" }}>
                      {a.stationId}
                    </small>
                  </td>
                  <td>{a.message}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#8b5cf6",
                      }}
                    >
                      {a.faultProbability
                        ? `${Math.round(a.faultProbability * 100)}%`
                        : "—"}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "#1677f0",
                      fontWeight: 600,
                    }}
                  >
                    Inspect ↗
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlarmDetailDrawer
        alarm={selectedAlarm}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  )
}
