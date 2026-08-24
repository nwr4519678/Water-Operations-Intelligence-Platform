// src/components/reports/GenerateReportModal.tsx
import React, { useState } from "react"
import { Modal } from "../common/Modal"
import { Button } from "../common/Button"
import { useCreateReport } from "../../hooks/useReportQueries"
import { useUiStore } from "../../store/uiStore"

export const GenerateReportModal: React.FC<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("")
  const [reportType, setReportType] =
    useState<"STATION_SUMMARY" | "ALARM_SUMMARY" | "TELEMETRY_EXPORT">(
      "STATION_SUMMARY",
    )
  const [fileFormat, setFileFormat] = useState<"PDF" | "EXCEL">("PDF")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const createReportMutation = useCreateReport()
  const addToast = useUiStore((state) => state.addToast)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createReportMutation.mutateAsync({
        title,
        reportType,
        format: fileFormat,
        fromUtc: dateFrom
          ? new Date(dateFrom).toISOString()
          : new Date(Date.now() - 7 * 86400000).toISOString(),
        toUtc: dateTo
          ? new Date(dateTo).toISOString()
          : new Date().toISOString(),
      })

      addToast({
        type: "success",
        title: "Report Generated",
        message: `Report "${title}" was generated successfully.`,
      })

      setTitle("")
      onClose()
    } catch {
      addToast({
        type: "error",
        title: "Report Failed",
        message: "Could not generate the requested report.",
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate New Telemetry & Irrigation Report"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-xs text-slate-900"
      >
        <div>
          <label className="font-bold text-slate-700 block mb-1.5">
            Report Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly Nile Basin Water Balance & High Dam Inflow Audit"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500 font-medium text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-800 font-medium"
            >
              <option value="STATION_SUMMARY">Station Telemetry Summary</option>
              <option value="ALARM_SUMMARY">
                Alarm Audit Log & Diagnostics
              </option>
              <option value="TELEMETRY_EXPORT">
                Raw Telemetry Data Export
              </option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              File Format
            </label>
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-slate-800 font-medium"
            >
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="EXCEL">Microsoft Excel (.xlsx)</option>
              <option value="CSV">CSV Data File (.csv)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium text-slate-900"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none font-medium text-slate-900"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={createReportMutation.isPending}
          >
            Generate & Dispatch
          </Button>
        </div>
      </form>
    </Modal>
  )
}
