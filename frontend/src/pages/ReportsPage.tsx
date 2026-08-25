// src/pages/ReportsPage.tsx
import React, { useState } from "react"
import { useReportsList } from "../hooks/useReportQueries"
import { ReportCard } from "../components/reports/ReportCard"
import { GenerateReportModal } from "../components/reports/GenerateReportModal"

export const ReportsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const { data } = useReportsList({
    reportType: typeFilter === "ALL" ? undefined : typeFilter,
  })

  const reports = data?.items || []
  const filtered = reports.filter((r) =>
    `${r.title} ${r.reportId} ${r.reportType}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <section className="dashboard">
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="filter-bar">
          <label className="search" style={{ width: 280 }}>
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title or ID..."
            />
          </label>

          <div className="filter-group">
            {[
              "ALL",
              "STATION_SUMMARY",
              "ALARM_SUMMARY",
              "TELEMETRY_EXPORT",
            ].map((t) => (
              <button
                key={t}
                type="button"
                className={`filter-chip ${typeFilter === t ? "active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              background: "#1677f0",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Generate Report
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
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
  )
}
