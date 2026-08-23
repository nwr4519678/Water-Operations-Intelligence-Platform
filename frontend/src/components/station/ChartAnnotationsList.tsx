// src/components/station/ChartAnnotationsList.tsx
import React from 'react';
import { ChartAnnotationDto } from '../../types/api';
import { formatDate } from '../../utils/formatters';
import { Tag, Calendar } from 'lucide-react';

export const ChartAnnotationsList: React.FC<{
  annotations: ChartAnnotationDto[];
}> = ({ annotations }) => {
  if (annotations.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No manual engineering annotations on this station.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {annotations.map((a) => (
        <div
          key={a.annotationId}
          className="p-3.5 rounded-xl border border-slate-200 bg-white"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-blue-600 flex items-center gap-1 text-xs">
              <Tag className="w-3 h-3" />
              <span>{a.createdByEmail}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(a.timestampUtc)}</span>
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            {a.text}
          </p>
        </div>
      ))}
    </div>
  );
};
