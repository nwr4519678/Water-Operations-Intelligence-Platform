// src/components/reports/AiSummaryAccordion.tsx
import React, { useState } from "react"
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { useAiReportSummary } from "../../hooks/useAiQueries"
import { Spinner } from "../common/Spinner"

export const AiSummaryAccordion: React.FC<{
  reportId: string
}> = ({ reportId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading } = useAiReportSummary(reportId)

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Executive Report Brief & Summary</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line animate-in fade-in duration-150">
          {isLoading ? (
            <div className="py-2 flex items-center justify-center gap-2 text-purple-700">
              <Spinner size="sm" />
              <span>Generating real-time AI summary...</span>
            </div>
          ) : (
            data?.payload as string ||
            "Executive brief generated for this telemetry report."
          )}
        </div>
      )}
    </div>
  )
}
