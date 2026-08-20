import { useState } from 'react'
import { AccessibleLegend, AiConfidenceBadge, DataQualityBadge, FeedbackState, KpiCard, SearchField, SelectField, SeverityBadge, StatusBadge, Tabs, ViewerShell } from '../components/system'
import { resources, type SupportedLocale } from '../shared/i18n/resources'

const navigation = [
  { id: 'overview', label: 'Overview', href: '/', current: true },
  { id: 'stations', label: 'Stations', href: '/stations' },
  { id: 'alarms', label: 'Alarms', href: '/alarms' },
  { id: 'reports', label: 'Reports', href: '/reports' },
]

export function App() {
  const [locale, setLocale] = useState<SupportedLocale>('en')
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('all')
  const [tab, setTab] = useState('overview')
  const copy = resources[locale]

  return (
    <ViewerShell navigation={navigation} breadcrumbs={[{ label: copy.navigation.overview }]} locale={locale} onLocaleChange={setLocale}>
      <section className="page-heading">
        <div><span className="eyebrow">VIEWER DESIGN SYSTEM</span><h1>{copy.navigation.overview}</h1><p>Reusable, accessible components for read-only water operations.</p></div>
        <StatusBadge tone="healthy" label="System operational" />
      </section>
      <section className="kpi-grid" aria-label="Network summary">
        <KpiCard label="Active stations" value="112" trend="90.3% online" trendTone="positive" icon="◉" />
        <KpiCard label="Average water level" value="2.45 m" trend="+0.15 m today" trendTone="positive" icon="≋" />
        <KpiCard label="Open alarms" value="12" trend="3 critical" trendTone="negative" icon="!" />
        <KpiCard label="Water quality" value="Good" trend="92 / 100" trendTone="positive" icon="✓" />
      </section>
      <section className="panel">
        <div className="panel__header"><div><span className="eyebrow">COMPONENT EXAMPLE</span><h2>Station monitoring</h2></div><Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'quality', label: 'Data quality' }]} activeTab={tab} onChange={setTab} /></div>
        <div className="filters"><SearchField label="Search stations" value={search} onChange={setSearch} placeholder="Station name or ID" /><SelectField label="Region" value={region} onChange={setRegion} options={[{ value: 'all', label: 'All regions' }, { value: 'north', label: 'North district' }, { value: 'south', label: 'South district' }]} /><button className="button button--primary" type="button">Apply filters</button></div>
        <div className="component-row" aria-label="Badge examples"><StatusBadge tone="healthy" /><StatusBadge tone="attention" /><SeverityBadge severity="critical" /><DataQualityBadge quality="verified" /><AiConfidenceBadge confidence={94} /></div>
        <AccessibleLegend label="Station status legend" items={[{ id: 'normal', label: 'Normal', tone: 'healthy' }, { id: 'warning', label: 'Warning', tone: 'attention' }, { id: 'critical', label: 'Critical', tone: 'critical' }, { id: 'offline', label: 'Offline', tone: 'offline' }]} />
      </section>
      <div className="feedback-grid"><FeedbackState kind="stale" actionLabel="Refresh data" onAction={() => undefined} /><FeedbackState kind="empty" /></div>
    </ViewerShell>
  )
}
