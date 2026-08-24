// src/components/dashboard/LiveAlarmFeedWidget.tsx
import React from "react"
import { Link } from "react-router-dom"
import { Card } from "../common/Card"
import { Bell, ArrowUpRight } from "lucide-react"
import { useAlarmsList } from "../../hooks/useViewerQueries"
import { Badge } from "../common/Badge"
import { formatRelative } from "../../utils/formatters"
import { Skeleton } from "../common/Skeleton"

export const LiveAlarmFeedWidget: React.FC = () => {
  const { data, isLoading } = useAlarmsList({ pageSize: 5 })
  const alarms = data?.items || []

  return (
    <Card className="h-full flex flex-col bg-white border-slate-200 text-slate-900 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Alarm Feed
            </h3>
            <p className="text-[11px] text-slate-400">
              Active threshold breaches & sensor diagnostics
            </p>
          </div>
        </div>
        <Link
          to="/alarms"
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
        >
          <span>All Alarms</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton variant="card" height="60px" />
            <Skeleton variant="card" height="60px" />
          </div>
        ) : alarms.length > 0 ? (
          alarms.map((a) => (
            <div
              key={a.alarmId}
              className={`p-3 rounded-xl border transition-all ${
                a.severity === "CRITICAL"
                  ? "bg-red-50/70 border-red-200"
                  : a.severity === "WARNING"
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
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
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatRelative(a.raisedAtUtc)}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">
                {a.message}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-between">
                <span>{a.stationName}</span>
                <span className="font-mono text-slate-400">{a.alarmId}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No active alarms. Network nominal.
          </div>
        )}
      </div>
    </Card>
  )
}
