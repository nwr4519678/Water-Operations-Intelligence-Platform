import { alarms, stations, trend } from './data';

function MetricCard({ label, value, detail, tone = 'accent' }: { label: string; value: string; detail: string; tone?: string }) {
  return <article className={`metric-card metric-card--${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function TrendChart() {
  const points = trend.map((value, index) => `${index * 9},${48 - value * 10}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 100 52" role="img" aria-label="Seven day water level trend"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

export function OverviewPage() {
  const active = stations.filter((station) => station.status !== 'offline').length;
  return <div className="dashboard-page">
    <div className="page-heading"><div><span className="eyebrow">VIEWER OVERVIEW</span><h1>Network overview</h1><p>Read-only water telemetry across the monitored network.</p></div><span className="live-indicator">● Live · 10:41:58 AM</span></div>
    <div className="metric-grid">
      <MetricCard label="Total stations" value="124" detail="↗ 8 this month" />
      <MetricCard label="Active stations" value={`${active + 108}`} detail="90.3% online" tone="healthy" />
      <MetricCard label="Avg. water level" value="2.45 m" detail="↗ 0.15 m" tone="purple" />
      <MetricCard label="Total flow rate" value="18.6 m³/s" detail="↗ 6.2%" tone="warning" />
      <MetricCard label="Water quality" value="Good" detail="92 / 100" tone="healthy" />
      <MetricCard label="Active alarms" value={String(alarms.length + 8)} detail="View alert history" tone="critical" />
    </div>
    <div className="dashboard-grid">
      <section className="panel panel--wide"><div className="panel-heading"><h2>Network map</h2><span className="muted">{stations.length} focus stations</span></div><div className="network-map" aria-label="Schematic network map" role="img">{stations.map((station, index) => <span key={station.id} className={`map-node map-node--${station.status}`} style={{ left: `${18 + index * 17}%`, top: `${28 + (index % 3) * 22}%` }} title={station.name}>{station.id}</span>)}<div className="map-line map-line--one" /><div className="map-line map-line--two" /><div className="map-legend"><span>● Normal</span><span>● Warning</span><span>● Offline</span></div></div></section>
      <section className="panel"><div className="panel-heading"><h2>Alarms ({alarms.length + 8})</h2><a href="/alarms">View all</a></div><div className="alarm-list">{alarms.map((alarm) => <div className={`alarm-row alarm-row--${alarm.severity}`} key={alarm.id}><b>{alarm.title}</b><span>{alarm.stationId} · {alarm.severity}</span></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><h2>Live measurements</h2><a href="/map">View all</a></div><div className="table-wrap"><table><thead><tr><th>Station</th><th>Level</th><th>Flow</th><th>Status</th></tr></thead><tbody>{stations.slice(0, 4).map((station) => <tr key={station.id}><td><b>{station.id}</b><small>{station.name}</small></td><td>{station.waterLevelMeters.toFixed(2)} m</td><td>{station.flowRateLitresPerSecond || '—'}</td><td><span className={`status-badge status-badge--${station.status}`}>{station.status}</span></td></tr>)}</tbody></table></div></section>
      <section className="panel"><div className="panel-heading"><h2>Water level trend</h2><span className="muted">7 days</span></div><div className="chart-card"><TrendChart /><div className="chart-axis"><span>May 10</span><span>May 16</span></div></div></section>
      <section className="panel"><div className="panel-heading"><h2>AI risk overview</h2><a href="/ai-insights">View analysis</a></div><div className="risk-score"><strong>68</strong><span>/100 · Medium risk</span></div><ul className="risk-list"><li>High water level <b>72</b></li><li>Aging infrastructure <b>65</b></li><li>Flow variability <b>58</b></li></ul></section>
    </div>
  </div>;
}
