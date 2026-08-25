// src/components/reports/ReportCard.tsx
import React from "react"
import { Card } from "../common/Card"
import { Badge } from "../common/Badge"
import { ReportDto } from "../../types/api"
import { formatDate, formatBytes } from "../../utils/formatters"
import { Download } from "lucide-react"
import { Button } from "../common/Button"
import { AiSummaryAccordion } from "./AiSummaryAccordion"
import { reportsApi } from "../../api/reports"
import { useUiStore } from "../../store/uiStore"

export const ReportCard: React.FC<{
  report: ReportDto
}> = ({ report }) => {
  const addToast = useUiStore((state) => state.addToast)

  const handleDownload = () => {
    const url = reportsApi.downloadReportUrl(report.reportId)
    window.open(url, "_blank")
    addToast({
      type: "success",
      title: "Report Download Initiated",
      message: `Downloading ${report.title} (${report.format})...`,
    })
  }

  return (
    <Card className="flex flex-col justify-between border border-slate-200 hover:border-slate-300 transition-all bg-white text-slate-900 shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] font-bold text-slate-400">
            {report.reportId}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              label={report.format}
              variant={report.format === "PDF" ? "critical" : "online"}
              size="sm"
            />
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {report.status}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 leading-snug">
          {report.title}
        </h3>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
          <span>
            Type: <b>{report.reportType.replace(/_/g, " ")}</b>
          </span>
          <span>•</span>
          <span>
            Size: <b>{formatBytes(report.fileSizeBytes)}</b>
          </span>
        </div>

        <div className="text-[10px] font-mono text-slate-400 mt-1">
          Generated on {formatDate(report.createdAtUtc)}
        </div>
      </div>

      <div>
        {/* AI Summary Accordion */}
        <AiSummaryAccordion reportId={report.reportId} />

        {/* Download Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownload}
          >
            Download {report.format}
          </Button>
        </div>
      </div>
    </Card>
  )
}
