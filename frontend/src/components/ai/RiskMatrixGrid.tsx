// src/components/ai/RiskMatrixGrid.tsx
import React from 'react';
import { Card } from '../common/Card';
import { useAiFocusStations } from '../../hooks/useAiQueries';
import { AiFocusStationPayload } from '../../types/api';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

export const RiskMatrixGrid: React.FC = () => {
  const { data, isLoading } = useAiFocusStations();
  const payload = data?.payload as AiFocusStationPayload | undefined;
  const stations = payload?.stations || [];

  return (
    <div className="space-y-4 text-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Comprehensive Operational Risk Matrix
          </h3>
          <p className="text-[11px] text-slate-400">
            Multi-variable scoring: flood surge risk, pressure degradation, and sensor reliability
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton variant="card" height="150px" />
          <Skeleton variant="card" height="150px" />
          <Skeleton variant="card" height="150px" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <Card key={s.stationId} className="border border-slate-200 hover:border-blue-300 transition-all bg-white shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    {s.stationCode}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                    {s.name}
                  </h4>
                </div>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${s.riskScore >= 70 ? 'bg-red-50 text-red-600 border border-red-200' : s.riskScore >= 50 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  {s.riskScore}/100
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Primary Risk Driver</span>
                <p className="text-slate-700 font-medium">{s.primaryRiskFactor}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Action Required: Priority Review</span>
                <Link
                  to={`/stations/${s.stationId}`}
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
