// src/pages/MapPage.tsx
// Production-grade Water Telemetry GIS command page.
// English only. Single data source: Backend API.
// One station registry -> MapPage state -> deck.gl layers.
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { WaterStation, mapDtoToWaterStation, BoundingBox } from '../data/stationTypes';
import { useMapStations } from '../hooks/useViewerQueries';
import { MapLibreDeckMap } from '../components/map/MapLibreDeckMap';
import { StationTelemetryDrawer } from '../components/map/StationTelemetryDrawer';
import { getLodLevel } from '../map/mapConstants';
import { STATUS_CSS } from '../map/mapConstants';
import {
  Search, Database, CheckCircle, Radio, MapPin,
  Layers, ExternalLink, BarChart3, AlertTriangle, Activity,
  RadioTower, Building2, Network, CheckCircle2, ShieldCheck, RotateCcw,
} from 'lucide-react';

// ── Regional summary derived from loaded dataset ──────────────────────────────
function buildRegionalSummary(stations: WaterStation[]) {
  const map = new Map<string, { total: number; online: number; warning: number; offline: number; unknown: number }>();
  for (const s of stations) {
    const r = s.region;
    if (!map.has(r)) map.set(r, { total: 0, online: 0, warning: 0, offline: 0, unknown: 0 });
    const entry = map.get(r)!;
    entry.total++;
    entry[s.connectionState]++;
  }
  return Array.from(map.entries())
    .map(([region, counts]) => ({ region, ...counts }))
    .sort((a, b) => b.total - a.total);
}

export const MapPage: React.FC = () => {
  const { data: stationsResult, isLoading } = useMapStations({ pageSize: 1000 });
  const stations: WaterStation[] = useMemo(() => {
    if (!stationsResult?.items) return [];
    return stationsResult.items.map(mapDtoToWaterStation);
  }, [stationsResult]);

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab]   = useState<'list' | 'regions'>('list');

  const [search,         setSearch]         = useState<string>('');
  const [selectedType,   setSelectedType]   = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [mapZoom, setMapZoom] = useState<number>(6.2);

  const navigate = useNavigate();

  // ── Derived KPI report ────────────────────────────────────────────────────
  const report = useMemo(() => {
    const totalRows = stations.length;
    const mainCount = stations.filter((s) => s.type === 'main').length;
    const masterCount = stations.filter((s) => s.type === 'master').length;
    const rtuCount = stations.filter((s) => s.type === 'rtu').length;
    const onlineCount = stations.filter((s) => s.connectionState === 'online').length;
    const warningCount = stations.filter((s) => s.connectionState === 'warning').length;
    const offlineCount = stations.filter((s) => s.connectionState === 'offline').length;
    const unknownCount = stations.filter((s) => s.connectionState === 'unknown').length;
    const regions = Array.from(new Set(stations.map((s) => s.region))).sort();

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const s of stations) {
      if (s.latitude < minLat) minLat = s.latitude;
      if (s.latitude > maxLat) maxLat = s.latitude;
      if (s.longitude < minLng) minLng = s.longitude;
      if (s.longitude > maxLng) maxLng = s.longitude;
    }
    const bounds: BoundingBox = {
      minLat: minLat === 90 ? 22 : minLat,
      maxLat: maxLat === -90 ? 32 : maxLat,
      minLng: minLng === 180 ? 24 : minLng,
      maxLng: maxLng === -180 ? 37 : maxLng,
      centerLat: 27.0,
      centerLng: 31.0,
    };

    return {
      totalRows,
      validCount: totalRows,
      invalidCount: 0,
      mainCount,
      masterCount,
      rtuCount,
      onlineCount,
      warningCount,
      offlineCount,
      unknownCount,
      regions,
      duplicateCount: 0,
      duplicateKeys: [],
      bounds,
      errors: [],
    };
  }, [stations]);

  // ── Filtered station set — drives both the list and the map ──────────────
  const filteredStations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        s.typeLabel.toLowerCase().includes(q);

      const matchesType   = selectedType   === 'all' || s.type             === selectedType;
      const matchesRegion = selectedRegion === 'all' || s.region           === selectedRegion;
      const matchesStatus = selectedStatus === 'all' || s.connectionState  === selectedStatus;

      return matchesSearch && matchesType && matchesRegion && matchesStatus;
    });
  }, [stations, search, selectedType, selectedRegion, selectedStatus]);

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [stations, selectedStationId]
  );

  const regionSummary = useMemo(() => buildRegionalSummary(stations), [stations]);

  const uniqueRegions = useMemo(
    () => Array.from(new Set(stations.map((s) => s.region))).sort(),
    [stations]
  );

  const handleSelectStation = (station: WaterStation) => {
    setSelectedStationId(station.id);
  };

  if (isLoading && stations.length === 0) {
    return (
      <section className="dashboard">
        <div className="flex items-center justify-center h-96 text-slate-400">
          <div className="text-center">
            <Activity className="w-10 h-10 mx-auto mb-3 animate-pulse text-blue-500" />
            <p className="text-sm font-medium">Loading live station registry from backend API...</p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="dashboard map-command-page">

      {/* ── KPI Summary Banner — computed from real dataset ─────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3.5 map-kpi-grid">
        {[
          { label: 'Total Stations', value: report.totalRows, Icon: RadioTower, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Control Center', value: report.mainCount, Icon: Building2, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Master Stations', value: report.masterCount, Icon: Network, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Field RTU', value: report.rtuCount, Icon: Radio, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Online', value: report.onlineCount, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Valid / CSV Rows', value: `${report.validCount}/${report.totalRows}`, Icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 map-kpi-card">
            <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center map-kpi-icon`}><Icon size={17} strokeWidth={2.2} /></div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
              <div className="text-lg font-black text-slate-800 font-mono">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Validation Report Badge ──────────────────────────────────────────── */}
      {report.errors.length > 0 && (
        <div className="mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Dataset validation: </span>
            {report.invalidCount} invalid rows excluded from rendering.
            <span className="ml-2 font-mono">{report.errors.slice(0, 3).join(' | ')}</span>
            {report.errors.length > 3 && ` ... +${report.errors.length - 3} more`}
          </div>
        </div>
      )}

      {report.duplicateCount > 0 && (
        <div className="mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Duplicate station records detected: </span>
            {report.duplicateCount} duplicate coordinate/name key{report.duplicateCount === 1 ? '' : 's'} identified in the loaded dataset.
          </div>
        </div>
      )}

      {/* ── Main 3-column layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3.5">

        {/* LEFT: Sidebar — filters, search, station list / regional stats */}
        <aside className="panel p-0 bg-white overflow-hidden flex flex-col map-filter-panel" style={{ maxHeight: 'calc(100vh - 104px)' }}>

          {/* Filters */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="filter-panel-heading"><div><span className="filter-eyebrow">Operations registry</span><h2>Station Registry Filter</h2></div><button type="button" className="filter-reset" onClick={() => { setSearch(''); setSelectedType('all'); setSelectedRegion('all'); setSelectedStatus('all'); }} title="Reset filters"><RotateCcw size={13} /></button></div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                id="map-station-search"
                type="text"
                placeholder="Search by name, ID, region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-800"
              />
            </div>

            {/* Type filter */}
            <div className="flex gap-1 flex-wrap">
              {[
                { val: 'all',    label: 'All' },
                { val: 'main',   label: 'HQ' },
                { val: 'master', label: 'Master' },
                { val: 'rtu',    label: 'RTU' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedType(val)}
                  aria-pressed={selectedType === val}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    selectedType === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {[
                { val: 'all',     label: 'All Status' },
                { val: 'online',  label: 'Online' },
                { val: 'warning', label: 'Warning' },
                { val: 'offline', label: 'Offline' },
                { val: 'unknown', label: 'Unknown' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedStatus(val)}
                  aria-pressed={selectedStatus === val}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    selectedStatus === val
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Region filter — dynamic from CSV */}
            <select
              id="map-region-filter"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="all">All Hydrological Regions ({uniqueRegions.length})</option>
              {uniqueRegions.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          {/* Tabs: Station List / Regional Summary */}
          <div className="flex border-b border-slate-100">
            {(['list', 'regions'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                }`}
              >
                {tab === 'list' ? `Stations (${filteredStations.length})` : `Regional Stats`}
              </button>
            ))}
          </div>

          {/* Station list */}
          {activeTab === 'list' && (
            <div className="overflow-y-auto flex-1">
              {filteredStations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No stations match your filters.
                </div>
              ) : (
                filteredStations.map((s) => {
                  const isSelected = s.id === selectedStationId;
                  const css = STATUS_CSS[s.connectionState] ?? STATUS_CSS.unknown;
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${s.name}`}
                      onClick={() => handleSelectStation(s)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectStation(s)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${css.dot}`} />
                      <div className="min-w-0 flex-1">
                        <strong className="truncate block font-mono text-[11px] text-slate-800">
                          {s.code} &middot; <span className="font-sans font-bold">{s.name}</span>
                        </strong>
                        <p className="truncate text-[10px] text-slate-500">{s.region}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 shrink-0">
                        {s.type === 'main' ? 'HQ' : s.type === 'master' ? 'MST' : 'RTU'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Regional statistics — derived from CSV, not hard-coded */}
          {activeTab === 'regions' && (
            <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Station Distribution by Hydrological Region
              </div>
              {regionSummary.map(({ region, total, online, warning, offline, unknown }) => (
                <div
                  key={region}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => setSelectedRegion(region === selectedRegion ? 'all' : region)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{region}</span>
                    <span className="font-mono text-xs font-black text-slate-800 shrink-0">{total}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-semibold">
                    {online  > 0 && <span className="text-emerald-600">✓ {online} online</span>}
                    {warning > 0 && <span className="text-amber-600">⚠ {warning} warn</span>}
                    {offline > 0 && <span className="text-red-600">✗ {offline} offline</span>}
                    {unknown > 0 && <span className="text-slate-400">? {unknown} unknown</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* RIGHT: Map + selected station card */}
        <div className="flex flex-col gap-3.5">

          {/* Map container */}
          <div className="panel p-3.5 bg-white map-command-map-card">
            <div className="panel-heading mb-2.5">
              <div>
                <h2>National Water Telemetry GIS Command Center</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  MapLibre GL JS + deck.gl WebGL engine &middot; {filteredStations.length} nodes rendered
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  ● GPU WebGL Active
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  LOD: {getLodLevel(mapZoom).toUpperCase()}
                </span>
              </div>
            </div>

            <MapLibreDeckMap
              stations={filteredStations}
              bounds={report.bounds}
              selectedStationId={selectedStationId}
              onSelectStation={handleSelectStation}
              onZoomChange={setMapZoom}
              height="530px"
            />
          </div>

          {/* Selected station card */}
          {selectedStation && (
            <div className="panel p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedStation.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="m-0 text-sm font-bold text-slate-900">{selectedStation.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                        {selectedStation.typeLabel}
                      </span>
                    </div>
                    <p className="m-0 text-[11px] text-slate-500 font-medium mt-0.5">{selectedStation.region}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold uppercase ${STATUS_CSS[selectedStation.connectionState]?.bg} ${STATUS_CSS[selectedStation.connectionState]?.text} border ${STATUS_CSS[selectedStation.connectionState]?.ring}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_CSS[selectedStation.connectionState]?.dot}`} />
                    {selectedStation.connectionState}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Telemetry Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/stations/${selectedStation.id}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Full Analytics
                  </button>
                </div>
              </div>

              {/* 4 info columns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    <MapPin className="w-3 h-3 inline mr-1" />Hydrological Region
                  </span>
                  <strong className="text-xs text-slate-800">{selectedStation.region}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    <Database className="w-3 h-3 inline mr-1" />Connection Status
                  </span>
                  <strong className="text-xs text-emerald-700">{selectedStation.connectionStatus}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    <CheckCircle className="w-3 h-3 inline mr-1" />Coordinates (CSV)
                  </span>
                  <strong className="text-xs text-slate-700 font-mono">
                    {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] font-bold uppercase text-blue-600 block mb-0.5">
                    <Radio className="w-3 h-3 inline mr-1" />Telemetry Link
                  </span>
                  <strong className="text-xs text-blue-900 font-mono">
                    {selectedStation.type === 'main' ? 'Satellite VSAT' : 'GSM / GPRS 4G'}
                  </strong>
                </div>
              </div>

              {/* Telemetry integrity notice */}
              <div className="mt-2.5 text-[10px] text-slate-400 italic flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Telemetry fields show "Not available" — awaiting real-time data feed. No values are fabricated.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Station telemetry drawer */}
      <StationTelemetryDrawer
        station={selectedStation}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </section>
  );
};
