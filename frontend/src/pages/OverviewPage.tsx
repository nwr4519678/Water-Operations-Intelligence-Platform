// src/pages/OverviewPage.tsx
import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAlarmsList } from "../hooks/useViewerQueries"
import { MapLibreDeckMap } from "../components/map/MapLibreDeckMap"
import { loadWaterStations, getCachedStations } from "../data/stationLoader"
import { WaterStation, DatasetValidationReport } from "../data/stationTypes"
import { useUiStore } from "../store/uiStore"
import { formatRelative } from "../utils/formatters"

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const mapLanguage = useUiStore((state) => state.mapLanguage)
  const [gisData, setGisData] = useState<{
    stations: WaterStation[]
    report: DatasetValidationReport
  }>(() => getCachedStations())
  const { data: alarmsData } = useAlarmsList({ pageSize: 5 })

  const [alertFilter, setAlertFilter] = useState<"All" | "Critical">("All")

  useEffect(() => {
    loadWaterStations().then((res) => setGisData(res))
  }, [])

  const alarms = alarmsData?.items || []

  const displayedAlarms = alarms.filter((a) =>
    alertFilter === "Critical" ? a.severity === "CRITICAL" : true,
  )

  return (
    <section className="dashboard">
      {/* 6 Key Operational KPI Metric Cards */}
      <div className="metrics">
        <article className="metric-card blue">
          <span className="metric-icon">◉</span>
          <div>
            <p>Active Stations</p>
            <strong>410</strong>
            <small>✓ 100% telemetry online</small>
          </div>
        </article>

        <article className="metric-card green">
          <span className="metric-icon">◈</span>
          <div>
            <p>Avg Water Level</p>
            <strong>
              2.64<small style={{ fontSize: 13, color: "inherit" }}> m</small>
            </strong>
            <small>▲ +0.08 m vs yesterday</small>
          </div>
        </article>

        <article className="metric-card violet">
          <span className="metric-icon">⌁</span>
          <div>
            <p>Total Discharge</p>
            <strong>
              1,840
              <small style={{ fontSize: 13, color: "inherit" }}> m³/s</small>
            </strong>
            <small>▲ Within allocation</small>
          </div>
        </article>

        <article className="metric-card amber">
          <span className="metric-icon">▲</span>
          <div>
            <p>Main Line Pressure</p>
            <strong>
              4.2<small style={{ fontSize: 13, color: "inherit" }}> bar</small>
            </strong>
            <small>● Stable gradient</small>
          </div>
        </article>

        <article className="metric-card teal">
          <span className="metric-icon">◎</span>
          <div>
            <p>Water Quality Index</p>
            <strong>
              94<small style={{ fontSize: 13, color: "inherit" }}>%</small>
            </strong>
            <small>✓ Good / Compliant</small>
          </div>
        </article>

        <article className="metric-card red">
          <span className="metric-icon">△</span>
          <div>
            <p>System Risk Level</p>
            <strong>
              38<small style={{ fontSize: 13, color: "inherit" }}>%</small>
            </strong>
            <small>● Controlled / Low Risk</small>
          </div>
        </article>
      </div>

      {/* Top Grid: Interactive Map (Left) + Alarms & Risk Gauge (Right) */}
      <div className="top-grid">
        <section className="panel map-panel">
          <div className="panel-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>Interactive National Telemetry Map — MarkerCluster</h2>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                410 monitoring nodes across Egypt (HQ, 9 Masters, 400 Field
                RTUs)
              </p>
            </div>
            <button
              onClick={() => navigate("/map")}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#1677f0",
                cursor: "pointer",
                background: "none",
                border: 0,
              }}
            >
              Open Full GIS Map ↗
            </button>
          </div>

          <MapLibreDeckMap
            stations={gisData.stations}
            bounds={gisData.report.bounds}
            onSelectStation={(s: WaterStation) => navigate(`/stations/${s.id}`)}
            language={mapLanguage}
            height="420px"
          />
        </section>

        <div className="side-stack">
          {/* Active Alarms Panel */}
          <section className="panel alarms-panel">
            <div className="panel-heading">
              <h2>
                Active Alarms{" "}
                <span>
                  ({alarms.filter((a) => a.status === "ACTIVE").length})
                </span>
              </h2>
              <button
                onClick={() =>
                  setAlertFilter(alertFilter === "All" ? "Critical" : "All")
                }
                style={{ cursor: "pointer" }}
              >
                {alertFilter === "All" ? "View critical" : "View all"}
              </button>
            </div>
            <div className="alarms-list">
              {displayedAlarms.slice(0, 4).map((a) => (
                <article
                  key={a.alarmId}
                  className={`alarm ${
                    a.severity === "CRITICAL"
                      ? "red"
                      : a.severity === "WARNING"
                        ? "amber"
                        : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/alarms")}
                >
                  <span className="alarm-icon">△</span>
                  <div>
                    <strong>{a.message}</strong>
                    <p>{a.stationName}</p>
                  </div>
                  <div>
                    <time>{formatRelative(a.raisedAtUtc)}</time>
                    <em>{a.severity}</em>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* AI Operational Risk Gauge Panel */}
          <section className="panel risk-panel">
            <div className="panel-heading">
              <h2>AI Operational Risk Analysis</h2>
              <span className="dot good" />
            </div>
            <div className="risk-content">
              <div className="gauge">
                <div>
                  <small>Risk Index</small>
                  <b>38%</b>
                  <strong>LOW RISK</strong>
                </div>
              </div>
              <div className="risk-list">
                <h3>Key Risk Factors (AI Model)</h3>
                <p>
                  <span>▲</span> Surge probability <b>12%</b>
                </p>
                <p>
                  <span>●</span> Pressure stress <b>24%</b>
                </p>
                <p>
                  <span>▲</span> Turbidity drift <b>8%</b>
                </p>
              </div>
            </div>
          </section>
        </div>
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
                  <th>Flow</th>
                  <th>Pressure</th>
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
                      <b>{s.telemetrySnapshot?.waterLevel ?? "2.65"} m</b>
                    </td>
                    <td>
                      {s.telemetrySnapshot?.flowRate
                        ? `${s.telemetrySnapshot.flowRate}`
                        : "450 L/s"}
                    </td>
                    <td>
                      {s.telemetrySnapshot?.pressure
                        ? `${s.telemetrySnapshot.pressure} bar`
                        : "4.2 bar"}
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

        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Lake Nasser Water Level Trend</h2>
            <button onClick={() => navigate("/stations/MST-01")}>
              Details ↗
            </button>
          </div>
          <p className="forecast-label">
            Upstream reservoir elevation telemetry
          </p>
          <div className="chart-labels">
            <span>182m</span>
            <span>178m</span>
            <span>174m</span>
            <span>170m</span>
            <span>166m</span>
          </div>
          <svg className="chart-svg" viewBox="0 0 300 130">
            <polyline
              fill="none"
              stroke="#1677f0"
              strokeWidth="2.5"
              points="0,85 50,78 100,68 150,55 200,42 250,38 300,34"
            />
            <polyline
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeDasharray="4"
              points="200,42 250,35 300,28"
            />
          </svg>
          <div className="chart-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>Now</span>
            <span>+12h</span>
            <span>+24h</span>
          </div>
          <div className="chart-legend">
            <span className="line blue" />
            Actual Level
            <span className="line violet dashed" />
            AI Forecast
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Delta Barrages Discharge Trend</h2>
            <button onClick={() => navigate("/stations/MST-02")}>
              Details ↗
            </button>
          </div>
          <p className="forecast-label">Lower Egypt irrigation distribution</p>
          <div className="chart-labels">
            <span>500</span>
            <span>400</span>
            <span>300</span>
            <span>200</span>
            <span>100</span>
          </div>
          <svg className="chart-svg" viewBox="0 0 300 130">
            <polyline
              fill="none"
              stroke="#11ad68"
              strokeWidth="2.5"
              points="0,60 50,52 100,58 150,48 200,45 250,50 300,46"
            />
          </svg>
          <div className="chart-axis">
            <span>-24h</span>
            <span>-12h</span>
            <span>Now</span>
            <span>+12h</span>
            <span>+24h</span>
          </div>
          <div className="chart-legend">
            <span className="line green" />
            Discharge (m³/s)
          </div>
        </section>
      </div>

      {/* Dashboard Footer */}
      <footer className="dashboard-footer">
        <div className="notification-card">
          <span>i</span>
          <div>
            <strong>National Telemetry Gateway</strong>
            <p>
              Live dual satellite & GSM telemetry active for all 410 monitoring
              nodes across Egypt
            </p>
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
