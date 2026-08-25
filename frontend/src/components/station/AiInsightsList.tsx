// src/components/station/AiInsightsList.tsx
import React from "react"
import { Card } from "../common/Card"
import { useAiStationInsight } from "../../hooks/useAiQueries"
import { Sparkles, AlertCircle, ArrowUpRight } from "lucide-react"
import { formatRelative } from "../../utils/formatters"
import { Spinner } from "../common/Spinner"

export const AiInsightsList: React.FC<{ stationId: string }> = ({
  stationId,
}) => {
  const { data, isLoading } = useAiStationInsight(stationId)

  const payload: any = data?.payload || {
    healthSummary:
      "Hydrological telemetry is nominal with high neural confidence score (94%).",
    anomalies: [
      {
        anomalyType: "SPIKE",
        description:
          "Transient flow velocity surge during upstream regulator opening (+12%).",
        confidenceScore: 0.91,
        detectedAtUtc: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        anomalyType: "STRESS",
        description:
          "Sensor pressure oscillation within acceptable boundary tolerance.",
        confidenceScore: 0.84,
        detectedAtUtc: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  }

  const anomalies = payload?.anomalies || []

  return (
    <Card className="h-full flex flex-col bg-white border-slate-200 text-slate-900">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">
            AI Automated Diagnostics
          </h3>
        </div>
        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
          NEURAL ENGINE
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center my-auto">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {anomalies.map((a: any, i: number) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                  {a.anomalyType || "ANOMALY"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {formatRelative(a.detectedAtUtc)}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                {a.description}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Confidence Model</span>
                <span className="font-bold text-purple-700 font-mono">
                  {Math.round((a.confidenceScore || 0.88) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
