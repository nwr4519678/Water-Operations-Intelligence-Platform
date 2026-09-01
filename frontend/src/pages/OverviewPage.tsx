// src/pages/OverviewPage.tsx
import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useOperationsOverview } from "../hooks/useViewerQueries"
import { MapLibreDeckMap } from "../components/map/MapLibreDeckMap"
import { loadWaterStations, getCachedStations, loadMonthlyTrend, DahitiMonthlyTrend } from "../data/stationLoader"
import { WaterStation, DatasetValidationReport } from "../data/stationTypes"
import { useUiStore } from "../store/uiStore"

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const mapLanguage = useUiStore((state) => state.mapLanguage)
  const [gisData, setGisData] = useState<{
    stations: WaterStation[]
    report: DatasetValidationReport
  }>(() => getCachedStations())
  const [nasserTrend, setNasserTrend] = useState<DahitiMonthlyTrend[]>([])
  const { data: overviewData } = useOperationsOverview()

  useEffect(() => {
    loadWaterStations().then((res) => setGisData(res))
    loadMonthlyTrend(210).then(setNasserTrend).catch(() => setNasserTrend([]))
  }, [])

  return (
    <section className="dashboard">
      {/* Live operational KPI cards */}
      <div className="metrics overview-metrics">
        <article className="metric-card blue">
          <span className="metric-icon">◉</span>
          <div>
            <p>Active Stations</p>
            <strong>{overviewData?.totalStations ?? (gisData.stations.length || "—")}</strong>
            <small>✓ {overviewData?.onlineStations ?? gisData.report.onlineCount} online</small>
          </div>
        </article>

        <article className="metric-card green">
          <span className="metric-icon">◈</span>
          <div>
            <p>Avg Water Level</p>
            <strong>
              —<small style={{ fontSize: 13, color: "inherit" }}> m</small>
            </strong>
            <small>Live value unavailable</small>
          </div>
        </article>

        <article className="metric-card red">
          <span className="metric-icon">△</span>
          <div>
            <p>System Risk Level</p>
            <strong>
              —<small style={{ fontSize: 13, color: "inherit" }}>%</small>
            </strong>
            <small>Live value unavailable</small>
          </div>
        </article>
      </div>

      {/* Primary workspace: keep the map full-width and visually dominant. */}
      <div className="top-grid">
        <section className="panel map-panel">
          <div className="panel-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>Interactive National Telemetry Map — MarkerCluster</h2>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {gisData.stations.length} DaHITI monitoring targets loaded from
                the backend database
              </p>
            </div>
            <button type="button" onClick={() => navigate("/map")}>Open Full GIS Map ↗</button>
          </div>

          <MapLibreDeckMap
            stations={gisData.stations}
            bounds={gisData.report.bounds}
            onSelectStation={(s: WaterStation) => navigate(`/stations/${s.id}`)}
            language={mapLanguage}
            height="420px"
          />
        </section>

      </div>

      {/* Lower Grid: Recent Strategic Readings & Forecast Previews */}
      <div className="lower-grid">
        <section className="panel measurements">
          <div className="panel-heading">
            <h2>Key Telemetry Nodes (Real-Time)</h2>
            <button onClick={() => navigate("/map")}>View all ↗</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gisData.stations.slice(0, 5).map((s) => (
                  <tr
                    key={s.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/stations/${s.id}`)}
                  >
                    <td>
                      <strong>{s.name}</strong>
                      <small style={{ display: "block", color: "#64748b" }}>
                        {s.code}
                      </small>
                    </td>
                    <td>
                      <b>{s.telemetrySnapshot?.waterLevel ?? "—"} m</b>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          s.connectionState === "online" ? "online" : "warning"
                        }`}
                      >
                        {s.connectionState.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel chart-panel monthly-trend-card">
          <div className="panel-heading">
            <h2>Lake Nasser Water Level Trend</h2>
            <button onClick={() => navigate("/stations/MST-01")}>
              Details ↗
            </button>
          </div>
          <p className="forecast-label">Monthly average water level · Nasser Lake (DaHITI-210)</p>
          {nasserTrend.length ? (
            <div className="monthly-bars" aria-label="Monthly Nasser Lake water level trend">
              {nasserTrend.map((point) => (
                <div className="monthly-bar" key={point.month} title={`${point.averageLevel.toFixed(2)} m · ${point.observationCount} observations`}>
                  <span style={{ height: `${Math.max(8, Math.min(100, ((point.averageLevel - 160) / 25) * 100))}%` }} />
                  <small>{new Date(point.month).toLocaleDateString("en", { month: "short" })}</small>
                </div>
              ))}
            </div>
          ) : <p className="empty-state">No monthly observations available.</p>}
          {nasserTrend.length > 0 && (() => {
            const latest = nasserTrend[nasserTrend.length - 1]
            const observations = nasserTrend.reduce((total, point) => total + point.observationCount, 0)
            return (
              <div className="trend-summary">
                <div><small>Latest month</small><strong>{latest.averageLevel.toFixed(2)} m</strong></div>
                <div><small>Monthly range</small><strong>{latest.minimumLevel.toFixed(2)}–{latest.maximumLevel.toFixed(2)} m</strong></div>
                <div><small>Observations</small><strong>{observations.toLocaleString()}</strong></div>
              </div>
            )
          })()}
          <div className="chart-legend"><span className="line blue" />Monthly average level (m)</div>
        </section>

        <section className="panel risk-panel">
          <div className="panel-heading">
            <h2>AI Operational Risk Analysis</h2>
            <span className="dot good" />
          </div>
          <div className="risk-content">
            <div className="gauge">
              <div>
                <small>Risk Index</small>
                <b>—</b>
                <strong>NO AI RESULT</strong>
              </div>
            </div>
            <div className="risk-list">
              <h3>Key Risk Factors (AI Model)</h3>
              <p><span>▲</span> Surge probability <b>—</b></p>
              <p><span>●</span> Pressure stress <b>—</b></p>
              <p><span>▲</span> Turbidity drift <b>—</b></p>
            </div>
          </div>
        </section>

      </div>

      {/* Dashboard Footer */}
      <footer className="dashboard-footer">
        <div className="notification-card">
          <span>i</span>
          <div>
            <strong>National Telemetry Gateway</strong>
            <p>Live values are supplied by the backend database.</p>
          </div>
          <time>Real-time</time>
          <div className="live">
            <i className="dot good" />
            Last sync: Live
          </div>
          <b>⌁ Operational</b>
        </div>

        <div className="weather">
          <span>⛅</span>
          <div>
            <strong>28°C</strong>
            <p>Clear skies</p>
          </div>
          <small>
            Greater Cairo, Egypt
            <br />
            Humidity: 42%
            <br />
            Wind: 14 km/h
          </small>
        </div>
      </footer>
    </section>
  )
}
