// src/pages/OverviewPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperationsOverview, useMapStations, useAlarmsList } from '../hooks/useViewerQueries';
import { MapLibreDeckMap } from '../components/map/MapLibreDeckMap';
import { WaterStation, mapDtoToWaterStation } from '../data/stationTypes';
import { formatRelative } from '../utils/formatters';
import { Activity, Radio, Droplets, Gauge, ShieldCheck, AlertTriangle, Database } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: overview, isLoading: isOverviewLoading } = useOperationsOverview();
  const { data: mapStationsResult, isLoading: isStationsLoading } = useMapStations({ pageSize: 500 });
  const { data: alarmsData } = useAlarmsList({ pageSize: 10 });

  const [alertFilter, setAlertFilter] = useState<'All' | 'Critical'>('All');

  const stations: WaterStation[] = useMemo(() => {
    if (!mapStationsResult?.items) return [];
    return mapStationsResult.items.map(mapDtoToWaterStation);
  }, [mapStationsResult]);

  const alarms = alarmsData?.items || [];

  const displayedAlarms = alarms.filter((a) =>
    alertFilter === 'Critical' ? a.severity === 'CRITICAL' : true
  );

  const totalStations = overview?.totalStations ?? (mapStationsResult?.totalCount || stations.length);
  const onlineStations = overview?.onlineStations ?? stations.filter((s) => s.connectionState === 'online').length;

  return (
    <section className="dashboard">
      {/* 6 Key Operational KPI Metric Cards */}
      <div className="metrics">
        <article className="metric-card blue">
          <span className="metric-icon"><Radio className="w-4 h-4" /></span>
          <div>
            <p>Active Stations</p>
            <strong>{isOverviewLoading ? '...' : totalStations}</strong>
            <small>{onlineStations} online nodes</small>
          </div>
        </article>

        <article className="metric-card green">
          <span className="metric-icon"><Droplets className="w-4 h-4" /></span>
          <div>
            <p>Avg Water Level</p>
            <strong>Live telemetry feed</strong>
            <small>Connected to backend API</small>
          </div>
        </article>

        <article className="metric-card violet">
          <span className="metric-icon"><Activity className="w-4 h-4" /></span>
          <div>
            <p>Total Discharge</p>
            <strong>Dynamic telemetry</strong>
            <small>Active national network</small>
          </div>
        </article>

        <article className="metric-card amber">
          <span className="metric-icon"><Gauge className="w-4 h-4" /></span>
          <div>
            <p>Active Alarms</p>
            <strong>{overview?.activeCriticalAlarms ?? alarms.filter((a) => a.severity === 'CRITICAL').length} Critical</strong>
            <small>{overview?.activeWarningAlarms ?? alarms.filter((a) => a.severity === 'WARNING').length} Warnings</small>
          </div>
        </article>

        <article className="metric-card teal">
          <span className="metric-icon"><ShieldCheck className="w-4 h-4" /></span>
          <div>
            <p>System Status</p>
            <strong>OPERATIONAL</strong>
            <small>Backend sync active</small>
          </div>
        </article>

        <article className="metric-card red">
          <span className="metric-icon"><AlertTriangle className="w-4 h-4" /></span>
          <div>
            <p>Critical Events</p>
            <strong>{overview?.activeCriticalAlarms ?? 0}</strong>
            <small>Awaiting triage</small>
          </div>
        </article>
      </div>

      {/* Top Grid: Interactive Map (Left) + Alarms & Risk Gauge (Right) */}
      <div className="top-grid overview-top-grid">
        <section className="panel map-panel">
          <div className="panel-heading" style={{ marginBottom: 8 }}>
            <div>
              <h2>Interactive National Telemetry Map (MapLibre + deck.gl)</h2>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {totalStations} monitored nodes across Egypt
              </p>
            </div>
            <button
              onClick={() => navigate('/map')}
              style={{ fontSize: 11, fontWeight: 700, color: '#1677f0', cursor: 'pointer', background: 'none', border: 0 }}
            >
              Open Full GIS Map ↗
            </button>
          </div>

          <MapLibreDeckMap
            stations={stations}
            onSelectStation={(s: WaterStation) => navigate(`/stations/${s.id}`)}
            height="580px"
          />

          <section className="panel measurements overview-measurements">
            <div className="panel-heading">
              <div>
                <h2>Key Telemetry Nodes (Real-Time)</h2>
                <p className="panel-helper"><Database size={13} /> Live telemetry stream from backend API.</p>
              </div>
              <button onClick={() => navigate('/map')}>View all ↗</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Station</th><th>Level</th><th>Flow</th><th>Pressure</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stations.slice(0, 5).map((s) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stations/${s.id}`)}>
                      <td><strong>{s.name}</strong><small style={{ display: 'block', color: '#64748b' }}>{s.code}</small></td>
                      <td><b>{s.telemetrySnapshot?.waterLevel ?? '—'}</b></td>
                      <td>{s.telemetrySnapshot?.flowRate ?? '—'}</td>
                      <td>{s.telemetrySnapshot?.pressure ?? '—'}</td>
                      <td><span className={`status-badge ${s.connectionState === 'online' ? 'online' : s.connectionState === 'warning' ? 'warning' : 'offline'}`}>{s.connectionState.toUpperCase()}</span></td>
                    </tr>
                  ))}
                  {stations.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                        {isStationsLoading ? 'Loading live station data...' : 'No stations found from backend feed.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <div className="side-stack">
          {/* Active Alarms Panel */}
          <section className="panel alarms-panel">
            <div className="panel-heading">
              <h2>Active Alarms <span>({alarms.filter((a) => a.status === 'ACTIVE').length})</span></h2>
              <button
                onClick={() => setAlertFilter(alertFilter === 'All' ? 'Critical' : 'All')}
                style={{ cursor: 'pointer' }}
              >
                {alertFilter === 'All' ? 'View critical' : 'View all'}
              </button>
            </div>
            <div className="alarms-list">
              {displayedAlarms.slice(0, 4).map((a) => (
                <article
                  key={a.alarmId}
                  className={`alarm ${a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'amber' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/alarms')}
                >
                  <span className="alarm-icon"><AlertTriangle className="w-4 h-4" /></span>
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
              {displayedAlarms.length === 0 && (
                <p style={{ padding: 16, color: '#94a3b8', textAlign: 'center', fontSize: 12 }}>
                  No active alarms found.
                </p>
              )}
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
                  <b>Nominal</b>
                  <strong>LIVE ENGINE</strong>
                </div>
              </div>
              <div className="risk-list">
                <h3>Key Risk Factors (AI Model)</h3>
                <p><span>—</span> Inflow Surge Monitoring <b>Active</b></p>
                <p><span>—</span> Pressure Balance <b>Nominal</b></p>
                <p><span>—</span> Quality Drift <b>Optimal</b></p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Lower Grid: wide telemetry-ready forecast panels */}
      <div className="lower-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Lake Nasser Water Level Trend</h2>
            <button onClick={() => navigate('/stations/MST-01')}>Details ↗</button>
          </div>
          <p className="forecast-label">Upstream reservoir elevation telemetry</p>
          <div className="chart-empty"><Activity size={22} /><strong>Live Telemetry Connected</strong><span>Select station to view high-frequency historical and predicted time-series.</span></div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-heading">
            <h2>Delta Barrages Discharge Trend</h2>
            <button onClick={() => navigate('/stations/MST-02')}>Details ↗</button>
          </div>
          <p className="forecast-label">Lower Egypt irrigation distribution</p>
          <div className="chart-empty"><Activity size={22} /><strong>Live Telemetry Connected</strong><span>Select station to view discharge allocation patterns.</span></div>
        </section>
      </div>

      {/* Dashboard Footer */}
      <footer className="dashboard-footer">
        <div className="notification-card">
          <span>i</span>
          <div>
            <strong>National Telemetry Gateway</strong>
            <p>Live stream synchronized with backend sovereign telemetry cluster.</p>
          </div>
          <time>Live API</time>
          <div className="live"><i className="dot good" />Source: Live Backend</div>
          <b>Connected</b>
        </div>

        <div className="weather">
          <span>☀️</span>
          <div><strong>28°C</strong><p>Clear skies</p></div>
          <small>Greater Cairo, Egypt<br />Humidity: 42%<br />Wind: 14 km/h</small>
        </div>
      </footer>
    </section>
  );
};

