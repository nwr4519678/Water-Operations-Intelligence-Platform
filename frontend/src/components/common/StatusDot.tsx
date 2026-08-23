// src/components/common/StatusDot.tsx
import React from 'react';
import { StatusVariant } from '../../types/ui';

export const StatusDot: React.FC<{
  status?: StatusVariant | 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CRITICAL' | 'WARNING' | 'INFO';
  size?: 'sm' | 'md' | 'lg';
  ping?: boolean;
  className?: string;
}> = ({ status = 'online', size = 'md', ping = false, className = '' }) => {
  const norm = String(status).toLowerCase();

  const colorMap: Record<string, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    maintenance: 'bg-amber-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    info: 'bg-blue-500',
    active: 'bg-red-500',
    acknowledged: 'bg-amber-500',
    resolved: 'bg-emerald-500',
  };

  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const colorClass = colorMap[norm] || 'bg-slate-400';

  return (
    <span className={`relative inline-flex shrink-0 ${sizeMap[size]} ${className}`}>
      {ping && norm === 'online' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClass}`} />
      )}
      <span className={`relative inline-flex rounded-full h-full w-full ${colorClass}`} />
    </span>
  );
};
