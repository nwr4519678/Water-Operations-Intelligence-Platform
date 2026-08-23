// src/types/ui.ts
import { ReactNode } from 'react';

export type StatusVariant = 'online' | 'offline' | 'maintenance' | 'warning' | 'critical' | 'info';

export interface ToastItem {
  id: string;
  type: 'alarm' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
}

export interface TimeRangeOption {
  label: string;
  value: '1H' | '6H' | '24H' | '7D' | '30D' | 'CUSTOM';
  hours: number;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  icon?: ReactNode;
}
