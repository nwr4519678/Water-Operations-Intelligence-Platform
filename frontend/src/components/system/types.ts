import type { ReactNode } from 'react'

export type StatusTone = 'healthy' | 'attention' | 'critical' | 'offline' | 'unknown'
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical'

export type DataQuality = 'verified' | 'estimated' | 'stale' | 'missing'

export interface NavigationItem {
  id: string
  label: string
  href: string
  current?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ViewerShellProps {
  children: ReactNode
  navigation: NavigationItem[]
  breadcrumbs?: BreadcrumbItem[]
  locale?: 'ar' | 'en'
  onLocaleChange?: (locale: 'ar' | 'en') => void
  connectionLabel?: string
  connectionTone?: StatusTone
}
