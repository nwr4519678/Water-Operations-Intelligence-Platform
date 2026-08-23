// src/utils/formatters.ts
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(isoString?: string | null, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  if (!isoString) return '—';
  try {
    const d = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    return format(d, formatStr);
  } catch {
    return isoString || '—';
  }
}

export function formatRelative(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = parseISO(isoString);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return isoString || '—';
  }
}

export function formatNumber(val?: number | string | null, precision: number = 2): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '—';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
