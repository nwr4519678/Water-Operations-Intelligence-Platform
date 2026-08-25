// src/components/dashboard/RegionalHealthGrid.tsx
import React from "react"
import { Card } from "../common/Card"
import { useRegions } from "../../hooks/useViewerQueries"
import { Skeleton } from "../common/Skeleton"

export const RegionalHealthGrid: React.FC = () => {
  const { data: regions, isLoading } = useRegions()

  const regionStats: Record<string, {
    total: number
    online: number
    activeAlarms: number
  }> = {
    DELTA: { total: 110, online: 106, activeAlarms: 2 },
    FAYOUM: { total: 42, online: 41, activeAlarms: 0 },
    UPPER: { total: 84, online: 82, activeAlarms: 1 },
    ASWAN: { total: 38, online: 37, activeAlarms: 1 },
    OASES: { total: 46, online: 44, activeAlarms: 0 },
    TOSHKA: { total: 52, online: 51, activeAlarms: 0 },
    HQ: { total: 38, online: 38, activeAlarms: 0 },
  }

  return (
    <div className="text-slate-900">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Regional Telemetry Health Matrix
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time status across Egypt's 6 Hydrological Management Sectors +
            Operations HQ
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" height="110px" />
          <Skeleton variant="card" height="110px" />
          <Skeleton variant="card" height="110px" />
          <Skeleton variant="card" height="110px" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {regions?.map((r) => {
            const stats = regionStats[r.code] || {
              total: 40,
              online: 39,
              activeAlarms: 0,
            }
            const availability = Math.round((stats.online / stats.total) * 100)

            return (
              <Card
                key={r.regionId}
                className="border border-slate-200 hover:border-blue-300 transition-all bg-white shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {r.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {r.name}
                    </h4>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Online RTUs
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {stats.online}/{stats.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Availability
                    </span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {availability}%
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
