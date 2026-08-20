export interface LegendItem {
  id: string
  label: string
  tone: 'healthy' | 'attention' | 'critical' | 'offline' | 'unknown'
}

export function AccessibleLegend({ label, items }: { label: string; items: LegendItem[] }) {
  return (
    <ul className="legend" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="legend__item">
          <span className={`legend__swatch legend__swatch--${item.tone}`} aria-hidden="true" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
