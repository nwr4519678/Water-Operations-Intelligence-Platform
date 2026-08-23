// src/components/station/RiskScoreGauge.tsx
import React from 'react';
import { Card } from '../common/Card';
import { AiRiskScorePayload } from '../../types/api';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export const RiskScoreGauge: React.FC<{
  payload?: AiRiskScorePayload | null;
}> = ({ payload }) => {
  const score = payload?.riskScore ?? 38;
  const category = payload?.riskCategory ?? 'LOW';
  const factors = payload?.contributingFactors ?? [
    'Seasonal agricultural irrigation draw',
    'Upstream reservoir gate adjustment',
    'Sensor telemetry drift (<2%)',
  ];

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#ef4444', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' };
    if (s >= 50) return { stroke: '#f59e0b', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { stroke: '#10b981', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const c = getColor(score);
  const strokeDashoffset = 251.2 - (251.2 * score) / 100;

  return (
    <Card className="h-full flex flex-col justify-between bg-white border-slate-200 text-slate-900">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            AI Operational Risk Index
          </h3>
        </div>
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${c.badge}`}>
          {category} RISK
        </span>
      </div>

      <div className="flex flex-col items-center justify-center my-auto">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-100"
              stroke="currentColor"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              strokeWidth="8"
              fill="transparent"
              stroke={c.stroke}
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-2xl font-black tracking-tight ${c.text}`}>
              {score}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Level</span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Contributing Neural Factors
        </div>
        <ul className="space-y-1 text-xs text-slate-600">
          {factors.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 leading-snug">
              <span className="text-blue-500 font-bold">•</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
