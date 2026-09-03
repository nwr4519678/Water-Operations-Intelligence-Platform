// src/components/reports/GenerateReportModal.tsx
import React, { useState, useEffect, useMemo } from "react"
import { Modal } from "../common/Modal"
import { useCreateReport } from "../../hooks/useReportQueries"
import { useMapStations } from "../../hooks/useViewerQueries"
import { resolveStationLocation } from "../../utils/stationLocationResolver"
import { useUiStore } from "../../store/uiStore"
import {
  FileText,
  FileSpreadsheet,
  Table,
  Calendar,
  Building2,
  CheckCircle2,
  Download,
  AlertTriangle,
  Activity,
  Database,
  RefreshCw,
  MapPin,
  Globe2,
} from "lucide-react"

export const GenerateReportModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("")
  const [selectedStationId, setSelectedStationId] = useState<string>("")
  const [reportType, setReportType] =
    useState<"STATION_SUMMARY" | "ALARM_SUMMARY" | "TELEMETRY_EXPORT">(
      "STATION_SUMMARY",
    )
  const [fileFormat, setFileFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [activePreset, setActivePreset] = useState<number | null>(30)

  const { data: mapStationsData } = useMapStations({ pageSize: 50 })
  const createReportMutation = useCreateReport()
  const addToast = useUiStore((state) => state.addToast)

  // Build the authoritative 19 stations, carrying their TRUE PostgreSQL database GUIDs
  const stations = useMemo(() => {
    const rawItems = mapStationsData?.items || []
    const dahitiItems = rawItems.filter((s) =>
      s.stationCode?.toUpperCase().startsWith("DAHITI-"),
    )

    return dahitiItems.map((s) => {
      const dahitiId = parseInt(s.stationCode.replace(/[^0-9]/g, ""), 10)
      const loc = resolveStationLocation(
        dahitiId,
        s.name,
        Number(s.latitude) || 0,
        Number(s.longitude) || 0,
      )

      return {
        id: s.stationId, // Real PostgreSQL GUID
        code: s.stationCode, // DAHITI-xxxxx
        name: loc.name || s.name, // Authoritative reach name
        region: loc.reachRegion || "Nile River Monitoring Reaches",
      }
    })
  }, [mapStationsData])

  useEffect(() => {
    if (isOpen) {
      applyPreset(30)
    }
  }, [isOpen])

  // Group stations by authoritative basin / reach region
  const groupedStations = useMemo(() => {
    const groups: Record<string, Array<(typeof stations)[number]>> = {}
    for (const s of stations) {
      const region = s.region || "Nile River Monitoring Reaches"
      if (!groups[region]) groups[region] = []
      groups[region].push(s)
    }
    return groups
  }, [stations])

  const chosenStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId),
    [stations, selectedStationId],
  )

  const applyPreset = (days: number) => {
    setActivePreset(days)
    const end = new Date()
    const start = new Date(Date.now() - days * 86400000)
    setDateTo(end.toISOString().split("T")[0])
    setDateFrom(start.toISOString().split("T")[0])
  }

  const handleCustomDateChange = (type: "from" | "to", val: string) => {
    setActivePreset(null)
    if (type === "from") setDateFrom(val)
    else setDateTo(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const reportTitle =
      title.trim() ||
      (chosenStation
        ? `${chosenStation.name} (${chosenStation.code}) · Water Operations Audit`
        : "National Water Operations Telemetry Report")

    try {
      await createReportMutation.mutateAsync({
        title: reportTitle,
        reportType,
        format: fileFormat,
        stationIds: selectedStationId ? [selectedStationId] : undefined,
        fromUtc: dateFrom
          ? new Date(dateFrom).toISOString()
          : new Date(Date.now() - 30 * 86400000).toISOString(),
        toUtc: dateTo
          ? new Date(dateTo).toISOString()
          : new Date().toISOString(),
      })

      addToast({
        type: "success",
        title: "Report Generated",
        message: `Report "${reportTitle}" is ready for download.`,
      })

      setTitle("")
      setSelectedStationId("")
      onClose()
    } catch {
      addToast({
        type: "error",
        title: "Generation Failed",
        message: "Unable to generate the requested report from backend.",
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-none">
              Generate Telemetry &amp; Water Audit Report
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Export verified hydrological observations, alarm logs, and station metrics.
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-900">
        {/* ── 1. Target Station Selector (Resolved Reach Names) ── */}
        <div>
          <label className="font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Station / Hydraulic Facility</span>
            </span>
            <span className="text-[10.5px] font-semibold text-slate-400 font-mono">
              {stations.length} Authoritative Reaches
            </span>
          </label>

          <div className="relative">
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 font-semibold text-slate-900 transition-all cursor-pointer text-xs"
            >
              <option value="">National Network Overview (All 19 Monitoring Reaches)</option>
              {Object.entries(groupedStations).map(([region, stList]) => (
                <optgroup key={region} label={`── ${region} ──`}>
                  {stList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Contextual Information Badge */}
          <div className="mt-1.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
            {chosenStation ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>
                  <strong className="text-slate-800">{chosenStation.name}</strong> ·{" "}
                  <span className="font-mono text-sky-700 font-bold">{chosenStation.code}</span> ·{" "}
                  <span className="text-slate-500">{chosenStation.region}</span>
                </span>
              </>
            ) : (
              <>
                <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Comprehensive scope covering all <strong>19 satellite altimetry reaches</strong> across Egypt's national grid.
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 2. Report Category Selector (Visual Focus Cards) ── */}
        <div>
          <label className="font-bold text-slate-700 block mb-1.5">
            Audit Category &amp; Focus
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Card 1: Station Summary */}
            <button
              type="button"
              onClick={() => setReportType("STATION_SUMMARY")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                reportType === "STATION_SUMMARY"
                  ? "bg-sky-50/80 border-sky-500 text-sky-950 shadow-xs ring-1 ring-sky-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Activity
                  className={`w-4 h-4 ${
                    reportType === "STATION_SUMMARY" ? "text-sky-600" : "text-slate-400"
                  }`}
                />
                {reportType === "STATION_SUMMARY" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                )}
              </div>
              <div className="font-extrabold text-[11.5px] leading-tight">Telemetry Summary</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                Water elevations, storage envelope &amp; sensor trends
              </div>
            </button>

            {/* Card 2: Alarm Summary */}
            <button
              type="button"
              onClick={() => setReportType("ALARM_SUMMARY")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                reportType === "ALARM_SUMMARY"
                  ? "bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    reportType === "ALARM_SUMMARY" ? "text-amber-600" : "text-slate-400"
                  }`}
                />
                {reportType === "ALARM_SUMMARY" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <div className="font-extrabold text-[11.5px] leading-tight">Alarm &amp; Incident Log</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                Breach audit, triage latency &amp; operator actions
              </div>
            </button>

            {/* Card 3: Raw Export */}
            <button
              type="button"
              onClick={() => setReportType("TELEMETRY_EXPORT")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                reportType === "TELEMETRY_EXPORT"
                  ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Database
                  className={`w-4 h-4 ${
                    reportType === "TELEMETRY_EXPORT" ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                {reportType === "TELEMETRY_EXPORT" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className="font-extrabold text-[11.5px] leading-tight">Raw Sensor Export</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                Granular multi-point observations &amp; radar revisits
              </div>
            </button>
          </div>
        </div>

        {/* ── 3. File Format Selector (Visual Segmented Pills) ── */}
        <div>
          <label className="font-bold text-slate-700 block mb-1.5">
            Output File Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* PDF */}
            <button
              type="button"
              onClick={() => setFileFormat("PDF")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                fileFormat === "PDF"
                  ? "bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-xs ring-1 ring-rose-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white font-medium"
              }`}
            >
              <FileText
                className={`w-4 h-4 ${fileFormat === "PDF" ? "text-rose-600" : "text-slate-400"}`}
              />
              <span>PDF Document (.pdf)</span>
            </button>

            {/* Excel */}
            <button
              type="button"
              onClick={() => setFileFormat("EXCEL")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                fileFormat === "EXCEL"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white font-medium"
              }`}
            >
              <FileSpreadsheet
                className={`w-4 h-4 ${
                  fileFormat === "EXCEL" ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <span>Excel (.xlsx)</span>
            </button>

            {/* CSV */}
            <button
              type="button"
              onClick={() => setFileFormat("CSV")}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                fileFormat === "CSV"
                  ? "bg-sky-50 border-sky-500 text-sky-900 font-bold shadow-xs ring-1 ring-sky-500"
                  : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-white font-medium"
              }`}
            >
              <Table
                className={`w-4 h-4 ${fileFormat === "CSV" ? "text-sky-600" : "text-slate-400"}`}
              />
              <span>CSV Data (.csv)</span>
            </button>
          </div>
        </div>

        {/* ── 4. Audit Date Range with Quick Presets ── */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Timeframe Window</span>
            </span>
            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1">
              {[
                { label: "7D", days: 7 },
                { label: "30D", days: 30 },
                { label: "90D", days: 90 },
                { label: "1Y", days: 365 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => applyPreset(p.days)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                    activePreset === p.days
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Start Date (UTC)
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleCustomDateChange("from", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-sky-500 font-semibold text-slate-800 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                End Date (UTC)
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleCustomDateChange("to", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-sky-500 font-semibold text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* ── 5. Optional Custom Report Title ── */}
        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Custom Report Header (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              chosenStation
                ? `${chosenStation.name} (${chosenStation.code}) · Water Operations Audit`
                : "National Water Operations Telemetry Report"
            }
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 font-medium text-slate-900 transition-all text-xs"
          />
        </div>

        {/* ── 6. Action Footer ── */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createReportMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {createReportMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Report…</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
