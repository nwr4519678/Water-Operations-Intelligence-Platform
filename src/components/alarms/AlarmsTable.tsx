// src/components/alarms/AlarmsTable.tsx
import React, { useState } from "react"
import { AlarmDto } from "../../types/api"
import { Card } from "../common/Card"
import { Badge } from "../common/Badge"
import { formatDate } from "../../utils/formatters"
import { AlarmDetailDrawer } from "./AlarmDetailDrawer"
import { Pagination } from "../common/Pagination"
import { ArrowUpRight } from "lucide-react"

export const AlarmsTable: React.FC<{
  alarms: AlarmDto[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
}> = ({ alarms, totalCount, page, pageSize, onPageChange }) => {
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmDto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleRowClick = (a: AlarmDto) => {
    setSelectedAlarm(a)
    setDrawerOpen(true)
  }

  return (
    <Card className="overflow-hidden p-0 bg-white border-slate-200 text-slate-900 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <th className="py-3 px-4">Raised Time</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Station</th>
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">AI Fault Probability</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {alarms.map((a) => (
              <tr
                key={a.alarmId}
                onClick={() => handleRowClick(a)}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {formatDate(a.raisedAtUtc, "yyyy-MM-dd HH:mm")}
                </td>
                <td className="py-3.5 px-4">
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
                <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                  {a.stationName}
                </td>
                <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                  {a.message}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-mono text-[10px] font-bold uppercase text-slate-600">
                    {a.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-700">
                      {a.faultProbability
                        ? `${Math.round(a.faultProbability * 100)}%`
                        : "—"}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Showing {alarms.length} of {totalCount} active and historical alarms
        </span>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / pageSize)}
          onPageChange={onPageChange}
        />
      </div>

      <AlarmDetailDrawer
        alarm={selectedAlarm}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </Card>
  )
}
