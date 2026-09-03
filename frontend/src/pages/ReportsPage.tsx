// src/pages/ReportsPage.tsx
import React, { useState, useMemo } from "react"
import { useReportsList } from "../hooks/useReportQueries"
import { ReportCard } from "../components/reports/ReportCard"
import { GenerateReportModal } from "../components/reports/GenerateReportModal"
import {
  FileText,
  Search,
  Plus,
  Filter,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react"

export const ReportsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const { data, isLoading, refetch, isRefetching } = useReportsList({
    reportType: typeFilter === "ALL" ? undefined : typeFilter,
  })

  const rawReports = data?.items || []

  // Filter based on search query
  const filtered = useMemo(() => {
    return rawReports.filter((r) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        r.title?.toLowerCase().includes(q) ||
        r.reportId?.toLowerCase().includes(q) ||
        r.reportType?.toLowerCase().includes(q) ||
        r.format?.toLowerCase().includes(q)
      )
    })
  }, [rawReports, search])

  // Count totals for KPI cards
  const stats = useMemo(() => {
    const total = rawReports.length
    const ready = rawReports.filter((r) => r.status === "READY").length
    const pdfs = rawReports.filter((r) => r.format === "PDF").length
    const excels = rawReports.filter((r) => r.format === "EXCEL").length
    return { total, ready, pdfs, excels }
  }, [rawReports])

  const filterOptions = [
    { key: "ALL", label: "ALL" },
    { key: "STATION_SUMMARY", label: "STATION SUMMARY" },
    { key: "ALARM_SUMMARY", label: "ALARM SUMMARY" },
    { key: "TELEMETRY_EXPORT", label: "TELEMETRY EXPORT" },
  ]

  return (
    <section className="dashboard" style={{ maxWidth: 1600, margin: "0 auto", padding: "20px 24px" }}>
      {/* Top Header & KPI summary */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Operational Reports & Telemetry Audits
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Automated hydraulic balance audits, sensor diagnostic logs, and executive AI briefs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Total Reports</span>
              <strong className="text-base font-extrabold text-slate-900">{stats.total} Published</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Ready to Download</span>
              <strong className="text-base font-extrabold text-emerald-600">{stats.ready} Verified</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">PDF Summaries</span>
              <strong className="text-base font-extrabold text-slate-900">{stats.pdfs} Documents</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Excel & CSV</span>
              <strong className="text-base font-extrabold text-slate-900">{stats.excels} Datasets</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports by title or ID..."
                className="w-64 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {filterOptions.map((opt) => {
                const active = typeFilter === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTypeFilter(opt.key)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-white text-blue-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <b>{filtered.length}</b> reports
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {isLoading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-100 rounded-md" />
                    <div className="h-4 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-5 w-4/5 bg-slate-100 rounded-md" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <div className="h-8 w-28 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No reports found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search
                  ? `No reports match "${search}". Try searching with a different keyword or reset filters.`
                  : "No reports available for this category. You can generate a new report using the button above."}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            /* Grid of Report Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((r) => (
                <ReportCard key={r.reportId} report={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  )
}
