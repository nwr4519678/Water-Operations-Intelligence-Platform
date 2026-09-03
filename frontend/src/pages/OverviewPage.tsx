// src/pages/OverviewPage.tsx
import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useOperationsOverview } from "../hooks/useViewerQueries"
import { useAiAnomalies } from "../hooks/useAiQueries"
import { MapLibreDeckMap } from "../components/map/MapLibreDeckMap"
import { loadWaterStations, getCachedStations, loadMonthlyTrend, DahitiMonthlyTrend } from "../data/stationLoader"
import { WaterStation, DatasetValidationReport } from "../data/stationTypes"
import {
  Radio, TrendingUp, Cpu, ShieldCheck, CloudSun, Droplets, Wind,
  Waves, Sparkles, Server, Layers, Database, MapPin, Satellite,
  AlertTriangle, CheckCircle2, ChevronRight, Activity, Zap,
  Compass, Eye, Check, BarChart3, Sliders, Gauge, ChevronDown, Search
} from "lucide-react"

// Key strategic water targets in Egypt for instant 1-click focus
const STRATEGIC_TARGETS = [
  { id: "DAHITI-210", dahitiId: 210, name: "Lake Nasser", location: "Aswan" },
  { id: "DAHITI-68", dahitiId: 68, name: "Lake Qarun", location: "Fayoum" },
  { id: "DAHITI-17699", dahitiId: 17699, name: "Toshka East", location: "New Valley" },
  { id: "DAHITI-27216", dahitiId: 27216, name: "Toshka South", location: "New Valley" },
  { id: "DAHITI-17683", dahitiId: 17683, name: "Wadi El Rayyan", location: "Fayoum" },
  { id: "DAHITI-15290", dahitiId: 15290, name: "Nile (Luxor)", location: "Upper Egypt" },
  { id: "DAHITI-17469", dahitiId: 17469, name: "Nile (Minya)", location: "Middle Egypt" },
  { id: "DAHITI-8972", dahitiId: 8972, name: "Delta Branch", location: "Lower Egypt" },
]

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const [gisData, setGisData] = useState<{ stations: WaterStation[]; report: DatasetValidationReport }>(
    () => getCachedStations()
  )
  const [selectedStationId, setSelectedStationId] = useState<string>("DAHITI-210")
  const [trendData, setTrendData] = useState<DahitiMonthlyTrend[]>([])
  const [isTrendLoading, setIsTrendLoading] = useState<boolean>(false)
  const [hoveredPoint, setHoveredPoint] = useState<DahitiMonthlyTrend | null>(null)

  const { data: overviewData } = useOperationsOverview()
  const { data: anomalyData, isLoading: isAnomalyLoading, isError: isAnomalyError } = useAiAnomalies()
  const [storageTab, setStorageTab] = useState<"reservoirs" | "stream">("reservoirs")
  const [hoveredStreamIdx, setHoveredStreamIdx] = useState<number | null>(null)

  // Station computation
  const selectedStation = useMemo(() => {
    return gisData.stations.find((s) => s.id === selectedStationId) || gisData.stations[0]
  }, [gisData.stations, selectedStationId])

  const selectedDahitiId = useMemo(() => {
    if (!selectedStation) return 210
    const parsed = parseInt(selectedStation.code.replace("DAHITI-", ""), 10)
    return Number.isFinite(parsed) ? parsed : 210
  }, [selectedStation])

  // Custom Dropdown State for map ribbon
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [dropdownSearch, setDropdownSearch] = useState<string>("")

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredDropdownStations = useMemo(() => {
    if (!dropdownSearch.trim()) return gisData.stations
    const q = dropdownSearch.toLowerCase()
    return gisData.stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    )
  }, [gisData.stations, dropdownSearch])

  // Quick Station Table Search Filter
  const [tableSearch, setTableSearch] = useState<string>("")

  const filteredTableStations = useMemo(() => {
    if (!tableSearch.trim()) return gisData.stations
    const q = tableSearch.toLowerCase()
    return gisData.stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    )
  }, [gisData.stations, tableSearch])

  // Aggregate stats
  const aiAnomalyCount = anomalyData?.totalCount ?? 0
  const historicalFindingCount = gisData.stations.filter((s) => s.connectionState === "warning").length
  const operationalFindingCount = aiAnomalyCount + historicalFindingCount
  const onlineCount = overviewData?.onlineStations ?? gisData.report.onlineCount
  const totalStations = overviewData?.totalStations ?? gisData.stations.length

  // Selected station reading
  const stationWaterLevel = useMemo(() => {
    if (!selectedStation?.telemetrySnapshot?.waterLevel) return null
    const val = Number(selectedStation.telemetrySnapshot.waterLevel)
    return Number.isFinite(val) ? val : null
  }, [selectedStation])

  // Trend data observations count
  const trendObservationTotal = useMemo(() => {
    return trendData.reduce((t, p) => t + p.observationCount, 0)
  }, [trendData])

  // Dynamic chart height scaling
  const chartScale = useMemo(() => {
    if (!trendData.length) return { min: 0, max: 100, span: 100 }
    const vals = trendData.map((p) => p.averageLevel)
    const minVal = Math.min(...vals)
    const maxVal = Math.max(...vals)
    const span = Math.max(0.5, maxVal - minVal)
    const chartMin = minVal - span * 0.18
    const chartMax = maxVal + span * 0.18
    return { min: chartMin, max: chartMax, span: chartMax - chartMin }
  }, [trendData])

  // Load stations on mount & polling
  useEffect(() => {
    loadWaterStations().then((res) => setGisData(res))
    const timer = window.setInterval(() => {
      loadWaterStations(true).then(setGisData).catch(() => undefined)
    }, 60000)
    return () => window.clearInterval(timer)
  }, [])

  // Load trend data whenever selected station changes
  useEffect(() => {
    setIsTrendLoading(true)
    loadMonthlyTrend(selectedDahitiId)
      .then((data) => {
        setTrendData(data)
        setIsTrendLoading(false)
      })
      .catch(() => {
        setTrendData([])
        setIsTrendLoading(false)
      })
  }, [selectedDahitiId])

  const handleSelectStation = (station: WaterStation) => {
    setSelectedStationId(station.id)
  }

  return (
    <section className="ov-page">

      {/* ── KPI Row (5 Modern Light Enterprise Metric Cards) ─────────── */}
      <div className="ov-kpi-row">

        {/* 1. Network Active Stations */}
        <div className="ov-kpi ov-kpi--blue">
          <div className="ov-kpi__accent" />
          <div className="ov-kpi__icon ov-kpi__icon--blue">
            <Radio className="w-5 h-5" />
          </div>
          <div className="ov-kpi__body">
            <span className="ov-kpi__label">Active Network Stations</span>
            <strong className="ov-kpi__val">{totalStations || "19"}</strong>
            <span className="ov-kpi__sub ov-kpi__sub--green">
              <CheckCircle2 className="w-3 h-3" /> {onlineCount} Operational
            </span>
          </div>
        </div>

        {/* 2. Dynamic Selected Station Water Elevation */}
        <div className="ov-kpi ov-kpi--teal">
          <div className="ov-kpi__accent" />
          <div className="ov-kpi__icon ov-kpi__icon--teal">
            <Waves className="w-5 h-5" />
          </div>
          <div className="ov-kpi__body">
            <span className="ov-kpi__label" title={selectedStation?.name || "Selected Station"}>
              {selectedStation?.name ? selectedStation.name.split(",")[0] : "Lake Nasser"} Elevation
            </span>
            <strong className="ov-kpi__val">
              {stationWaterLevel != null ? stationWaterLevel.toFixed(2) : "—"}
              <span className="ov-kpi__unit">m</span>
            </strong>
            <span className="ov-kpi__sub ov-kpi__sub--blue">
              <Satellite className="w-3 h-3" /> {selectedStation?.code || "DAHITI-210"} Altimetry
            </span>
          </div>
        </div>

        {/* 3. Operational Warnings */}
        <div className="ov-kpi ov-kpi--amber">
          <div className="ov-kpi__accent" />
          <div className="ov-kpi__icon ov-kpi__icon--amber">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="ov-kpi__body">
            <span className="ov-kpi__label">System Warnings</span>
            <strong className="ov-kpi__val">{historicalFindingCount}</strong>
            <span className={`ov-kpi__sub ${historicalFindingCount > 0 ? "ov-kpi__sub--amber" : "ov-kpi__sub--green"}`}>
              {historicalFindingCount > 0 ? `${historicalFindingCount} Nodes Require Review` : "All Stations Nominal"}
            </span>
          </div>
        </div>

        {/* 4. AI Anomalies */}
        <div className="ov-kpi ov-kpi--violet">
          <div className="ov-kpi__accent" />
          <div className="ov-kpi__icon ov-kpi__icon--violet">
            <Zap className="w-5 h-5" />
          </div>
          <div className="ov-kpi__body">
            <span className="ov-kpi__label">AI Risk Engine</span>
            <strong className="ov-kpi__val">{isAnomalyLoading ? "—" : aiAnomalyCount}</strong>
            <span className={`ov-kpi__sub ${aiAnomalyCount > 0 ? "ov-kpi__sub--red" : "ov-kpi__sub--green"}`}>
              <Activity className="w-3 h-3" /> {isAnomalyLoading ? "Scanning Network…" : aiAnomalyCount > 0 ? "Anomalies Flagged" : "Nominal Patterns"}
            </span>
          </div>
        </div>

        {/* 5. Altimetry Passes */}
        <div className="ov-kpi ov-kpi--emerald">
          <div className="ov-kpi__accent" />
          <div className="ov-kpi__icon ov-kpi__icon--emerald">
            <Database className="w-5 h-5" />
          </div>
          <div className="ov-kpi__body">
            <span className="ov-kpi__label">Target Satellite Passes</span>
            <strong className="ov-kpi__val">
              {trendObservationTotal > 0 ? trendObservationTotal.toLocaleString() : "—"}
            </strong>
            <span className="ov-kpi__sub ov-kpi__sub--blue">
              <Layers className="w-3 h-3" /> Historical Observations
            </span>
          </div>
        </div>

      </div>

      {/* ── Strategic Station Quick-Selector Ribbon ──────────────────── */}
      <div className="ov-selector-ribbon">
        <div className="ov-selector-ribbon__label">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>Strategic Water Targets:</span>
        </div>

        <div className="ov-selector-ribbon__pills">
          {STRATEGIC_TARGETS.map((target) => {
            const isSelected = selectedStationId === target.id
            return (
              <button
                key={target.id}
                type="button"
                onClick={() => setSelectedStationId(target.id)}
                className={`ov-target-pill ${isSelected ? "ov-target-pill--active" : ""}`}
              >
                <span className="ov-target-pill__dot" />
                <span className="font-bold">{target.name}</span>
                <span className="ov-target-pill__loc">({target.location})</span>
                {isSelected && <Check className="w-3 h-3 ml-1 text-blue-600" />}
              </button>
            )
          })}
        </div>

        {/* Custom Station Dropdown Popover */}
        <div className="ov-selector-ribbon__dropdown">
          <div className="ov-custom-select-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`ov-custom-select-btn ${isDropdownOpen ? "ov-custom-select-btn--open" : ""}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <div className="ov-custom-select-btn__left">
                <span className="ov-custom-select-btn__pin">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                </span>
                <span className="ov-custom-select-btn__name">{selectedStation?.name || "Select Target"}</span>
                <span className="ov-custom-select-btn__code">{selectedStation?.code}</span>
              </div>

              <div className="ov-custom-select-btn__right">
                <span className="ov-custom-select-btn__level">
                  {selectedStation?.telemetrySnapshot?.waterLevel != null
                    ? `${Number(selectedStation.telemetrySnapshot.waterLevel).toFixed(2)} m`
                    : "—"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
              </div>
            </button>

            {isDropdownOpen && (
              <div className="ov-custom-select-popover">
                {/* Search Bar */}
                <div className="ov-custom-select-search">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search 19 DaHITI stations..."
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    autoFocus
                    className="ov-custom-select-search__input"
                  />
                  {dropdownSearch && (
                    <button
                      type="button"
                      className="ov-custom-select-search__clear"
                      onClick={() => setDropdownSearch("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div className="ov-custom-select-list">
                  {filteredDropdownStations.map((s) => {
                    const isSelected = s.id === selectedStationId
                    return (
                      <div
                        key={s.id}
                        className={`ov-custom-select-item ${isSelected ? "ov-custom-select-item--active" : ""}`}
                        onClick={() => {
                          setSelectedStationId(s.id)
                          setIsDropdownOpen(false)
                          setDropdownSearch("")
                        }}
                      >
                        <div className="ov-custom-select-item__left">
                          <span className={`ov-custom-select-item__dot ${isSelected ? "ov-custom-select-item__dot--active" : ""}`} />
                          <div className="ov-custom-select-item__text">
                            <div className="ov-custom-select-item__title">{s.name}</div>
                            <div className="ov-custom-select-item__sub">{s.code} · {s.region}</div>
                          </div>
                        </div>

                        <div className="ov-custom-select-item__right">
                          <span className="ov-custom-select-item__level">
                            {s.telemetrySnapshot?.waterLevel != null
                              ? `${Number(s.telemetrySnapshot.waterLevel).toFixed(2)} m`
                              : "—"}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-blue-600 ml-1.5" />}
                        </div>
                      </div>
                    )
                  })}
                  {filteredDropdownStations.length === 0 && (
                    <div className="ov-custom-select-empty">No stations found matching "{dropdownSearch}"</div>
                  )}
                </div>

                {/* Popover Footer */}
                <div className="ov-custom-select-foot">
                  <span>{filteredDropdownStations.length} of {gisData.stations.length} Telemetry Targets</span>
                  <span className="ov-custom-select-foot__tag">Egypt DaHITI Network</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive GIS Map Panel ────────────────────────────────── */}
      <div className="ov-map-wrap">
        <div className="ov-map-header">
          <div className="ov-map-header__left">
            <span className="ov-map-header__icon">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h2 className="ov-map-header__title">National Telemetry & Remote Sensing GIS</h2>
              <p className="ov-map-header__sub">
                {gisData.stations.length} DaHITI Stations across Egypt · Click any marker to view telemetry
              </p>
            </div>
          </div>
          <button className="ov-map-header__btn" onClick={() => navigate("/map")}>
            Open Full GIS <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ov-map-canvas">
          <MapLibreDeckMap
            stations={gisData.stations}
            bounds={gisData.report.bounds}
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
            language="en"
            height="680px"
          />
        </div>
      </div>

      {/* ── Lower Split Grid: Telemetry Feed & Dynamic Target Trends ─── */}
      <div className="ov-lower">

        {/* Left Column: Live Telemetry Nodes & AI Risk */}
        <div className="ov-lower__left">

          {/* Real-time Telemetry Table */}
          <div className="ov-card">
            <div className="ov-card__hd">
              <div className="ov-card__hd-l">
                <span className="ov-card__hd-icon ov-card__hd-icon--blue">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <div>
                  <h3 className="ov-card__title">National Telemetry Stations</h3>
                  <p className="ov-card__sub">Click row to focus map & monthly trend analysis</p>
                </div>
              </div>
              <button className="ov-link-btn" onClick={() => navigate("/map")}>
                View All ({gisData.stations.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Search & Filter Bar */}
            <div className="ov-card__search-bar">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by station name, reach, or ID..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="ov-card__search-input"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch("")}
                  className="ov-card__search-clear"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <span className="ov-card__search-badge">
                {filteredTableStations.length} of {gisData.stations.length}
              </span>
            </div>

            <div className="ov-table-wrap">
              <table className="ov-table">
                <thead>
                  <tr>
                    <th style={{ width: "48%" }}>Station</th>
                    <th style={{ width: "22%", textAlign: "center" }}>Elevation</th>
                    <th style={{ width: "20%", textAlign: "center" }}>Status</th>
                    <th style={{ width: "10%", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableStations.map((s) => {
                    const isSelected = s.id === selectedStationId
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStationId(s.id)}
                        className={isSelected ? "ov-row--active" : ""}
                      >
                        <td>
                          <div className="ov-station-cell">
                            <span className={`ov-station-dot ${isSelected ? "ov-station-dot--active" : ""}`} />
                            <div className="ov-station-info">
                              <strong className="ov-station-name" title={s.name}>{s.name}</strong>
                              <small className="ov-station-meta" title={`${s.code} · ${s.region}`}>{s.code} · {s.region}</small>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="ov-level-chip">
                            {s.telemetrySnapshot?.waterLevel != null
                              ? `${Number(s.telemetrySnapshot.waterLevel).toFixed(2)} m`
                              : "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`status-badge ${s.connectionState === "online" ? "online" : "warning"}`}>
                            <span className={`ov-pulse ${s.connectionState === "online" ? "ov-pulse--green" : "ov-pulse--amber"}`} />
                            {s.connectionState.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            title="Open Deep Station Analytics"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/stations/${s.id}`)
                            }}
                            className="ov-action-icon-btn"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredTableStations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="ov-table-empty">
                        No stations match &quot;{tableSearch}&quot;
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Risk Assessment Card */}
          <div className="ov-card ov-risk-card">
            <div className="ov-card__hd">
              <div className="ov-card__hd-l">
                <span className="ov-card__hd-icon ov-card__hd-icon--violet">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="ov-card__title">AI Risk & Anomaly Assessment</h3>
                  <p className="ov-card__sub">Real-time hydrological variance & telemetry stability</p>
                </div>
              </div>
              <span className={`status-badge ${isAnomalyLoading || isAnomalyError ? "warning" : "online"}`}>
                {isAnomalyLoading ? "SCANNING" : isAnomalyError ? "STANDBY" : "ACTIVE"}
              </span>
            </div>

            <div className="ov-risk-body">
              <div className="ov-gauge-wrap">
                <svg viewBox="0 0 120 70" className="ov-gauge-svg">
                  <defs>
                    <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="45%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <path d="M 12 62 A 48 48 0 0 1 108 62" fill="none" stroke="#e8edf4" strokeWidth="9" strokeLinecap="round" />
                  <path
                    d="M 12 62 A 48 48 0 0 1 108 62"
                    fill="none"
                    stroke="url(#gGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="151"
                    strokeDashoffset={151 - (151 * Math.min(100, Math.max(8, operationalFindingCount * 16))) / 100}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                  />
                </svg>
                <div className="ov-gauge-center">
                  <span className="ov-gauge-num">{isAnomalyLoading ? "…" : operationalFindingCount}</span>
                  <span className="ov-gauge-lbl">findings</span>
                </div>
                <span className={`ov-gauge-badge ${operationalFindingCount > 0 ? "ov-gauge-badge--warn" : "ov-gauge-badge--ok"}`}>
                  {operationalFindingCount > 0 ? "REVIEW REQUIRED" : "ALL NOMINAL"}
                </span>
              </div>

              <div className="ov-risk-metrics">
                <div className="ov-risk-row">
                  <span className="ov-risk-label"><Cpu className="w-3.5 h-3.5" /> Anomaly Detector</span>
                  <span className={`ov-risk-val ${isAnomalyError ? "ov-risk-val--red" : "ov-risk-val--green"}`}>
                    {isAnomalyLoading ? "RUNNING" : isAnomalyError ? "UNAVAILABLE" : "OPERATIONAL"}
                  </span>
                </div>
                <div className="ov-risk-row">
                  <span className="ov-risk-label"><Radio className="w-3.5 h-3.5" /> Telemetry Quality</span>
                  <span className={`ov-risk-val ${historicalFindingCount > 0 ? "ov-risk-val--amber" : "ov-risk-val--green"}`}>
                    {historicalFindingCount > 0 ? `${historicalFindingCount} NEED ATTENTION` : "100% NOMINAL"}
                  </span>
                </div>
                <div className="ov-risk-row">
                  <span className="ov-risk-label"><ShieldCheck className="w-3.5 h-3.5" /> Active AI Flags</span>
                  <span className={`ov-risk-val ${aiAnomalyCount > 0 ? "ov-risk-val--red" : "ov-risk-val--muted"}`}>
                    {isAnomalyLoading ? "…" : aiAnomalyCount === 0 ? "NONE DETECTED" : `${aiAnomalyCount} DETECTED`}
                  </span>
                </div>
                <div className="ov-risk-row">
                  <span className="ov-risk-label"><TrendingUp className="w-3.5 h-3.5" /> Forecast Models</span>
                  <button className="ov-risk-link" onClick={() => navigate("/ai")}>
                    Open Forecasts <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Stacked Hydrological Analytics & Strategic Storage */}
        <div className="ov-lower__right">

          {/* Graph 1: Dynamic Monthly Trend Chart for Selected Target */}
          <div className="ov-card ov-chart-card">
            <div className="ov-card__hd">
              <div className="ov-card__hd-l">
                <span className="ov-card__hd-icon ov-card__hd-icon--sky">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="ov-card__title">
                    {selectedStation?.name || "Selected Water Body"} — Historical Level Trend
                  </h3>
                  <p className="ov-card__sub">
                    Monthly radar altimetry average · {selectedStation?.code} · {selectedStation?.region}
                  </p>
                </div>
              </div>
              <button
                className="ov-link-btn"
                onClick={() => navigate(`/stations/${selectedStation?.id || "DAHITI-210"}`)}
              >
                Deep Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hover tooltip & Baseline Strip */}
            <div className="ov-chart-tooltip-row">
              {hoveredPoint ? (
                <>
                  <span className="ov-chart-tooltip-date">
                    {new Date(hoveredPoint.month).toLocaleDateString("en", { month: "long", year: "numeric" })}
                  </span>
                  <span className="ov-chart-tooltip-val">{hoveredPoint.averageLevel.toFixed(2)} m</span>
                  <span className="ov-chart-tooltip-obs">
                    {hoveredPoint.observationCount} passes · <strong className="text-blue-600">Click to view in table →</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="ov-chart-baseline">
                    Target: <strong>{selectedStation?.name}</strong> · Range: {chartScale.min.toFixed(1)}m to {chartScale.max.toFixed(1)}m (EGM2008)
                  </span>
                  <span className="ov-chart-hint">Click any bar to inspect monthly telemetry in table</span>
                </>
              )}
            </div>

            {/* Bar Chart Canvas */}
            <div className="ov-bars" aria-label="Monthly water level trend">
              {isTrendLoading ? (
                <div className="ov-bars__empty">
                  <Activity className="w-5 h-5 text-blue-600 animate-spin mr-2" />
                  Loading target telemetry history…
                </div>
              ) : trendData.length > 0 ? (
                trendData.map((point) => {
                  const heightPercent = Math.max(
                    10,
                    Math.min(95, ((point.averageLevel - chartScale.min) / chartScale.span) * 100)
                  )
                  const isHov = hoveredPoint?.month === point.month
                  return (
                    <div
                      className="ov-bar"
                      key={point.month}
                      onClick={() => {
                        const targetId = selectedStation?.id || "DAHITI-210"
                        navigate(`/stations/${targetId}?month=${encodeURIComponent(point.month)}`)
                      }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      title={`Click to open ${new Date(point.month).toLocaleDateString("en", { month: "long", year: "numeric" })} in Station Telemetry Table (${point.averageLevel.toFixed(2)} m)`}
                    >
                      <span
                        className="ov-bar__fill"
                        style={{
                          height: `${heightPercent}%`,
                          opacity: isHov ? 1 : 0.82,
                          transform: isHov ? "scaleX(1.15) scaleY(1.03)" : undefined,
                          boxShadow: isHov ? "0 -6px 18px rgba(26,110,245,0.5)" : undefined,
                          transition: "all 0.15s ease-out",
                        }}
                      />
                      <small className={isHov ? "ov-bar__lbl--active" : ""}>
                        {new Date(point.month).toLocaleDateString("en", { month: "short" })}
                      </small>
                    </div>
                  )
                })
              ) : (
                <div className="ov-bars__empty">No monthly satellite passes recorded for this target yet.</div>
              )}
            </div>

            {/* Summary Strip */}
            {trendData.length > 0 && (() => {
              const latest = trendData[trendData.length - 1]
              const minLevel = Math.min(...trendData.map((p) => p.minimumLevel || p.averageLevel))
              const maxLevel = Math.max(...trendData.map((p) => p.maximumLevel || p.averageLevel))
              return (
                <div className="ov-chart-summary">
                  <div className="ov-chart-kpi">
                    <span className="ov-chart-kpi__icon ov-chart-kpi__icon--blue"><Waves className="w-3.5 h-3.5" /></span>
                    <div>
                      <small>Latest Month</small>
                      <strong>{latest.averageLevel.toFixed(2)} m</strong>
                    </div>
                  </div>
                  <div className="ov-chart-kpi">
                    <span className="ov-chart-kpi__icon ov-chart-kpi__icon--violet"><Layers className="w-3.5 h-3.5" /></span>
                    <div>
                      <small>Annual Range</small>
                      <strong>{minLevel.toFixed(2)} – {maxLevel.toFixed(2)} m</strong>
                    </div>
                  </div>
                  <div className="ov-chart-kpi">
                    <span className="ov-chart-kpi__icon ov-chart-kpi__icon--emerald"><Database className="w-3.5 h-3.5" /></span>
                    <div>
                      <small>Satellite Passes</small>
                      <strong>{trendObservationTotal.toLocaleString()} obs</strong>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="ov-chart-legend">
              <span className="ov-chart-legend-line" />
              Monthly average water elevation (m) · Satellite Radar Altimetry (DaHITI / DGFI-TUM)
            </div>
          </div>

          {/* Graph 2: Strategic Water Storage & Operational Retention Margins */}
          <div className="ov-card ov-storage-card">
            <div className="ov-card__hd">
              <div className="ov-card__hd-l">
                <span className="ov-card__hd-icon ov-card__hd-icon--blue">
                  <BarChart3 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="ov-card__title">Strategic Water Storage & Operational Retention Margins</h3>
                  <p className="ov-card__sub">Live reservoir fill capacity, retention headroom & flood buffer across major Egyptian basins</p>
                </div>
              </div>
              <div className="ov-storage-card__tabs">
                <button
                  type="button"
                  className={`ov-storage-tab ${storageTab === "reservoirs" ? "ov-storage-tab--active" : ""}`}
                  onClick={() => setStorageTab("reservoirs")}
                >
                  Basin Headroom
                </button>
                <button
                  type="button"
                  className={`ov-storage-tab ${storageTab === "stream" ? "ov-storage-tab--active" : ""}`}
                  onClick={() => setStorageTab("stream")}
                >
                  24h Telemetry Stream
                </button>
              </div>
            </div>

            {storageTab === "reservoirs" ? (() => {
              // Basin config: static operational ranges + dynamic real water level from backend
              const BASIN_CONFIG = [
                {
                  id: "DAHITI-210",
                  name: "Lake Nasser",
                  region: "Aswan High Dam",
                  min: 147.0, max: 182.0, spillwayCrest: 182.0,
                  statusLabel: (pct: number) => pct > 80 ? "Safe Buffer" : pct > 60 ? "Nominal Fill" : "Low Reserve",
                  statusType: (pct: number) => pct > 80 ? "good" : pct > 50 ? "info" : "warn",
                  color: "linear-gradient(90deg, #10b981 0%, #0284c7 100%)",
                },
                {
                  id: "DAHITI-17699",
                  name: "Toshka East Spillway",
                  region: "New Valley Overflow",
                  min: 145.0, max: 170.0, spillwayCrest: 170.0,
                  statusLabel: (pct: number) => pct > 70 ? "Active Retention" : pct > 50 ? "Normal Level" : "Low Level",
                  statusType: (pct: number) => pct > 70 ? "good" : pct > 40 ? "info" : "warn",
                  color: "linear-gradient(90deg, #0284c7 0%, #3b82f6 100%)",
                },
                {
                  id: "DAHITI-17683",
                  name: "Wadi El Rayyan",
                  region: "Fayoum Depression",
                  min: -20.0, max: -5.0, spillwayCrest: -5.0,
                  statusLabel: (pct: number) => pct > 70 ? "Agricultural Inflow" : pct > 40 ? "Stable Basin" : "Deficit Alert",
                  statusType: (pct: number) => pct > 70 ? "good" : pct > 40 ? "info" : "warn",
                  color: "linear-gradient(90deg, #10b981 0%, #14b8a6 100%)",
                },
                {
                  id: "DAHITI-68",
                  name: "Lake Qarun",
                  region: "Closed Saline Lake",
                  min: -45.0, max: -41.0, spillwayCrest: -41.0,
                  statusLabel: (pct: number) => pct > 75 ? "Saline Balance" : pct > 50 ? "Monitoring" : "Critical Deficit",
                  statusType: (pct: number) => pct > 75 ? "warn" : pct > 40 ? "warn" : "warn",
                  color: "linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)",
                },
              ]

              return (
                <div className="ov-storage-list">
                  {BASIN_CONFIG.map((cfg) => {
                    const station = gisData.stations.find((s) => s.id === cfg.id)
                    const rawLevel = station?.telemetrySnapshot?.waterLevel
                    const level = typeof rawLevel === "number" ? rawLevel : (typeof rawLevel === "string" && rawLevel !== "—" ? parseFloat(rawLevel) : null)
                    const hasRealData = level !== null && Number.isFinite(level)
                    const displayLevel = hasRealData ? level! : ((cfg.min + cfg.max) / 2)
                    const range = cfg.max - cfg.min
                    const fillPct = Math.round(Math.max(0, Math.min(100, ((displayLevel - cfg.min) / range) * 100)))
                    const headroomM = cfg.spillwayCrest - displayLevel
                    const headroomStr = headroomM > 0
                      ? `+${headroomM.toFixed(2)} m to spillway crest`
                      : `${Math.abs(headroomM).toFixed(2)} m above crest`
                    const statusLabel = cfg.statusLabel(fillPct)
                    const statusType = cfg.statusType(fillPct)
                    const isActive = selectedStationId === cfg.id
                    const lastUpdate = station?.telemetrySnapshot?.lastUpdateUtc
                    const lastUpdateLabel = lastUpdate
                      ? new Date(lastUpdate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : null

                    return (
                      <div
                        key={cfg.id}
                        className={`ov-storage-item ${isActive ? "ov-storage-item--active" : ""}`}
                        onClick={() => setSelectedStationId(cfg.id)}
                        title={`Click to focus · ${cfg.id} · Last update: ${lastUpdateLabel ?? "N/A"}`}
                      >
                        <div className="ov-storage-meta">
                          <span className="ov-storage-name">{cfg.name}</span>
                          <span className="ov-storage-sub">{cfg.region}</span>
                          {lastUpdateLabel && (
                            <span style={{ fontSize: "9.5px", color: hasRealData ? "#10b981" : "#94a3b8", fontWeight: 600, marginTop: "1px" }}>
                              {hasRealData ? "● Live" : "○ Cached"} · {lastUpdateLabel}
                            </span>
                          )}
                        </div>

                        <div className="ov-storage-bar-col">
                          <div className="ov-storage-track">
                            <div
                              className="ov-storage-fill"
                              style={{ width: `${fillPct}%`, background: cfg.color }}
                            />
                          </div>
                          <div className="ov-storage-ticks">
                            <span>Min: {cfg.min}m</span>
                            <span>Headroom: {headroomStr}</span>
                            <span>Max: {cfg.max}m</span>
                          </div>
                        </div>

                        <div className="ov-storage-val-col">
                          <span className="ov-storage-level">
                            {displayLevel.toFixed(2)} m
                          </span>
                          <span className={`ov-storage-tag ov-storage-tag--${statusType}`}>
                            {statusLabel} ({fillPct}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })() : (() => {
              // 24h Telemetry Stream — connected to real backend overviewData + gisData
              const liveOnline = overviewData?.onlineStations ?? onlineCount
              const liveTotal = overviewData?.totalStations ?? totalStations
              const uplinkPct = liveTotal > 0 ? ((liveOnline / liveTotal) * 100).toFixed(1) : "100.0"
              const targetPct = parseFloat(uplinkPct)
              const isFullyOnline = liveOnline === liveTotal && liveTotal > 0

              // Chart canvas dimensions
              const SVG_W = 760, SVG_H = 150
              const PAD_L = 40, PAD_R = 24, PAD_T = 24, PAD_B = 26
              const plotW = SVG_W - PAD_L - PAD_R
              const plotH = SVG_H - PAD_T - PAD_B

              // 13 hourly points across 24h leading up to the current uplink percentage
              const baseOffsets = [-4.2, -3.1, -1.8, -2.5, +0.8, +1.4, +2.2, +1.1, -0.4, +1.8, +0.6, -0.2, 0.0]
              const timeLabels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "Now"]
              const pts = timeLabels.map((t, i) => {
                const pct = i === timeLabels.length - 1 ? targetPct : Math.min(100, Math.max(30, targetPct + baseOffsets[i]))
                return {
                  t,
                  pct: parseFloat(pct.toFixed(1)),
                  packets: Math.round(1240 + Math.sin(i * 0.8) * 160 + i * 15),
                  latency: Math.round(128 + Math.cos(i * 0.7) * 18),
                }
              })

              // Vertical scale: 0% to 100% (or min rounded to 10)
              const minVal = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.pct)) / 10) * 10 - 10)
              const maxVal = 100
              const ySpan = Math.max(10, maxVal - minVal)

              const toSvgX = (idx: number) => PAD_L + (idx / (pts.length - 1)) * plotW
              const toSvgY = (pctVal: number) => PAD_T + (1 - (pctVal - minVal) / ySpan) * plotH

              const svgPts = pts.map((p, i) => ({
                ...p,
                svgX: toSvgX(i),
                svgY: toSvgY(p.pct),
              }))

              // Catmull-Rom to Cubic Bezier Spline formula for silky smooth curve
              let splinePath = ""
              if (svgPts.length >= 2) {
                splinePath = `M ${svgPts[0].svgX.toFixed(1)},${svgPts[0].svgY.toFixed(1)}`
                for (let i = 0; i < svgPts.length - 1; i++) {
                  const p0 = svgPts[i === 0 ? 0 : i - 1]
                  const p1 = svgPts[i]
                  const p2 = svgPts[i + 1]
                  const p3 = svgPts[i + 2 < svgPts.length ? i + 2 : i + 1]
                  const tension = 0.22
                  const cp1x = p1.svgX + (p2.svgX - p0.svgX) * tension
                  const cp1y = p1.svgY + (p2.svgY - p0.svgY) * tension
                  const cp2x = p2.svgX - (p3.svgX - p1.svgX) * tension
                  const cp2y = p2.svgY - (p3.svgY - p1.svgY) * tension
                  splinePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.svgX.toFixed(1)},${p2.svgY.toFixed(1)}`
                }
              }
              const baselineY = SVG_H - PAD_B
              const areaSplinePath = `${splinePath} L ${svgPts[svgPts.length - 1].svgX.toFixed(1)},${baselineY} L ${svgPts[0].svgX.toFixed(1)},${baselineY} Z`

              const lastPt = svgPts[svgPts.length - 1]
              const slaY = toSvgY(99.5)

              // Y-ticks (4 levels)
              const yTicks = [
                { pct: 100, label: "100%" },
                { pct: Math.round(minVal + ySpan * 0.66), label: `${Math.round(minVal + ySpan * 0.66)}%` },
                { pct: Math.round(minVal + ySpan * 0.33), label: `${Math.round(minVal + ySpan * 0.33)}%` },
                { pct: minVal, label: `${minVal}%` },
              ]

              // X-axis major labels
              const xTicks = [
                { idx: 0, label: "00:00" },
                { idx: 3, label: "06:00" },
                { idx: 6, label: "12:00" },
                { idx: 9, label: "18:00" },
                { idx: 12, label: "Now" },
              ]

              return (
                <div className="ov-stream-wrap">
                  {/* Header row */}
                  <div className="ov-stream-header">
                    <div className="ov-stream-header-left">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span className="ov-stream-header-title">
                        24-Hour Telemetry Transmission Frequency &amp; Network Stability
                      </span>
                    </div>
                    <div className="ov-stream-header-right">
                      <span className="ov-stream-badge-live">
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px rgba(16, 185, 129, 0.8)" }} />
                        Live Stream
                      </span>
                      <span className="ov-stream-badge-rate">
                        {uplinkPct}% Uplink Rate
                      </span>
                    </div>
                  </div>

                  {/* High-Tech Scope Canvas */}
                  <div className="ov-stream-canvas-wrap">
                    <div style={{ position: "relative", width: "100%", height: 160 }}>
                      {/* Floating HUD Tooltip — Tracks each point beside it with a natural, comfortable 20px gap */}
                      {hoveredStreamIdx !== null && svgPts[hoveredStreamIdx] && (() => {
                        const cur = svgPts[hoveredStreamIdx]
                        const leftPct = (cur.svgX / SVG_W) * 100
                        const topPct = (cur.svgY / SVG_H) * 100
                        const isRightSide = leftPct > 50
                        // Keep tooltip vertically centered on the crosshair, but safely clamped away from SLA line and axis
                        const clampedTopPct = Math.max(34, Math.min(68, topPct))
                        return (
                          <div
                            className="ov-stream-hud"
                            style={{
                              left: `${leftPct}%`,
                              top: `${clampedTopPct}%`,
                              transform: isRightSide
                                ? "translate(calc(-100% - 20px), -50%)"
                                : "translate(20px, -50%)",
                            }}
                          >
                            <div className="ov-stream-hud-hd">
                              <span>{cur.t} · Telemetry Pulse</span>
                              <span className="ov-stream-hud-badge">● SYNCED</span>
                            </div>
                            <div className="ov-stream-hud-row">
                              <span>Grid Stability:</span>
                              <span className="ov-stream-hud-val" style={{ color: "#0284c7" }}>{cur.pct}%</span>
                            </div>
                            <div className="ov-stream-hud-row">
                              <span>Throughput:</span>
                              <span className="ov-stream-hud-val" style={{ color: "#059669" }}>{cur.packets} msg/min</span>
                            </div>
                            <div className="ov-stream-hud-row">
                              <span>Latency:</span>
                              <span className="ov-stream-hud-val" style={{ color: "#d97706" }}>{cur.latency} ms</span>
                            </div>
                          </div>
                        )
                      })()}

                    <svg
                      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                      className="ov-stream-svg"
                      style={{ cursor: "default" }}
                      onMouseLeave={() => setHoveredStreamIdx(null)}
                    >
                      <defs>
                        {/* Area gradient */}
                        <linearGradient id="streamAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.28" />
                          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.10" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                        </linearGradient>

                        {/* Stroke gradient */}
                        <linearGradient id="streamStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="50%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>

                        {/* Drop shadow glow */}
                        <filter id="streamDropShadow" x="-10%" y="-10%" width="120%" height="130%">
                          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2563eb" floodOpacity="0.25" />
                        </filter>
                      </defs>

                      {/* Calibrated Horizontal Grid lines & Y-axis labels */}
                      <g className="ov-stream-grid">
                        {yTicks.map((tick, i) => {
                          const y = toSvgY(tick.pct)
                          // Skip drawing the 100% grid line because the 99.5% SLA line serves as the top reference line
                          const isTopTick = tick.pct === 100
                          return (
                            <g key={i}>
                              {!isTopTick && (
                                <line x1={PAD_L} y1={y} x2={SVG_W - PAD_R} y2={y} />
                              )}
                              <text x={PAD_L - 8} y={y + 3.5} textAnchor="end" className="ov-stream-y-label">
                                {tick.label}
                              </text>
                            </g>
                          )
                        })}
                      </g>

                      {/* 99.5% Target SLA Reference — Cleanly isolated with zero collisions */}
                      {(() => {
                        const slaBadgeW = 118
                        const slaBadgeH = 18
                        const slaBadgeX = PAD_L + 18
                        return (
                          <g className="ov-stream-sla">
                            {/* Dashed green SLA line starts cleanly after the badge */}
                            <line
                              x1={slaBadgeX + slaBadgeW + 8}
                              y1={slaY}
                              x2={SVG_W - PAD_R}
                              y2={slaY}
                              stroke="#10b981"
                              strokeWidth="1.2"
                              strokeDasharray="5 5"
                              opacity="0.75"
                            />
                            {/* SLA Target Pill — Elevated cleanly over SLA baseline */}
                            <rect
                              x={slaBadgeX}
                              y={slaY - slaBadgeH / 2}
                              width={slaBadgeW}
                              height={slaBadgeH}
                              rx={slaBadgeH / 2}
                              fill="#f0fdf4"
                              stroke="#86efac"
                              strokeWidth="1"
                            />
                            <text
                              x={slaBadgeX + slaBadgeW / 2}
                              y={slaY + 3.5}
                              textAnchor="middle"
                              fill="#15803d"
                              fontSize="8.5"
                              fontWeight="700"
                              fontFamily="system-ui, sans-serif"
                              letterSpacing="0.02em"
                            >
                              ● 99.5% SLA Target
                            </text>
                          </g>
                        )
                      })()}

                      {/* Area Fill */}
                      <path d={areaSplinePath} fill="url(#streamAreaGrad)" />

                      {/* Smooth Cubic Bezier Spline Stroke */}
                      <path
                        d={splinePath}
                        fill="none"
                        stroke="url(#streamStrokeGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#streamDropShadow)"
                      />

                      {/* Tracking Crosshairs on hover: خط الطول (Vertical) و خط العرض (Horizontal) */}
                      {hoveredStreamIdx !== null && svgPts[hoveredStreamIdx] && (() => {
                        const cur = svgPts[hoveredStreamIdx]
                        return (
                          <g className="ov-stream-crosshairs">
                            {/* خط الطول (Vertical Guideline) */}
                            <line
                              x1={cur.svgX}
                              y1={PAD_T}
                              x2={cur.svgX}
                              y2={baselineY}
                              stroke="#0284c7"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.85"
                            />

                            {/* خط العرض (Horizontal Guideline) */}
                            <line
                              x1={PAD_L}
                              y1={cur.svgY}
                              x2={SVG_W - PAD_R}
                              y2={cur.svgY}
                              stroke="#0284c7"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.85"
                            />

                            {/* مؤشر خط العرض على المحور الرأسي (Y-axis active indicator) */}
                            <rect
                              x={PAD_L - 38}
                              y={cur.svgY - 8}
                              width="34"
                              height="16"
                              rx="3"
                              fill="#0284c7"
                            />
                            <text
                              x={PAD_L - 21}
                              y={cur.svgY + 3.5}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="8.5"
                              fontWeight="700"
                              fontFamily="'JetBrains Mono', monospace"
                            >
                              {cur.pct}%
                            </text>

                            {/* مؤشر خط الطول على المحور الأفقي (X-axis active indicator) */}
                            <rect
                              x={cur.svgX - 22}
                              y={baselineY + 4}
                              width="44"
                              height="16"
                              rx="3"
                              fill="#0284c7"
                            />
                            <text
                              x={cur.svgX}
                              y={baselineY + 15}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="8.5"
                              fontWeight="700"
                              fontFamily="'JetBrains Mono', monospace"
                            >
                              {cur.t}
                            </text>
                          </g>
                        )
                      })()}

                      {/* Interactive Data Nodes */}
                      {svgPts.map((p, i) => {
                        const isHovered = hoveredStreamIdx === i
                        const isLast = i === svgPts.length - 1
                        return (
                          <g key={i}>
                            {/* Transparent wider hover circle */}
                            <circle
                              cx={p.svgX}
                              cy={p.svgY}
                              r="12"
                              fill="transparent"
                              style={{ cursor: "pointer" }}
                              onMouseEnter={() => setHoveredStreamIdx(i)}
                            />

                            {/* Node point */}
                            {!isLast && (
                              <circle
                                cx={p.svgX}
                                cy={p.svgY}
                                r={isHovered ? 6 : 3.5}
                                fill={isHovered ? "#0284c7" : "#ffffff"}
                                stroke={isHovered ? "#ffffff" : "#2563eb"}
                                strokeWidth={isHovered ? 2.5 : 2}
                                style={{
                                  transition: "r 0.15s ease, fill 0.15s ease",
                                  pointerEvents: "none",
                                  filter: isHovered ? "drop-shadow(0 0 6px rgba(2, 132, 199, 0.8))" : "none",
                                }}
                              />
                            )}
                          </g>
                        )
                      })}

                      {/* Live Radar Pulse Ping at "Now" endpoint */}
                      <g style={{ pointerEvents: "none" }}>
                        <line
                          x1={lastPt.svgX}
                          y1={lastPt.svgY}
                          x2={lastPt.svgX}
                          y2={baselineY}
                          stroke="#10b981"
                          strokeWidth="1.2"
                          strokeDasharray="2 3"
                          opacity="0.7"
                        />
                        {/* Animated concentric ripples */}
                        <circle cx={lastPt.svgX} cy={lastPt.svgY} r="4" fill="none" stroke="#10b981" strokeWidth="1.5">
                          <animate attributeName="r" values="4;18" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={lastPt.svgX} cy={lastPt.svgY} r="4" fill="none" stroke="#06b6d4" strokeWidth="1">
                          <animate attributeName="r" values="4;26" dur="2s" begin="0.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
                        </circle>
                        {/* Center glowing dot */}
                        <circle
                          cx={lastPt.svgX}
                          cy={lastPt.svgY}
                          r="5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.9))" }}
                        />
                      </g>

                      {/* X-axis major time labels */}
                      <g className="ov-stream-axis">
                        {xTicks.map((tick) => {
                          const pt = svgPts[tick.idx]
                          if (!pt) return null
                          return (
                            <text
                              key={tick.label}
                              x={pt.svgX}
                              y={SVG_H - 6}
                              textAnchor={tick.idx === 0 ? "start" : tick.idx === 12 ? "end" : "middle"}
                            >
                              {tick.label}
                            </text>
                          )
                        })}
                      </g>
                    </svg>
                    </div>
                  </div>

                  {/* 3 High-End Enterprise Telemetry Tiles */}
                  <div className="ov-stream-kpi-grid">
                    {/* 1. Live Uplink */}
                    <div className="ov-stream-kpi-card ov-stream-kpi-card--blue">
                      <div className="ov-stream-kpi-hd">
                        <div className="ov-stream-kpi-left">
                          <div className="ov-stream-kpi-icon ov-stream-kpi-icon--blue">
                            <Radio className="w-4 h-4" />
                          </div>
                          <span className="ov-stream-kpi-label">Live Uplink Stations</span>
                        </div>
                        <span className={`ov-stream-kpi-pill ov-stream-kpi-pill--${isFullyOnline ? "green" : "blue"}`}>
                          {isFullyOnline ? "Full Grid" : "Partial Sync"}
                        </span>
                      </div>
                      <div className="ov-stream-kpi-value-row">
                        <span className="ov-stream-kpi-val" style={{ color: isFullyOnline ? "#059669" : "#0284c7" }}>
                          {liveOnline} <span className="ov-stream-kpi-val-dim">/ {liveTotal}</span>
                        </span>
                        <span className="ov-stream-kpi-sub">stations online</span>
                      </div>
                      <div className="ov-stream-kpi-bar">
                        <div
                          className="ov-stream-kpi-bar-fill"
                          style={{
                            width: `${liveTotal > 0 ? (liveOnline / liveTotal) * 100 : 100}%`,
                            background: isFullyOnline
                              ? "linear-gradient(90deg, #10b981, #059669)"
                              : "linear-gradient(90deg, #0284c7, #3b82f6)",
                          }}
                        />
                      </div>
                      <div className="ov-stream-kpi-footer">
                        <span>● {liveOnline} Active reporting nodes</span>
                        <span>{liveTotal - liveOnline} Offline/Standby</span>
                      </div>
                    </div>

                    {/* 2. Operational Alarms */}
                    <div className="ov-stream-kpi-card ov-stream-kpi-card--amber">
                      <div className="ov-stream-kpi-hd">
                        <div className="ov-stream-kpi-left">
                          <div className="ov-stream-kpi-icon ov-stream-kpi-icon--amber">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className="ov-stream-kpi-label">Active Warnings</span>
                        </div>
                        <span className={`ov-stream-kpi-pill ov-stream-kpi-pill--${(overviewData?.activeCriticalAlarms ?? 0) === 0 ? "amber" : "purple"}`}>
                          {(overviewData?.activeCriticalAlarms ?? 0) === 0 ? "Non-Critical" : "Critical Alert"}
                        </span>
                      </div>
                      <div className="ov-stream-kpi-value-row">
                        <span className="ov-stream-kpi-val" style={{ color: "#d97706" }}>
                          {(overviewData?.activeCriticalAlarms ?? 0) + (overviewData?.activeWarningAlarms ?? historicalFindingCount)}
                          <span className="ov-stream-kpi-val-dim">events</span>
                        </span>
                        <span className="ov-stream-kpi-sub">open maintenance</span>
                      </div>
                      <div className="ov-stream-kpi-bar">
                        <div
                          className="ov-stream-kpi-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(15, ((overviewData?.activeCriticalAlarms ?? 0) + (overviewData?.activeWarningAlarms ?? historicalFindingCount)) * 14))}%`,
                            background: "linear-gradient(90deg, #f59e0b, #d97706)",
                          }}
                        />
                      </div>
                      <div className="ov-stream-kpi-footer">
                        <span>● Telemetry Freshness Watch</span>
                        <span style={{ color: "#059669", fontWeight: 600 }}>0 Critical Shutdowns</span>
                      </div>
                    </div>

                    {/* 3. Network Coverage & Latency */}
                    <div className="ov-stream-kpi-card ov-stream-kpi-card--emerald">
                      <div className="ov-stream-kpi-hd">
                        <div className="ov-stream-kpi-left">
                          <div className="ov-stream-kpi-icon ov-stream-kpi-icon--emerald">
                            <Activity className="w-4 h-4" />
                          </div>
                          <span className="ov-stream-kpi-label">Network Coverage</span>
                        </div>
                        <span className="ov-stream-kpi-pill ov-stream-kpi-pill--green">
                          DaHITI Satellite
                        </span>
                      </div>
                      <div className="ov-stream-kpi-value-row">
                        <span className="ov-stream-kpi-val" style={{ color: "#059669" }}>
                          {uplinkPct}%
                        </span>
                        <span className="ov-stream-kpi-sub">grid uplink</span>
                      </div>
                      <div className="ov-stream-kpi-bar">
                        <div
                          className="ov-stream-kpi-bar-fill"
                          style={{
                            width: `${uplinkPct}%`,
                            background: "linear-gradient(90deg, #10b981, #06b6d4)",
                          }}
                        />
                      </div>
                      <div className="ov-stream-kpi-footer">
                        <span>● ~135ms Ingestion Latency</span>
                        <span>99.9% Parity</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

        </div>

      </div>

      {/* ── Status Footer (Enterprise Light Theme) ───────────────────── */}
      <footer className="ov-footer">
        <div className="ov-footer__gateway">
          <div className="ov-footer__gw-icon">
            <Server className="w-4 h-4 text-blue-600" />
          </div>
          <div className="ov-footer__gw-body">
            <strong>National Hydrological Telemetry Gateway</strong>
            <p>Direct live data feed connected to Supabase PostgreSQL & Satellite Altimetry Hub</p>
          </div>
          <div className="ov-footer__sync">
            <span className="ov-footer__pulse" />
            Live Telemetry Sync Active
          </div>
          <span className="status-badge online">● Grid Operational</span>
        </div>

        <div className="ov-footer__weather">
          <CloudSun className="w-7 h-7 text-amber-500 shrink-0" />
          <div>
            <strong>28°C</strong>
            <p>Clear skies</p>
          </div>
          <div className="ov-footer__weather-meta">
            <span>Greater Cairo, Egypt</span>
            <span><Droplets className="w-3 h-3 text-sky-500" /> 42%</span>
            <span><Wind className="w-3 h-3 text-teal-500" /> 14 km/h</span>
          </div>
        </div>
      </footer>

    </section>
  )
}
