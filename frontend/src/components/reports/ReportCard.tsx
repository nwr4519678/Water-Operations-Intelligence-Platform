import React, { useState } from "react"
import { Badge } from "../common/Badge"
import { ReportDto } from "../../types/api"
import { formatDate, formatBytes } from "../../utils/formatters"
import {
  Download,
  FileText,
  FileSpreadsheet,
  Table,
  CheckCircle2,
  Calendar,
  Loader2,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react"
import { Button } from "../common/Button"
import { useUiStore } from "../../store/uiStore"
import { apiClient } from "../../api/client"
import { useDeleteReport } from "../../hooks/useReportQueries"

export const ReportCard: React.FC<{
  report: ReportDto
}> = ({ report }) => {
  const addToast = useUiStore((state) => state.addToast)
  const [isDownloading, setIsDownloading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleteMutation = useDeleteReport()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(report.reportId)
      addToast({
        type: "success",
        title: "Report Deleted",
        message: `Report ${report.title} was deleted successfully.`,
      })
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Deletion Failed",
        message:
          err?.response?.data?.title || "Could not delete report from backend.",
      })
    } finally {
      setConfirmDelete(false)
    }
  }

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      // Direct authenticated download from backend
      const response = await apiClient.get<Blob>(
        `/api/v1/reports/${report.reportId}/download`,
        {
          responseType: "blob",
        }
      )

      const blob = response.data
      const isExcel = report.format === "EXCEL"
      const ext = report.format === "PDF" ? "pdf" : (isExcel ? "xlsx" : "csv")
      const safeTitle = (report.title || "Report")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40)
      const filename = `Report_${report.reportId.slice(0, 8)}_${safeTitle}.${ext}`

      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)

      addToast({
        type: "success",
        title: "Report Downloaded",
        message: `${report.title} (${report.format}) downloaded successfully with real database telemetry.`,
      })
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Download Failed",
        message: err?.response?.data?.title || "Could not download report from server. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const isExcel = report.format === "EXCEL"
  const formattedType = (report.reportType || "STATION_SUMMARY").replace(/_/g, " ")

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      <div>
        {/* Top bar with ID, format badge, and status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isExcel
                  ? "bg-emerald-50 text-emerald-600"
                  : report.format === "CSV"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {isExcel ? (
                <FileSpreadsheet className="w-4 h-4" />
              ) : report.format === "CSV" ? (
                <Table className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-500 tracking-tight bg-slate-100/80 px-1.5 py-0.5 rounded">
              #{report.reportId.slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              label={report.format}
              variant={isExcel ? "online" : report.format === "CSV" ? "warning" : "primary"}
              size="sm"
            />
            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {report.status}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
          {report.title}
        </h3>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mt-2.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
            {formattedType}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-medium text-slate-500">
            {formatBytes(report.fileSizeBytes)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Generated {formatDate(report.createdAtUtc)}</span>
        </div>
      </div>

      <div className="mt-4">
        {confirmDelete ? (
          /* Inline Delete Confirmation */
          <div className="pt-3 border-t border-rose-100 flex items-center justify-between gap-2 bg-rose-50/70 -mx-5 -mb-5 p-3 rounded-b-2xl border-t border-rose-200/60 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Confirm permanent delete?</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMutation.isPending}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Footer with Download and Delete buttons */
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Delete this report"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <Button
              size="sm"
              variant="outline"
              className="rounded-xl font-bold text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
              leftIcon={
                isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                )
              }
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Downloading…" : `Download ${report.format}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
