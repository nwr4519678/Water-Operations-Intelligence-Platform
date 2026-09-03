// src/components/station/StationAlarmList.tsx
import React from "react"
import { AlarmDto } from "../../types/api"
import { Badge } from "../common/Badge"
import { formatDate } from "../../utils/formatters"

export const StationAlarmList: React.FC<{
  alarms: AlarmDto[]
}> = ({ alarms }) => {
  if (alarms.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No operational alarms recorded for this station.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
            <th className="pb-2">Time</th>
            <th className="pb-2">Severity</th>
            <th className="pb-2">Alarm Message</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Fault Probability</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {alarms.map((a) => (
            <tr key={a.alarmId} className="hover:bg-slate-50">
              <td className="py-2.5 font-mono text-slate-500">
                {formatDate(a.raisedAtUtc, "yyyy-MM-dd HH:mm")}
              </td>
              <td className="py-2.5">
                <Badge
                  label={a.severity}
                  variant={
                    a.severity === "CRITICAL"
                      ? "critical"
                      : a.severity === "WARNING"
                        ? "warning"
                        : "info"
                  }
                  size="sm"
                />
              </td>
              <td className="py-2.5 font-semibold text-slate-800">
                {a.message}
              </td>
              <td className="py-2.5">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-600">
                  {a.status}
                </span>
              </td>
              <td className="py-2.5 text-right font-mono font-bold text-purple-600">
                {a.faultProbability
                  ? `${Math.round(a.faultProbability * 100)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
