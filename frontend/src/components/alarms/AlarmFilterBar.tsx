// src/components/alarms/AlarmFilterBar.tsx
import React from 'react';
import { Search } from 'lucide-react';

export interface AlarmFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  severity: string;
  onSeverityChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export const AlarmFilterBar: React.FC<AlarmFilterBarProps> = ({
  search,
  onSearchChange,
  severity,
  onSeverityChange,
  status,
  onStatusChange,
}) => {
  const severities = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];
  const statuses = ['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-4 text-slate-900">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter alarms by station, code, message, or ID..."
          className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-slate-900"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Severity */}
        <select
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="text-xs font-semibold bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical Only</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs font-semibold bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Alarms</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>
    </div>
  );
};
