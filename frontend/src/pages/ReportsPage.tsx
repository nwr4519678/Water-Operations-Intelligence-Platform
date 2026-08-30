// src/pages/ReportsPage.tsx
import React, { useState } from 'react';
import { useReportsList } from '../hooks/useReportQueries';
import { ReportCard } from '../components/reports/ReportCard';
import { GenerateReportModal } from '../components/reports/GenerateReportModal';
import { FileText, ShieldCheck, Clock3, Plus, Search } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data } = useReportsList({
    reportType: typeFilter === 'ALL' ? undefined : typeFilter,
  });

  const reports = data?.items || [];
  const filtered = reports.filter((r) =>
    `${r.title} ${r.reportId} ${r.reportType}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="dashboard reports-command-page">
      <div className="reports-hero"><div><span className="eyebrow">Document control / MWRI</span><h2>Reports Command Center</h2><p>Generate, review and export controlled telemetry documents for national operations.</p></div><div className="reports-hero-actions"><span><ShieldCheck size={15}/> Audit-ready workspace</span><button type="button" onClick={() => setModalOpen(true)}><Plus size={15}/> Generate report</button></div></div>
      <div className="reports-summary"><div><FileText size={17}/><span><strong>{reports.length}</strong><small>Generated reports</small></span></div><div><ShieldCheck size={17}/><span><strong>{reports.filter((r) => r.status === 'READY').length}</strong><small>Ready to distribute</small></span></div><div><Clock3 size={17}/><span><strong>Live</strong><small>Registry synchronization</small></span></div></div>
      <div className="panel reports-surface" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="filter-bar">
          <label className="search reports-search" style={{ width: 280 }}>
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title or ID..."
            />
          </label>

          <div className="filter-group">
            {['ALL', 'STATION_SUMMARY', 'ALARM_SUMMARY', 'TELEMETRY_EXPORT'].map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-chip ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              background: '#1677f0',
              color: '#fff',
              border: 0,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Generate Report
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map((r) => (
              <ReportCard key={r.reportId} report={r} />
            ))}
          </div>
        </div>
      </div>

      <GenerateReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
};
