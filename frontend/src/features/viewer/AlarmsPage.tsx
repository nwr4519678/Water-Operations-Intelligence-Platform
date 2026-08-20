import { useMemo, useState } from 'react';
import { alarms, stations } from './data';

export function AlarmsPage() {
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      alarms.filter(
        (alarm) =>
          (severity === 'all' || alarm.severity === severity) &&
          `${alarm.title} ${alarm.stationId}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, severity],
  );
  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ALERT HISTORY</span>
          <h1>Alarms</h1>
          <p>Review severity, station context, and telemetry links.</p>
        </div>
        <span className="status-badge status-badge--critical">{filtered.length} active</span>
      </div>
      <section className="panel">
        <div className="filter-row">
          <input
            aria-label="Search alarms"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search alarms"
          />
          <select
            aria-label="Severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div className="alarm-table">
          {filtered.map((alarm) => {
            const station = stations.find((item) => item.id === alarm.stationId);
            return (
              <article className={`alarm-card alarm-card--${alarm.severity}`} key={alarm.id}>
                <div>
                  <span className="status-badge status-badge--${alarm.severity}">
                    {alarm.severity}
                  </span>
                  <h2>{alarm.title}</h2>
                  <p>{alarm.message}</p>
                </div>
                <div className="alarm-meta">
                  <b>{alarm.stationId}</b>
                  <span>{station?.name}</span>
                  <time>{new Date(alarm.createdAt).toLocaleTimeString()}</time>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <p className="muted">No alarms match the selected filters.</p>}
      </section>
    </div>
  );
}
