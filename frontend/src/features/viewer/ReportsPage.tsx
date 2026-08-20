import { useMemo, useState } from 'react';

const reports = [
  {
    id: 'RPT-2026-0819',
    title: 'Daily network health summary',
    type: 'Daily',
    created: 'Aug 19, 2026',
    freshness: 'Fresh',
    summary: 'Network availability and critical alarm summary.',
  },
  {
    id: 'RPT-2026-0818',
    title: 'Water quality review',
    type: 'Quality',
    created: 'Aug 18, 2026',
    freshness: 'Fresh',
    summary: 'Quality score trends across treatment stations.',
  },
  {
    id: 'RPT-2026-0815',
    title: 'Weekly telemetry digest',
    type: 'Weekly',
    created: 'Aug 15, 2026',
    freshness: 'Stale',
    summary: 'Seven-day levels, flow, pressure, and data quality.',
  },
];

export function ReportsPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(reports[0].id);
  const visible = useMemo(
    () =>
      reports.filter((report) =>
        `${report.title} ${report.type}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  const report = reports.find((item) => item.id === selected) ?? reports[0];
  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">READ-ONLY REPORTS</span>
          <h1>Reports</h1>
          <p>Review generated reports and their freshness metadata.</p>
        </div>
      </div>
      <div className="reports-layout">
        <section className="panel">
          <input
            className="report-search"
            aria-label="Search reports"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reports"
          />
          <div className="report-list">
            {visible.map((item) => (
              <button
                key={item.id}
                className={`report-list-item ${selected === item.id ? 'is-selected' : ''}`}
                onClick={() => setSelected(item.id)}
              >
                <b>{item.title}</b>
                <small>
                  {item.type} · {item.created}
                </small>
                <span
                  className={`status-badge status-badge--${item.freshness === 'Fresh' ? 'healthy' : 'attention'}`}
                >
                  {item.freshness}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="panel report-detail">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REPORT DETAIL</span>
              <h2>{report.title}</h2>
            </div>
            <span className="status-badge status-badge--healthy">Read-only</span>
          </div>
          <p>{report.summary}</p>
          <div className="report-summary">
            <div>
              <span>Report ID</span>
              <b>{report.id}</b>
            </div>
            <div>
              <span>Created</span>
              <b>{report.created}</b>
            </div>
            <div>
              <span>Coverage</span>
              <b>124 stations</b>
            </div>
            <div>
              <span>Freshness</span>
              <b>{report.freshness}</b>
            </div>
          </div>
          <div className="report-placeholder">
            <h3>Summary preview</h3>
            <p>
              Charts and tables for this report are available in the immutable viewer. Export and
              edit controls are intentionally unavailable to Viewer sessions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
