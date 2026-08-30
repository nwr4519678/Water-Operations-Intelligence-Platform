// src/components/alarms/AlarmDetailDrawer.tsx
import React from 'react';
import { Drawer } from '../common/Drawer';
import { AlarmDto, AiFaultProbabilityPayload } from '../../types/api';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import { useAiFaultProbability } from '../../hooks/useAiQueries';
import { Sparkles, Clock, Tag, ShieldCheck } from 'lucide-react';

export const AlarmDetailDrawer: React.FC<{
  alarm: AlarmDto | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (alarmId: string) => void;
}> = ({ alarm, isOpen, onClose, onAcknowledge }) => {
  const { data: faultData } = useAiFaultProbability(alarm?.alarmId || '');
  const faultPayload = faultData?.payload as AiFaultProbabilityPayload | undefined;

  if (!alarm) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      mode="modal"
      title={
        <div className="flex items-center gap-2">
          <Badge
            label={alarm.severity}
            variant={alarm.severity === 'CRITICAL' ? 'critical' : alarm.severity === 'WARNING' ? 'warning' : 'info'}
            size="md"
          />
          <span className="font-mono text-xs text-slate-500 font-bold">{alarm.alarmId}</span>
        </div>
      }
    >
      <div className="space-y-4 text-slate-900">
        {/* Message & Station */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
            {alarm.message}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Station: <span className="font-bold text-slate-800">{alarm.stationName}</span> ({alarm.stationId})
          </p>
        </div>

        {/* AI Root Cause & Fault Probability in Soft Light Purple Accent */}
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span>AI Fault Diagnosis</span>
            </div>
            <span className="text-xs font-bold font-mono text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
              {faultPayload ? `${Math.round(faultPayload.faultProbability * 100)}% Confidence` : 'Not available'}
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
              Probable Root Causes:
            </span>
            {faultPayload?.rootCauses ? (
              <ul className="space-y-1 pl-1">
                {faultPayload.rootCauses.map((rc, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-700">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{rc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">AI diagnosis is not available for this event.</p>
            )}
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Alarm Audit Timeline</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 ring-4 ring-red-50" />
              <div>
                <div className="font-bold text-slate-800">Alarm Triggered / Raised</div>
                <div className="text-slate-500 text-[11px] font-mono">{formatDate(alarm.raisedAtUtc)}</div>
              </div>
            </div>

            {alarm.acknowledgedAtUtc && (
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0 ring-4 ring-amber-50" />
                <div>
                  <div className="font-bold text-slate-800">Acknowledged by {alarm.acknowledgedByEmail || 'Operator'}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{formatDate(alarm.acknowledgedAtUtc)}</div>
                </div>
              </div>
            )}

            {alarm.resolvedAtUtc && (
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-50" />
                <div>
                  <div className="font-bold text-slate-800">Resolved by {alarm.resolvedByEmail || 'System Auto-Clear'}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{formatDate(alarm.resolvedAtUtc)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Automated Tags & Labels */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Automated Tags & Labels</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-500">
              {faultPayload?.rootCauses?.length ? `${faultPayload.rootCauses.length} AI causes available` : 'No automated tags available'}
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
