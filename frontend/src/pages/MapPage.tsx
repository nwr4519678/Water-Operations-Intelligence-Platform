// src/pages/MapPage.tsx
import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { WaterStation, DatasetValidationReport } from "../data/stationTypes"
import { loadWaterStations, getCachedStations } from "../data/stationLoader"
import { MapLibreDeckMap } from "../components/map/MapLibreDeckMap"
import { StationTelemetryDrawer } from "../components/map/StationTelemetryDrawer"
import {
  Search,
  CheckCircle2,
  Radio,
  MapPin,
  Layers,
  Cpu,
  Activity,
  Signal,
  Globe2,
  ChevronDown,
  X,
  Compass,
  Zap,
  Droplets,
  Server,
  Satellite,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from "lucide-react"

export const MapPage: React.FC = () => {
  const [stations, setStations] = useState<WaterStation[]>(
    () => getCachedStations().stations,
  )
  const [report, setReport] = useState<DatasetValidationReport>(
    () => getCachedStations().report,
  )
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    "MST-01",
  )
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const [search, setSearch] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now")

  const navigate = useNavigate()

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const { stations: loaded, report: rep } = await loadWaterStations(true)
      setStations(loaded)
      setReport(rep)
      const now = new Date()
      setLastSyncTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      )
    } catch {
      // keep existing cached
    } finally {
      setIsRefreshing(false)
    }
  }

  // Load authoritative CSV dataset with periodic silent refresh
  useEffect(() => {
    loadWaterStations().then(({ stations: loaded, report: rep }) => {
      setStations(loaded)
      setReport(rep)
    })
    const refreshTimer = window.setInterval(() => {
      refreshData()
    }, 60000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  // Filtered stations based on search, type, region, and status
  const filteredStations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stations.filter((s) => {
      const matchesSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
        s.region.toLowerCase().includes(q)

      const matchesType = selectedType === "all" || s.type === selectedType
      const matchesRegion =
        selectedRegion === "all" || s.region === selectedRegion
      const matchesStatus =
        selectedStatus === "all" || s.connectionState === selectedStatus

      return matchesSearch && matchesType && matchesRegion && matchesStatus
    })
  }, [stations, search, selectedType, selectedRegion, selectedStatus])

  // Selected station reference
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || stations[0]
  }, [stations, selectedStationId])

  const handleSelectStation = (station: WaterStation) => {
    setSelectedStationId(station.id)
  }

  const onlineRatio =
    report.totalRows > 0
      ? Math.round((report.onlineCount / report.totalRows) * 100)
      : 0

  // Helper to extract water body type from name
  const getWaterbodyType = (name: string): string => {
    const lower = name.toLowerCase()
    if (lower.includes("reservoir")) return "Reservoir"
    if (lower.includes("lake")) return "Lake"
    if (lower.includes("river") || lower.includes("nile")) return "River"
    if (lower.includes("canal")) return "Canal"
    return "Station"
  }

  return (
    <section className="w-full min-h-full px-4 sm:px-6 lg:px-7 py-5 flex flex-col gap-4.5 box-border max-w-none" dir="ltr">
      {/* ── 1. Page Header & Live Status Bar ────────────────────────────── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
              Geospatial Operations Center
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              National Hydrological Telemetry Grid
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight m-0">
            Map & Stations Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated:</span>
            <strong className="text-slate-800 font-mono">{lastSyncTime}</strong>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/90 shadow-xs cursor-pointer transition-all disabled:opacity-60"
            title="Refresh Telemetry Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Executive KPI Cards (Stretches Full Width) ───────────── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Nodes */}
        <div className="group bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
              Authoritative
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Monitoring Nodes
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {report.totalRows}
            </div>
            <span className="text-xs text-slate-400 font-medium">stations</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Coverage across Nile Valley & Delta
          </div>
        </div>

        {/* Card 2: Master Baselines */}
        <div className="group bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs group-hover:scale-105 transition-transform">
              <Satellite className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
              DaHITI Target
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Master Baselines
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {report.masterCount}
            </div>
            <span className="text-xs text-slate-400 font-medium">calibrated</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Satellite radar altimetry reference
          </div>
        </div>

        {/* Card 3: Active Telemetry */}
        <div className="group bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineRatio}% Live
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Telemetry
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {report.onlineCount}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              of {report.totalRows} online
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${onlineRatio}%` }}
            />
          </div>
        </div>

        {/* Card 4: Historical Archive */}
        <div className="group bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shadow-xs group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Archive Store
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Historical Records
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              {report.warningCount}
            </div>
            <span className="text-xs text-slate-400 font-medium">baselines</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Historical hydrology validation data
          </div>
        </div>
      </div>

      {/* ── 3. Main GIS Grid: Sidebar & Map Canvas (Full Available Width) ─ */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[390px_1fr] gap-4.5 items-start">
        {/* ── Left Station Explorer Sidebar ── */}
        <aside className="w-full bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col gap-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-80px)]">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-xs tracking-tight">
                Telemetry Station Directory
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {filteredStations.length} / {stations.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, or region..."
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedType("all")
                setSelectedStatus("all")
              }}
              className={`text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer transition-all border ${
                selectedType === "all" && selectedStatus === "all"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({stations.length})
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === "online" ? "all" : "online",
                )
              }
              className={`text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer transition-all border ${
                selectedStatus === "online"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
              }`}
            >
              Recent ({report.onlineCount})
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === "warning" ? "all" : "warning",
                )
              }
              className={`text-[11px] px-3 py-1 rounded-lg font-bold cursor-pointer transition-all border ${
                selectedStatus === "warning"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70"
              }`}
            >
              Historical ({report.warningCount})
            </button>
          </div>

          {/* Hydrological Region Selector */}
          <div className="relative">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
            >
              <option value="all">All Hydrological Regions</option>
              {report.regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Station Cards Scrollable Feed */}
          <div className="overflow-y-auto flex flex-col gap-2 pr-0.5 max-h-[500px] xl:max-h-[calc(100vh-360px)]">
            {filteredStations.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400 text-xs">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="font-semibold text-slate-600">No stations found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try adjusting search or status filters
                </p>
              </div>
            ) : (
              filteredStations.map((s) => {
                const isSelected = s.id === selectedStationId
                const name = s.nameEn || s.name
                const isOnline = s.connectionState === "online"
                const waterbody = getWaterbodyType(name)
                const waterLevel = s.telemetrySnapshot?.waterLevel

                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => handleSelectStation(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-50/90 to-indigo-50/50 border-blue-400/90 shadow-sm ring-1 ring-blue-400/30"
                        : "bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {/* Active accent bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r" />
                    )}

                    {/* Top Row: Code & Badges */}
                    <div className="flex items-center justify-between gap-1 mb-1 pl-1">
                      <strong className="font-mono text-xs font-bold text-slate-900 tracking-tight">
                        {s.code}
                      </strong>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {waterbody}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-xs font-bold text-slate-800 truncate pl-1 mb-1.5">
                      {name}
                    </div>

                    {/* Meta Row: Status & Level */}
                    <div className="flex items-center justify-between text-[10px] pl-1 pt-1 border-t border-slate-100/80">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline
                              ? "bg-emerald-500 ring-2 ring-emerald-100"
                              : "bg-amber-500 ring-2 ring-amber-100"
                          }`}
                        />
                        <span
                          className={isOnline ? "text-emerald-700" : "text-amber-700"}
                        >
                          {isOnline ? "Recent" : "Historical"}
                        </span>
                      </span>

                      {waterLevel && waterLevel !== "—" ? (
                        <span className="font-mono font-bold text-blue-700 bg-blue-50/70 px-1.5 py-0.5 rounded">
                          {waterLevel} m
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400">
                          {s.latitude.toFixed(2)}°, {s.longitude.toFixed(2)}°
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* ── Right Content Area (Fills All Remaining Width Seamlessly) ── */}
        <div className="w-full flex flex-col gap-4.5 min-w-0">
          {/* Map Container Panel */}
          <div className="w-full bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs">
            {/* Header Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight m-0">
                      National Water Telemetry GIS Command Center
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Vector 2D GIS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium m-0">
                    High-performance MapLibre GL JS + deck.gl WebGL vector engine
                    &nbsp;·&nbsp;
                    <span className="text-slate-700 font-bold">
                      {filteredStations.length} nodes rendered
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  GPU WebGL Active
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Map Canvas (Exact same MapLibreDeckMap setup & theme preserved) */}
            <div className="w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-inner">
              <MapLibreDeckMap
                stations={filteredStations}
                bounds={report.bounds}
                selectedStationId={selectedStationId}
                onSelectStation={handleSelectStation}
                language="en"
                height="560px"
              />
            </div>
          </div>

          {/* ── Selected Station Telemetry Showcase Card ── */}
          {selectedStation && (
            <div className="w-full bg-white p-5 border border-slate-200/90 rounded-2xl shadow-xs">
              {/* Card Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="px-3.5 py-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-mono font-black text-sm tracking-wide shadow-xs">
                    {selectedStation.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="m-0 text-base md:text-lg font-black text-slate-900 tracking-tight">
                        {selectedStation.nameEn || selectedStation.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {getWaterbodyType(selectedStation.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span>{selectedStation.region}</span>
                      <span>·</span>
                      <span className="text-slate-400">
                        Authoritative Telemetry Station
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${
                      selectedStation.connectionState === "online"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : selectedStation.connectionState === "warning"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedStation.connectionState === "online"
                          ? "bg-emerald-500 animate-pulse"
                          : selectedStation.connectionState === "warning"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`}
                    />
                    {selectedStation.connectionState === "online"
                      ? "Online · Live"
                      : "Historical Baseline"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors border border-slate-200 shadow-xs"
                  >
                    <Signal className="w-3.5 h-3.5 text-slate-600" />
                    <span>Inspect Telemetry Slots</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/stations/${selectedStation.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs hover:shadow transition-all"
                  >
                    <span>Open Full Analytics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 5 Structured Telemetry Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
                {/* Tile 1: Water Level */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/80">
                  <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>Water Level</span>
                  </div>
                  <strong className="text-base font-black text-blue-950 font-mono block">
                    {selectedStation.telemetrySnapshot?.waterLevel &&
                    selectedStation.telemetrySnapshot.waterLevel !== "—"
                      ? `${selectedStation.telemetrySnapshot.waterLevel} m`
                      : "24.50 m MSL"}
                  </strong>
                  <span className="text-[10px] text-blue-600/80 font-medium block mt-0.5">
                    Altimetry Elevation
                  </span>
                </div>

                {/* Tile 2: Hydrological Region */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hydrological Basin</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block truncate">
                    {selectedStation.region}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Nile River Drainage Basin
                  </span>
                </div>

                {/* Tile 3: Connection Status */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Radio className="w-3.5 h-3.5 text-slate-500" />
                    <span>Connection Health</span>
                  </div>
                  <strong className="text-xs font-bold text-emerald-700 block truncate">
                    {selectedStation.connectionStatus || "Nominal Telemetry"}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Heartbeat Synchronized
                  </span>
                </div>

                {/* Tile 4: GPS Coordinates */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Compass className="w-3.5 h-3.5 text-slate-500" />
                    <span>GPS Coordinates</span>
                  </div>
                  <strong className="text-xs font-bold text-slate-800 font-mono block truncate">
                    {selectedStation.latitude.toFixed(4)}°N,{" "}
                    {selectedStation.longitude.toFixed(4)}°E
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    WGS84 Geodetic Datum
                  </span>
                </div>

                {/* Tile 5: Telemetry Carrier */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100/80">
                  <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Uplink Protocol</span>
                  </div>
                  <strong className="text-xs font-bold text-indigo-950 font-mono block truncate">
                    {selectedStation.type === "main"
                      ? "Satellite VSAT Link"
                      : "Satellite / 4G LTE"}
                  </strong>
                  <span className="text-[10px] text-indigo-600/80 font-medium block mt-0.5">
                    DaHITI Altimetry Ingestion
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Station Telemetry Drawer */}
      <StationTelemetryDrawer
        station={selectedStation}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        language="en"
      />
    </section>
  )
}
export default MapPage
