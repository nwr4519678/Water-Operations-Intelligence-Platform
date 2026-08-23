// src/pages/MapPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStations } from '../hooks/useViewerQueries';
import { StationMap } from '../components/map/StationMap';
import { useUiStore } from '../store/uiStore';
import { allZonesList } from '../data/stationsData';
import { Activity, Radio, MapPin, ArrowUpRight, ShieldCheck, Gauge } from 'lucide-react';

export const MapPage: React.FC = () => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>('MST-01');
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'online' | 'warning' | 'offline'>('All');

  const mapLanguage = useUiStore((state) => state.mapLanguage);
  const setMapLanguage = useUiStore((state) => state.setMapLanguage);
  const isAr = mapLanguage === 'ar';

  const { data: mapData } = useMapStations({ pageSize: 500 });
  const stations = mapData?.items || [];
  const navigate = useNavigate();

  // Bilingual search across 410 stations
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      const matchSearch =
        !q ||
        `${s.stationCode} ${s.name} ${s.nameAr || ''} ${s.nameEn || ''} ${s.zoneEn || ''} ${s.zoneAr || ''}`
          .toLowerCase()
          .includes(q);

      let matchZone = true;
      if (selectedZone !== 'all') {
        const zoneObj = allZonesList.find((z) => z.id === selectedZone);
        if (zoneObj) {
          matchZone =
            (s.zoneEn || '').toLowerCase().includes(zoneObj.nameEn.toLowerCase()) ||
            (s.zoneAr || '').includes(zoneObj.nameAr);
        }
      }

      const statusKey = s.status === 'ONLINE' ? 'online' : s.status === 'MAINTENANCE' ? 'warning' : 'offline';
      const matchStatus = selectedStatus === 'All' || statusKey === selectedStatus;

      return matchSearch && matchZone && matchStatus;
    });
  }, [stations, search, selectedZone, selectedStatus]);

  const sel = useMemo(
    () => stations.find((s) => s.stationId === selectedStationId) || filtered[0] || stations[0],
    [stations, selectedStationId, filtered]
  );

  const counts = useMemo(
    () => ({
      total: stations.length,
      online: stations.filter((s) => s.status === 'ONLINE').length,
      warning: stations.filter((s) => s.status === 'MAINTENANCE').length,
      offline: stations.filter((s) => s.status === 'OFFLINE').length,
    }),
    [stations]
  );

  return (
    <section className="dashboard">
      <div className="map-page-grid">
        {/* Station Sidebar (Pure Search & Full-Height Scrollable List) */}
        <aside className="station-sidebar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          {/* Dual-Language Toggle Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🌐</span>
              <span>{isAr ? 'لغة عرض المحطات:' : 'Station Info Language:'}</span>
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: 2, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setMapLanguage('en')}
                style={{
                  fontSize: 12,
                  padding: '3px 9px',
                  borderRadius: 4,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 0,
                  background: mapLanguage === 'en' ? '#1677f0' : 'transparent',
                  color: mapLanguage === 'en' ? '#ffffff' : '#475569',
                }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setMapLanguage('ar')}
                style={{
                  fontSize: 12,
                  padding: '3px 9px',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontFamily: 'Noto Kufi Arabic, sans-serif',
                  cursor: 'pointer',
                  border: 0,
                  background: mapLanguage === 'ar' ? '#1677f0' : 'transparent',
                  color: mapLanguage === 'ar' ? '#ffffff' : '#475569',
                }}
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
              placeholder={isAr ? 'ابحث بالعربية أو الإنجليزية (مثل: RTU, السد العالي, Delta)...' : 'Search by ID, English/Arabic name, or sector…'}
              dir="auto"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ border: 0, background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Counts Pill Filter */}
          <div className="station-counts">
            <button
              type="button"
              className={`sc ${selectedStatus === 'All' ? 'font-bold underline' : ''}`}
              style={{ cursor: 'pointer', border: 0, background: '#e2e8f0', color: '#334155' }}
              onClick={() => setSelectedStatus('All')}
            >
              {counts.total} {isAr ? 'الكل' : 'Total'}
            </button>
            <button
              type="button"
              className={`sc online ${selectedStatus === 'online' ? 'ring-1 ring-emerald-500 font-bold' : ''}`}
              style={{ cursor: 'pointer', border: 0 }}
              onClick={() => setSelectedStatus(selectedStatus === 'online' ? 'All' : 'online')}
            >
              {counts.online} {isAr ? 'متصلة' : 'Online'}
            </button>
            <button
              type="button"
              className={`sc warning ${selectedStatus === 'warning' ? 'ring-1 ring-amber-500 font-bold' : ''}`}
              style={{ cursor: 'pointer', border: 0 }}
              onClick={() => setSelectedStatus(selectedStatus === 'warning' ? 'All' : 'warning')}
            >
              {counts.warning} {isAr ? 'تنبيه' : 'Alert'}
            </button>
            <button
              type="button"
              className={`sc offline ${selectedStatus === 'offline' ? 'ring-1 ring-slate-500 font-bold' : ''}`}
              style={{ cursor: 'pointer', border: 0 }}
              onClick={() => setSelectedStatus(selectedStatus === 'offline' ? 'All' : 'offline')}
            >
              {counts.offline} {isAr ? 'غير متصلة' : 'Offline'}
            </button>
          </div>

          {/* Scrollable Station List (Full height without bottom obstruction) */}
          <div className="station-list-scroll" style={{ flex: 1 }}>
            {filtered.map((s) => {
              const isSelected = s.stationId === (sel?.stationId || selectedStationId);
              const name = isAr ? s.nameAr || s.name : s.nameEn || s.name;
              const zone = isAr ? s.zoneAr || s.regionId : s.zoneEn || s.regionId;
              const statusClass = s.status === 'ONLINE' ? 'good' : s.status === 'MAINTENANCE' ? 'warning' : 'offline';

              return (
                <div
                  key={s.stationId}
                  className={`station-list-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedStationId(s.stationId)}
                >
                  <i className={`dot ${statusClass}`} />
                  <div>
                    <strong>{s.stationCode} — {name}</strong>
                    <p>{zone}</p>
                  </div>
                  <small>
                    {s.currentWaterLevel ?? '—'} m
                  </small>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Map Canvas + Selected Station Inspection Card Below */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Map Container Panel */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="panel-heading" style={{ marginBottom: 10 }}>
              <div>
                <h2>National Network Map — {stations.length} Telemetry Nodes</h2>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  Dynamic MarkerCluster spatial telemetry across all Egyptian basins
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="select"
                  style={{ cursor: 'pointer', background: '#fff' }}
                >
                  <option value="all">{isAr ? 'كافة المناطق الهيدرولوجية' : 'All Hydrological Regions'}</option>
                  {allZonesList.map((z) => (
                    <option key={z.id} value={z.id}>
                      {isAr ? z.nameAr : z.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <StationMap
              stations={filtered}
              selectedStationId={selectedStationId}
              onSelectStation={(s) => setSelectedStationId(s.stationId)}
              language={mapLanguage}
              height="510px"
            />
          </div>

          {/* Spacious Horizontal Station Telemetry Inspection Card Under the Map */}
          {sel && (
            <div className="panel" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#1677f0', border: '1px solid #bfdbfe' }}>
                    {sel.stationCode}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {isAr ? sel.nameAr || sel.name : sel.nameEn || sel.name}
                      </h3>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                        {sel.category === 'hq'
                          ? (isAr ? 'المقر القومي' : 'HQ Operations Center')
                          : sel.category === 'master'
                          ? (isAr ? 'محطة رئيسية استراتيجية' : 'Strategic Master Station')
                          : (isAr ? 'محطة رصد حقلية' : 'Field Telemetry RTU')}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                      {isAr ? sel.nameEn || sel.name : sel.nameAr || sel.name}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <em className={`status-badge ${sel.status === 'ONLINE' ? 'online' : sel.status === 'MAINTENANCE' ? 'warning' : 'offline'}`} style={{ fontSize: 11, padding: '4px 10px' }}>
                    {sel.status}
                  </em>
                  <button
                    type="button"
                    onClick={() => navigate(`/stations/${sel.stationId}`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      background: '#1677f0',
                      color: '#ffffff',
                      border: 0,
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(22, 119, 240, 0.25)',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#1357cc')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#1677f0')}
                  >
                    <span>{isAr ? 'فتح التحليلات الكاملة للمحطة ↗' : 'Open Full Analytics ↗'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Spacious Metrics Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                    {isAr ? 'المنطقة الهيدرولوجية' : 'Hydrological Region'}
                  </span>
                  <strong style={{ fontSize: 12, color: '#1e293b' }}>
                    {isAr ? sel.zoneAr || sel.regionId : sel.zoneEn || sel.regionId}
                  </strong>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#0284c7', display: 'block', marginBottom: 2 }}>
                    {isAr ? 'منسوب المياه الحقيقي' : 'Live Water Level'}
                  </span>
                  <strong style={{ fontSize: 16, color: '#0369a1', fontFamily: 'monospace' }}>
                    {sel.currentWaterLevel ?? '—'} m
                  </strong>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#16a34a', display: 'block', marginBottom: 2 }}>
                    {isAr ? 'معدل التصرف / التدفق' : 'Discharge Flow Rate'}
                  </span>
                  <strong style={{ fontSize: 16, color: '#15803d', fontFamily: 'monospace' }}>
                    {sel.flowRate ? `${sel.flowRate} ${sel.category === 'hq' || sel.category === 'master' ? 'm³/s' : 'L/s'}` : 'Nominal Flow'}
                  </strong>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#faf5ff', border: '1px solid #f3e8ff' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#9333ea', display: 'block', marginBottom: 2 }}>
                    {isAr ? 'ضغط الخطوط الهيدروليكي' : 'Line Pressure'}
                  </span>
                  <strong style={{ fontSize: 16, color: '#7e22ce', fontFamily: 'monospace' }}>
                    {sel.pressureBar ? `${sel.pressureBar} bar` : '4.2 bar'}
                  </strong>
                </div>

                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                    {isAr ? 'الإحداثيات الجغرافية' : 'Geo Coordinates'}
                  </span>
                  <strong style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                    {sel.latitude.toFixed(4)}° N, {sel.longitude.toFixed(4)}° E
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
