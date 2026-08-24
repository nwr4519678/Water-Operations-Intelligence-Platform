// src/pages/MapPage.tsx
import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { WaterStation, DatasetValidationReport } from "../data/stationTypes"
import { loadWaterStations, getCachedStations } from "../data/stationLoader"
import { MapLibreDeckMap } from "../components/map/MapLibreDeckMap"
import { StationTelemetryDrawer } from "../components/map/StationTelemetryDrawer"
import { useUiStore } from "../store/uiStore"
import {
  Search,
  Filter,
  Database,
  CheckCircle,
  Radio,
  MapPin,
  Layers,
  ExternalLink,
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

  const mapLanguage = useUiStore((state) => state.mapLanguage)
  const setMapLanguage = useUiStore((state) => state.setMapLanguage)
  const isAr = mapLanguage === "ar"

  const navigate = useNavigate()

  // Load authoritative CSV dataset
  useEffect(() => {
    loadWaterStations().then(({ stations: loaded, report: rep }) => {
      setStations(loaded)
      setReport(rep)
    })
  }, [])

  // Filtered stations based on search, type, region, and status
  const filteredStations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return stations.filter((s) => {
      const matchesSearch =
        !q ||
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.nameAr && s.nameAr.includes(q)) ||
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

  return (
    <section className="dashboard" dir={isAr ? "rtl" : "ltr"}>
      {/* ── 1. Top GIS Command KPI Summary Banner ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            Σ
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "إجمالي المحطات" : "Total Stations"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {report.totalRows}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
            ★
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "المركز الرئيسي" : "Control Center"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {report.mainCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            ◆
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "محطات مرجعية" : "Master Stations"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {report.masterCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            ●
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "محطات رصد RTU" : "Field RTUs"}
            </div>
            <div className="text-lg font-black text-slate-800 font-mono">
              {report.rtuCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "الحالة اللحظية" : "Online State"}
            </div>
            <div className="text-lg font-black text-emerald-600 font-mono">
              {report.onlineCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {isAr ? "جودة البيانات" : "Data Integrity"}
            </div>
            <div className="text-xs font-black text-purple-700">
              100% Valid CSV
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main GIS Layout Grid ────────────────────────────────────── */}
      <div className="map-page-grid">
        {/* Left Sidebar: Filter, Search & Stations List */}
        <aside
          className="station-sidebar"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Language Toggle Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🌐</span>
              <span>
                {isAr ? "لغة عرض المحطات:" : "Station Info Language:"}
              </span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setMapLanguage("en")}
                className={`text-xs px-2.5 py-1 rounded font-semibold cursor-pointer border-0 transition-colors ${
                  mapLanguage === "en"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setMapLanguage("ar")}
                className={`text-xs px-2.5 py-1 rounded font-semibold cursor-pointer border-0 font-['Noto_Kufi_Arabic'] transition-colors ${
                  mapLanguage === "ar"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                عربي
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="station-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAr
                  ? "بحث بالاسم، الكود، أو الإقليم (مثل: HQ, RTU-2001, السد)..."
                  : "Search by name, ID, or sector..."
              }
              dir="auto"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="border-0 bg-transparent text-slate-400 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type & Status Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`text-[11px] px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border ${
                selectedType === "all"
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {isAr ? "الكل" : "All"} ({stations.length})
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedType(selectedType === "main" ? "all" : "main")
              }
              className={`text-[11px] px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border ${
                selectedType === "main"
                  ? "bg-red-600 text-white border-red-700"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              HQ ({report.mainCount})
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedType(selectedType === "master" ? "all" : "master")
              }
              className={`text-[11px] px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border ${
                selectedType === "master"
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              Master ({report.masterCount})
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedType(selectedType === "rtu" ? "all" : "rtu")
              }
              className={`text-[11px] px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all border ${
                selectedType === "rtu"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              RTU ({report.rtuCount})
            </button>
          </div>

          {/* Regional Filter Dropdown */}
          <div className="pt-1">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="select w-full text-xs bg-white cursor-pointer"
            >
              <option value="all">
                {isAr ? "كافة الأقاليم المائية" : "All Hydrological Regions"}
              </option>
              {report.regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Scrollable Station List */}
          <div className="station-list-scroll mt-1">
            {filteredStations.map((s) => {
              const isSelected = s.id === selectedStationId
              const name = isAr ? s.nameAr || s.name : s.nameEn || s.name
              const statusClass =
                s.type === "main"
                  ? "red"
                  : s.type === "master"
                    ? "warning"
                    : "good"

              return (
                <div
                  key={s.id}
                  className={`station-list-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectStation(s)}
                >
                  <i className={`dot ${statusClass}`} />
                  <div className="min-w-0 flex-1">
                    <strong className="truncate block font-mono text-[11px]">
                      {s.code} —{" "}
                      <span className="font-sans font-bold">{name}</span>
                    </strong>
                    <p className="truncate text-[10px] text-slate-500">
                      {s.region}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Right Area: MapLibre + deck.gl GIS Map + Selected Station Card Below */}
        <div className="flex flex-col gap-3.5">
          {/* Map Container Panel */}
          <div className="panel p-3.5 bg-white">
            <div className="panel-heading mb-2.5">
              <div>
                <h2>
                  {isAr
                    ? "الخريطة التليمترية القومية للموارد المائية"
                    : "National Water Telemetry GIS Command Center"}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  High-performance MapLibre GL JS + deck.gl WebGL vector engine
                  ({filteredStations.length} nodes rendered)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  GPU WebGL Active
                </span>
              </div>
            </div>

            {/* MapLibre + deck.gl Map */}
            <MapLibreDeckMap
              stations={filteredStations}
              bounds={report.bounds}
              selectedStationId={selectedStationId}
              onSelectStation={handleSelectStation}
              language={mapLanguage}
              height="530px"
            />
          </div>

          {/* Selected Station Telemetry Card Under Map */}
          {selectedStation && (
            <div className="panel p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedStation.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="m-0 text-sm font-bold text-slate-900">
                        {isAr
                          ? selectedStation.nameAr || selectedStation.name
                          : selectedStation.nameEn || selectedStation.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                        {selectedStation.typeLabel}
                      </span>
                    </div>
                    <p className="m-0 text-[11px] text-slate-500 font-medium">
                      {isAr
                        ? selectedStation.nameEn || selectedStation.name
                        : selectedStation.nameAr || selectedStation.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● {selectedStation.connectionState}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <span>
                      {isAr ? "فحص السجل التليمترى" : "Inspect Telemetry Slots"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/stations/${selectedStation.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <span>
                      {isAr
                        ? "فتح التحليلات الكاملة ↗"
                        : "Open Full Analytics ↗"}
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Informational Metrics Columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {isAr ? "الإقليم الهيدرولوجي" : "Hydrological Region"}
                  </span>
                  <strong className="text-xs text-slate-800">
                    {selectedStation.region}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {isAr ? "حالة الربط والشبكة" : "Connection Status"}
                  </span>
                  <strong className="text-xs text-emerald-700 font-medium">
                    {selectedStation.connectionStatus}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {isAr ? "الإحداثيات الجغرافية" : "Coordinates (CSV)"}
                  </span>
                  <strong className="text-xs text-slate-700 font-mono">
                    {selectedStation.latitude.toFixed(4)}°N,{" "}
                    {selectedStation.longitude.toFixed(4)}°E
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] font-bold uppercase text-blue-600 block mb-0.5">
                    {isAr ? "بروتوكول البث" : "Telemetry Link"}
                  </span>
                  <strong className="text-xs text-blue-900 font-mono">
                    {selectedStation.type === "main"
                      ? "Satellite VSAT"
                      : "GSM / GPRS 4G"}
                  </strong>
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
        language={mapLanguage}
      />
    </section>
  )
}
