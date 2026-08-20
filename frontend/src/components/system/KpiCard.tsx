import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string
  trend?: string
  trendTone?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
}

export function KpiCard({ label, value, trend, trendTone = 'neutral', icon }: KpiCardProps) {
  return (
    <article className="kpi-card" aria-label={`${label}: ${value}`}>
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {icon ? <span className="kpi-card__icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <strong className="kpi-card__value">{value}</strong>
      {trend ? <span className={`kpi-card__trend kpi-card__trend--${trendTone}`}>{trend}</span> : null}
    </article>
  )
}
