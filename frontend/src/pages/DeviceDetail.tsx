import { useState } from 'react'
import { Battery, Cloud, Database, Download, Radio, Settings2, Signal, TriangleAlert } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { TelemetryChart } from '../components/charts/TelemetryChart'
import { LevelGauge } from '../components/gauges/LevelGauge'
import { AiInsights } from '../components/ui/AiInsights'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useTelemetry } from '../hooks/useTelemetry'
import { getStation } from '../services/mockData'
import { exportTelemetryCsv } from '../services/exportService'

type StationTab = 'real-time' | 'historical' | 'soh' | 'settings'
const tabLabels: Record<StationTab, string> = { 'real-time': 'Real time', historical: 'Historical', soh: 'SOH', settings: 'Settings' }

function HealthItem({ icon: Icon, label, value, healthy = true }: { icon: typeof Cloud; label: string; value: string; healthy?: boolean }) { return <div className="health-item"><span className={healthy ? 'health-icon good' : 'health-icon warning'}><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></div> }

export function DeviceDetail() {
  const { id } = useParams()
  const station = getStation(id ?? '')
  const [tab, setTab] = useState<StationTab>('real-time')
  const telemetry = useTelemetry(station?.id ?? 'meri-demo')
  if (!station) return <Navigate to="/devices" replace />
  const latest = telemetry.at(-1) ?? telemetry[0]
  return <><section className={`station-hero ${station.bannerTone}`}><div className="station-hero-overlay" /><div className="station-hero-content"><div><p>{station.type}</p><h1>{station.name}</h1><span>{station.location} · {station.locationAr}</span></div><div className="hero-right"><StatusBadge status={station.status} /><span><Radio size={15} /> {station.lastSeen}</span></div></div></section><section className="station-shell"><div className="station-tabs" role="tablist">{(Object.keys(tabLabels) as StationTab[]).map((key) => <button role="tab" aria-selected={tab === key} key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{tabLabels[key]}</button>)}</div><div className="health-strip"><HealthItem icon={Cloud} label="Cloud sync" value={station.cloudSync ? 'Synced' : 'Delayed'} healthy={station.cloudSync} /><HealthItem icon={Battery} label="Battery" value={`${station.battery}%`} healthy={station.battery >= 70} /><HealthItem icon={Signal} label="Cellular signal" value={`${station.signal}/4 bars`} /><HealthItem icon={Database} label="SD card" value={`${station.storage}% used`} healthy={station.storage < 80} /></div>{tab === 'real-time' && <div className="station-main"><section className="real-time-panel panel"><div className="panel-header"><div><p className="section-kicker">LIVE TELEMETRY</p><h2>Real-time Tide Gauge</h2><span>Simulated polling updates every 2.5 seconds</span></div><button type="button" className="button-secondary" onClick={() => exportTelemetryCsv(`${station.name.replaceAll(' ', '_')}_live.csv`, telemetry)}><Download size={17} /> Export CSV</button></div><div className="gauges-grid"><LevelGauge label="Up Stream Level" value={latest.upstream} updatedAt={latest.label} /><LevelGauge label="Down Stream Level" value={latest.downstream} updatedAt={latest.label} trend="down" /></div></section><AiInsights stationName={station.name} /></div>}{tab === 'historical' && <TelemetryChart stationName={station.name} telemetry={telemetry} threshold={station.id === 'meri-demo' ? 14.1 : 4.7} />}{tab === 'soh' && <section className="soh-panel panel"><div className="panel-header"><div><p className="section-kicker">STATE OF HEALTH</p><h2>Device operation health</h2><span>Read-only diagnostic indicators from the latest device heartbeat.</span></div></div><div className="soh-grid"><div><span>Network availability</span><strong>{station.signal >= 3 ? '99.8%' : '96.4%'}</strong><i className="progress"><b style={{ width: station.signal >= 3 ? '99.8%' : '96.4%' }} /></i></div><div><span>Battery health</span><strong>{station.battery}%</strong><i className="progress"><b style={{ width: `${station.battery}%` }} /></i></div><div><span>Storage free space</span><strong>{100 - station.storage}%</strong><i className="progress"><b style={{ width: `${100 - station.storage}%` }} /></i></div></div><div className="soh-note"><TriangleAlert size={18} /> All indicators are read-only. No remote changes can be made from this viewer role.</div></section>}{tab === 'settings' && <section className="settings-view panel"><Settings2 size={25} /><h2>Viewer-only settings</h2><p>Station configuration is visible to administrators only. This viewer session can inspect device health, telemetry and generated reports without changing thresholds or hardware settings.</p></section>}</section></>
}
