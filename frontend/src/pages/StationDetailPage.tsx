// src/pages/StationDetailPage.tsx
import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useStationDetail, useStationAlarms } from "../hooks/useViewerQueries"
import { useAiForecast, useAiRiskScore } from "../hooks/useAiQueries"
import { useThresholdsList } from "../hooks/useThresholdsQuery"
import { telemetryApi } from "../api/telemetry"
import { collaborationApi } from "../api/collaboration"
import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../utils/constants"

import { MultiParamChart } from "../components/charts/MultiParamChart"
import { TimeRangeSelector } from "../components/charts/TimeRangeSelector"
import { ChartAnnotationsList } from "../components/station/ChartAnnotationsList"
import { ThreadedNotesList } from "../components/station/ThreadedNotesList"
import { StationAlarmList } from "../components/station/StationAlarmList"
import { useUiStore } from "../store/uiStore"
import { AiForecastPayload, AiRiskScorePayload } from "../types/api"

export const StationDetailPage: React.FC = () => {
  const { stationId = "MST-01" } = useParams<{ stationId: string }>()
  const [timeRange, setTimeRange] = useState("24H")
  const [showForecast, setShowForecast] = useState(true)
  const [activeTab, setActiveTab] =
    useState<"annotations" | "collaboration" | "thresholds" | "alarms">(
      "annotations",
    )

  const mapLanguage = useUiStore((state) => state.mapLanguage)
  const isAr = mapLanguage === "ar"

  const { data: station, isLoading: isStationLoading } =
    useStationDetail(stationId)

  const { data: chartSeries = [] } = useQuery({
    queryKey: [QUERY_KEYS.CHART_MEASUREMENTS, stationId, timeRange],
    queryFn: () =>
      telemetryApi.getChartMeasurements({
        stationId,
        parameterId: [1, 2, 3],
        from: new Date(Date.now() - 24 * 3600000).toISOString(),
        to: new Date().toISOString(),
        limit: 5000,
      }),
  })

  const { data: forecastData } = useAiForecast(stationId)
  const forecastPayload = forecastData?.payload as AiForecastPayload | undefined

  const { data: riskScoreData } = useAiRiskScore(stationId)
  const riskPayload = riskScoreData?.payload as AiRiskScorePayload | undefined

  const { data: annotations = [] } = useQuery({
    queryKey: [QUERY_KEYS.CHART_ANNOTATIONS, stationId],
    queryFn: () => collaborationApi.getAnnotations(stationId),
  })

  const { data: notesData } = useQuery({
    queryKey: [QUERY_KEYS.COLLABORATION_NOTES, stationId],
    queryFn: () => collaborationApi.getCollaborationNotes(stationId),
  })

  const { data: thresholdsData } = useThresholdsList(stationId)
  const { data: alarmsData = [] } = useStationAlarms(stationId)

  if (isStationLoading || !station) {
    return (
      <section className="dashboard">
        <div className="panel" style={{ padding: 30, textAlign: "center" }}>
          Loading station telemetry & AI analytics...
        </div>
      </section>
    )
  }

  const name = isAr
    ? station.nameAr || station.name
    : station.nameEn || station.name
  const zone = isAr
    ? station.zoneAr || station.regionId
    : station.zoneEn || station.regionId

  return (
    <section className="dashboard">
      <div style={{ marginBottom: 12 }}>
        <Link
          to="/map"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#1677f0",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to GIS Telemetry Map
        </Link>
      </div>

      {/* Station Header Panel */}
      <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong
                style={{
                  fontFamily: "monospace",
                  color: "#1677f0",
                  fontSize: 14,
                }}
              >
                {station.stationCode}
              </strong>
              <span
                className={`status-badge ${
                  station.status === "ONLINE" ? "online" : "warning"
                }`}
              >
                {station.status}
              </span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{zone}</span>
            </div>

            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginTop: 4,
                color: "#0f172a",
              }}
            >
              {name}
            </h2>

            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 11,
                color: "#64748b",
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              <span>
                📍 {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
              </span>
              <span>⛰ Elevation: {station.elevationMeters}m ASL</span>
              <span>
                ⌁ Interval: {station.communicationIntervalSeconds || 60}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics" style={{ marginBottom: 14 }}>
        <article className="metric-card blue">
          <span className="metric-icon">◉</span>
          <div>
            <p>Water Level</p>
            <strong>
              {station.staffGaugeHeight || "2.65"}
              <small style={{ fontSize: 12 }}> m</small>
            </strong>
            <small>✓ Within normal limits</small>
          </div>
        </article>

        <article className="metric-card green">
          <span className="metric-icon">◈</span>
          <div>
            <p>Flow Rate</p>
            <strong>
              {station.category === "master" ? "1,200" : "450"}
              <small style={{ fontSize: 12 }}>
                {" "}
                {station.category === "master" ? "m³/s" : "L/s"}
              </small>
            </strong>
            <small>● Operational</small>
          </div>
        </article>

        <article className="metric-card violet">
          <span className="metric-icon">⌁</span>
          <div>
            <p>Line Pressure</p>
            <strong>
              4.2<small style={{ fontSize: 12 }}> bar</small>
            </strong>
            <small>✓ Nominal feed</small>
          </div>
        </article>

        <article className="metric-card amber">
          <span className="metric-icon">▲</span>
          <div>
            <p>AI Risk Score</p>
            <strong>
              {riskPayload?.riskScore || 38}
              <small style={{ fontSize: 12 }}>%</small>
            </strong>
            <small>{riskPayload?.riskCategory || "LOW"} RISK</small>
          </div>
        </article>
      </div>

      {/* Telemetry Chart Panel */}
      <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
        <div className="panel-heading" style={{ marginBottom: 10 }}>
          <div>
            <h2>High-Frequency Dual Y-Axis Telemetry Chart</h2>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              Water Level (m) & Discharge Flow Rate / Pressure (Primary &
              Secondary axes)
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
            <button
              type="button"
              onClick={() => setShowForecast(!showForecast)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid #8b5cf6",
                background: showForecast ? "#8b5cf6" : "#fff",
                color: showForecast ? "#fff" : "#8b5cf6",
                cursor: "pointer",
              }}
            >
              ✧ AI Forecast Band
            </button>
          </div>
        </div>

        <MultiParamChart
          series={chartSeries}
          forecastPayload={forecastPayload}
          showForecast={showForecast}
          height="380px"
        />
      </div>

      {/* Tabs Panel */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="filter-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-chip ${
                activeTab === "annotations" ? "active" : ""
              }`}
              onClick={() => setActiveTab("annotations")}
            >
              Chart Annotations ({annotations.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${
                activeTab === "collaboration" ? "active" : ""
              }`}
              onClick={() => setActiveTab("collaboration")}
            >
              Collaboration Notes ({notesData?.items?.length || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${
                activeTab === "thresholds" ? "active" : ""
              }`}
              onClick={() => setActiveTab("thresholds")}
            >
              Telemetry Thresholds ({thresholdsData?.items?.length || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${
                activeTab === "alarms" ? "active" : ""
              }`}
              onClick={() => setActiveTab("alarms")}
            >
              Station Alarms ({alarmsData.length})
            </button>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {activeTab === "annotations" && (
            <ChartAnnotationsList annotations={annotations} />
          )}

          {activeTab === "collaboration" && (
            <ThreadedNotesList notes={notesData?.items} />
          )}

          {activeTab === "thresholds" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Warning Low</th>
                    <th>Warning High</th>
                    <th>Critical Low</th>
                    <th>Critical High</th>
                    <th style={{ textAlign: "right" }}>Standard Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {thresholdsData?.items?.map((t) => (
                    <tr key={t.thresholdId}>
                      <td>
                        <strong>{t.parameterName}</strong>
                      </td>
                      <td style={{ color: "#e6a00a" }}>
                        {t.warningLow ?? "—"}
                      </td>
                      <td style={{ color: "#e6a00a" }}>
                        {t.warningHigh ?? "—"}
                      </td>
                      <td style={{ color: "#eb4747", fontWeight: 700 }}>
                        {t.criticalLow ?? "—"}
                      </td>
                      <td style={{ color: "#eb4747", fontWeight: 700 }}>
                        {t.criticalHigh ?? "—"}
                      </td>
                      <td style={{ textAlign: "right", color: "#64748b" }}>
                        {t.createdByEmail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "alarms" && <StationAlarmList alarms={alarmsData} />}
        </div>
      </div>
    </section>
  )
}
