// src/components/ai/MaintenancePredictionTable.tsx
import React from "react"
import { Card } from "../common/Card"
import { AiMaintenancePayload } from "../../types/api"
import { Wrench } from "lucide-react"

export const MaintenancePredictionTable: React.FC<{
  payload?: AiMaintenancePayload | null
}> = ({ payload }) => {
  const predictions = payload?.predictions || []

  return (
    <Card className="overflow-hidden bg-white border-slate-200 text-slate-900">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              AI Predictive Equipment Maintenance Schedule
            </h3>
            <p className="text-[11px] text-slate-400">
              Sensor degradation curves, valve stress, and battery cycle failure
              forecasting
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
              <th className="pb-3">Component / Subsystem</th>
              <th className="pb-3">Failure Probability</th>
              <th className="pb-3">Est. Days to Failure</th>
              <th className="pb-3">Recommended Preventive Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {predictions.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 font-bold text-slate-800">
                  {p.equipmentComponent}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        p.failureProbability >= 0.7
                          ? "text-red-600"
                          : p.failureProbability >= 0.4
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {Math.round(p.failureProbability * 100)}%
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          p.failureProbability >= 0.7
                            ? "bg-red-500"
                            : p.failureProbability >= 0.4
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${p.failureProbability * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 font-mono font-semibold text-slate-700">
                  ~{p.estimatedDaysToFailure} days
                </td>
                <td className="py-3 text-slate-600">{p.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
