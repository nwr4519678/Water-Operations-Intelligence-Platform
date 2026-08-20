import { alarms, stations, trend } from './data';

const kpis = [
  { label: 'Total stations', value: '124', detail: '↗ 8 this month', icon: '⌁', tone: 'blue' },
  { label: 'Active stations', value: '112', detail: '90.3% online', icon: '♢', tone: 'green' },
  { label: 'Avg. water level', value: '2.45 m', detail: '↗ 0.15 m', icon: '≋', tone: 'purple' },
  { label: 'Total flow rate', value: '18.6 m³/s', detail: '↗ 6.2%', icon: '→', tone: 'yellow' },
  { label: 'Water quality', value: 'Good', detail: '92 / 100', icon: '◇', tone: 'teal' },
  { label: 'Active alarms', value: '12', detail: 'View all', icon: '♧', tone: 'red' },
];

function MetricCard({ label, value, detail, icon, tone }: (typeof kpis)[number]) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function TrendChart() {
  const points = trend.map((value, index) => `${index * 9},${48 - value * 10}`).join(' ');
  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 52"
      role="img"
      aria-label="Seven day water level trend"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={trend.map((value, index) => `${index * 9},${50 - value * 6}`).join(' ')}
        fill="none"
        stroke="var(--chart-secondary)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ForecastChart() {
  return (
    <svg
      className="forecast-chart"
      viewBox="0 0 100 52"
      preserveAspectRatio="none"
      role="img"
      aria-label="48 hour water level forecast"
    >
      <path
        d="M0 39 C15 37 18 29 29 32 S48 21 62 24 S81 16 100 21 L100 39 C82 32 70 40 58 35 S38 41 27 38 S12 45 0 43 Z"
        fill="var(--forecast-fill)"
      />
      <path
        d="M0 41 C15 39 18 32 29 34 S48 26 62 28 S81 20 100 25"
        fill="none"
        stroke="var(--color-accent-primary)"
        strokeWidth="1.7"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0 35 C15 32 18 25 29 28 S48 18 62 21 S81 13 100 17"
        fill="none"
        stroke="var(--color-accent-primary)"
        strokeDasharray="3 3"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function NetworkMap() {
  return (
    <div
      className="network-map network-map--dashboard"
      aria-label="Schematic network map"
      role="img"
    >
      <div className="map-river" />
      <div className="map-roads map-roads--one" />
      <div className="map-roads map-roads--two" />
      {stations.map((station, index) => (
        <span
          key={station.id}
          className={`map-node map-node--${station.status}`}
          style={{ left: `${18 + index * 17}%`, top: `${28 + (index % 3) * 22}%` }}
          title={station.name}
        >
          {station.id}
        </span>
      ))}
      <div className="map-legend">
        <span>
          <i className="legend-dot legend-dot--healthy" />
          Normal
        </span>
        <span>
          <i className="legend-dot legend-dot--attention" />
          Warning
        </span>
        <span>
          <i className="legend-dot legend-dot--offline" />
          Offline
        </span>
      </div>
      <div className="map-layers">
        <b>Layers</b>
        <label>
          Stations <input type="checkbox" defaultChecked />
        </label>
        <label>
          Pipelines <input type="checkbox" defaultChecked />
        </label>
        <label>
          Reservoirs <input type="checkbox" defaultChecked />
        </label>
        <label>
          Districts <input type="checkbox" />
        </label>
      </div>
      <div className="map-tooltip">
        <b>
          Station: <em>ST-045</em>
        </b>
        <span className="online-pill">Online</span>
        <dl>
          <dt>Water level</dt>
          <dd>2.85 m</dd>
          <dt>Flow rate</dt>
          <dd>320 L/s</dd>
          <dt>Pressure</dt>
          <dd>4.2 bar</dd>
          <dt>Quality</dt>
          <dd className="quality-good">Good</dd>
        </dl>
        <a href="/stations">View details →</a>
      </div>
      <div className="map-controls">
        <button aria-label="Zoom in">+</button>
        <button aria-label="Zoom out">−</button>
        <button aria-label="Toggle map layers">≡</button>
      </div>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">VIEWER OVERVIEW</span>
          <h1>Overview</h1>
          <p>Real-time water network overview</p>
        </div>
        <span className="live-indicator">
          <i /> Last data update: 10:41:58 AM
        </span>
      </div>
      <div className="metric-grid">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>
      <div className="dashboard-grid dashboard-grid--reference">
        <section className="panel map-panel">
          <div className="panel-heading">
            <h2>Network Map</h2>
            <span className="muted">5 focus stations</span>
          </div>
          <NetworkMap />
        </section>
        <section className="panel alarms-panel">
          <div className="panel-heading">
            <h2>Alarms (12)</h2>
            <a href="/alarms">View all</a>
          </div>
          <div className="alarm-list">
            {alarms.map((alarm) => (
              <div className={`alarm-row alarm-row--${alarm.severity}`} key={alarm.id}>
                <span className="alarm-symbol">{alarm.severity === 'critical' ? '△' : '⚠'}</span>
                <div>
                  <b>{alarm.title}</b>
                  <span>
                    {alarm.stationId} ·{' '}
                    {stations.find((station) => station.id === alarm.stationId)?.name}
                  </span>
                </div>
                <time>
                  {new Date(alarm.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                <strong>{alarm.severity}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel measurements-panel">
          <div className="panel-heading">
            <h2>Real-time Measurements</h2>
            <a href="/map">View all</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Water Level (m)</th>
                  <th>Flow Rate (L/s)</th>
                  <th>Pressure (bar)</th>
                  <th>Quality</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id}>
                    <td>
                      <b>{station.id}</b>
                      <small>{station.name}</small>
                    </td>
                    <td
                      className={station.status === 'offline' ? 'value-negative' : 'value-positive'}
                    >
                      {station.waterLevelMeters.toFixed(2)} {station.status === 'attention' && '↑'}
                    </td>
                    <td>{station.flowRateLitresPerSecond || '—'}</td>
                    <td>{station.pressureBar}</td>
                    <td className={`quality-${station.quality}`}>
                      {station.quality === 'fair' ? 'Fair' : 'Good'}
                    </td>
                    <td>
                      <i className={`table-status table-status--${station.status}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel trend-panel">
          <div className="panel-heading">
            <h2>Water Level Trend (7 Days)</h2>
            <select defaultValue="all" aria-label="Trend station">
              <option value="all">All Stations</option>
            </select>
          </div>
          <div className="chart-label">Water level (m)</div>
          <TrendChart />
          <div className="chart-axis">
            <span>May 10</span>
            <span>May 12</span>
            <span>May 14</span>
            <span>May 16</span>
          </div>
          <div className="chart-legend">
            <span className="legend-line legend-line--blue">ST-045</span>
            <span className="legend-line legend-line--green">ST-078</span>
            <span className="legend-line legend-line--purple">ST-031</span>
          </div>
        </section>
        <section className="panel risk-panel">
          <div className="panel-heading">
            <h2>AI Risk Overview</h2>
            <a href="/ai-insights">View full analysis</a>
          </div>
          <div className="risk-content">
            <div className="risk-gauge">
              <div>
                <strong>68</strong>
                <span>/100</span>
              </div>
              <b>Medium Risk</b>
            </div>
            <div className="risk-factors">
              <h3>Top Risk Factors</h3>
              <ul>
                <li>
                  <i className="legend-dot legend-dot--critical" />
                  High Water Level <b>72</b>
                </li>
                <li>
                  <i className="legend-dot legend-dot--warning" />
                  Aging Infrastructure <b>65</b>
                </li>
                <li>
                  <i className="legend-dot legend-dot--yellow" />
                  Flow Variability <b>58</b>
                </li>
                <li>
                  <i className="legend-dot legend-dot--teal" />
                  Water Quality Trend <b>45</b>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section className="panel forecast-panel">
          <div className="panel-heading">
            <h2>AI Forecast (Next 48 Hours)</h2>
            <a href="/ai-insights">View details</a>
          </div>
          <div className="chart-label">Forecast: Water level (m)</div>
          <ForecastChart />
          <div className="chart-axis">
            <span>Now</span>
            <span>+12h</span>
            <span>+24h</span>
            <span>+36h</span>
            <span>+48h</span>
          </div>
          <div className="chart-legend">
            <span className="legend-line legend-line--blue">Prediction</span>
            <span className="legend-line legend-line--dashed">Confidence interval</span>
          </div>
        </section>
      </div>
      <div className="dashboard-footer-grid">
        <section className="panel notification-strip">
          <span className="info-symbol">i</span>
          <div>
            <b>System Notifications</b>
            <span>Data import completed successfully</span>
          </div>
          <small>2 min ago</small>
          <span className="sync-status">
            <i /> Last Data Update: 10:41:58 AM · Live
          </span>
        </section>
        <section className="panel weather-card">
          <span className="weather-icon">☼</span>
          <div>
            <strong>24°C</strong>
            <span>Partly Cloudy</span>
          </div>
          <div className="weather-meta">
            <b>Cairo, Egypt</b>
            <span>Humidity: 45%</span>
            <span>Wind: 12 km/h</span>
          </div>
        </section>
      </div>
    </div>
  );
}
