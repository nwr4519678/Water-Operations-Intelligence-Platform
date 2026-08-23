// src/components/dashboard/KpiCard.tsx
import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive: boolean };
  icon: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate';
  subtitle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  icon,
  variant = 'blue',
  subtitle
}) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200/80',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/80',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/80',
    red: 'from-red-500/10 to-red-600/5 text-red-600 border-red-200/80',
    slate: 'from-slate-500/10 to-slate-600/5 text-slate-600 border-slate-200/80',
  };

  const iconBgMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${colorMap[variant]} border shadow-xs hover:shadow-md transition-all duration-200 text-slate-900`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl ${iconBgMap[variant]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>

        {delta && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${delta.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {delta.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{delta.value}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-400 font-medium">
          {subtitle}
        </div>
      )}
    </Card>
  );
};
