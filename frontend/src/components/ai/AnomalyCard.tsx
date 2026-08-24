// src/components/ai/AnomalyCard.tsx
import React from "react"
import { Card } from "../common/Card"
import { Badge } from "../common/Badge"
import { AiAnomalyItem } from "../../types/api"
import { formatRelative } from "../../utils/formatters"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

export const AnomalyCard: React.FC<{
  anomaly: AiAnomalyItem
}> = ({ anomaly }) => {
  return (
    <Card className="border border-slate-200 hover:border-purple-300 transition-all shadow-xs bg-white text-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600">
              {anomaly.stationId}
            </span>
            <Badge
              label={anomaly.severity}
              variant={anomaly.severity === "CRITICAL" ? "critical" : "warning"}
              size="sm"
            />
            <span className="text-[10px] text-slate-400 font-mono">
              {formatRelative(anomaly.detectedAtUtc)}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1.5">
            {anomaly.stationName}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Parameter:{" "}
            <span className="font-semibold text-slate-700">
              {anomaly.parameter}
            </span>
          </p>
        </div>

        <Link
          to={`/stations/${anomaly.stationId}`}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3.5 p-3 rounded-xl bg-slate-50 text-xs border border-slate-200">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">
            Expected Baseline
          </span>
          <span className="font-semibold text-slate-700 text-sm">
            {anomaly.expectedValue} {anomaly.unit}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">
            Detected Deviation
          </span>
          <span className="font-bold text-red-600 text-sm">
            {anomaly.actualValue} {anomaly.unit}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
        <span className="text-slate-400 font-medium">
          Neural Detection Confidence
        </span>
        <span className="font-bold text-purple-700 font-mono">
          {Math.round(anomaly.confidenceScore * 100)}%
        </span>
      </div>
    </Card>
  )
}
