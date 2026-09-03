// src/types/ui.ts
import { ReactNode } from "react"

export type StatusVariant = "online" | "offline" | "maintenance" | "warning" | "critical" | "info"

export interface ToastItem {
  id: string
  type: "alarm" | "success" | "error" | "info"
  title: string
  message: string
  timestamp: string
  duration?: number
}

export interface TimeRangeOption {
  label: string
  value: "3M" | "6M" | "12M" | "24M" | "CUSTOM"
  hours: number
}

export interface SelectOption<T = string> {
  label: string
  value: T
  icon?: ReactNode
}
