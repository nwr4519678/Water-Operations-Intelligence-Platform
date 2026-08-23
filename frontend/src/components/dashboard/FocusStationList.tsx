// src/components/dashboard/FocusStationList.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { useAiFocusStations } from '../../hooks/useAiQueries';
import { AiFocusStationPayload } from '../../types/api';
import { Skeleton } from '../common/Skeleton';

export const FocusStationList: React.FC = () => {
  const { data, isLoading } = useAiFocusStations();
  const payload = data?.payload as AiFocusStationPayload | undefined;
  const stations = payload?.stations || [];

  return (
    <Card className="h-full flex flex-col bg-white border-slate-200 text-slate-900 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              AI Priority Focus Stations
            </h3>
            <p className="text-[11px] text-slate-400">
              Ranked dynamically by hydrological surge, pressure, & anomaly score
            </p>
          </div>
        </div>
        <Link
          to="/ai?tab=focus"
          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
        >
          <span>View Matrix</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                <th className="pb-2">Station</th>
                <th className="pb-2">Code</th>
                <th className="pb-2">Risk Score</th>
                <th className="pb-2">Primary Risk Driver</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stations.map((s) => (
                <tr key={s.stationId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-bold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-2.5 font-mono text-blue-600 font-bold">
                    {s.stationCode}
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${s.riskScore >= 70 ? 'bg-red-50 text-red-600 border-red-200' : s.riskScore >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {s.riskScore}/100
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {s.primaryRiskFactor}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      to={`/stations/${s.stationId}`}
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Analyze</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};
