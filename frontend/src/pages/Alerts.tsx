import { useMemo, useState } from 'react'
import { BellRing, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeading } from '../components/ui/PageHeading'
import { SeverityBadge } from '../components/ui/StatusBadge'
import { alarms, stations } from '../services/mockData'
import type { AlarmSeverity } from '../types'

export function Alerts() {
  const [severity, setSeverity] = useState<'all' | AlarmSeverity>('all')
  const [stationId, setStationId] = useState('all')
  const [date, setDate] = useState('')
  const [sound, setSound] = useState(true)
  const [visual, setVisual] = useState(true)
  const filtered = useMemo(() => alarms.filter((alarm) => (severity === 'all' || alarm.severity === severity) && (stationId === 'all' || alarm.stationId === stationId) && (!date || alarm.createdAt.startsWith(date))), [date, severity, stationId])
  return <><PageHeading eyebrow="ALERTS / VIEWER" title="Read-only alarms center" description="Filter and review station alarms. Viewer access cannot acknowledge, dismiss or modify alarms." action={<div className="alert-toggles"><button type="button" className={sound ? 'active' : ''} onClick={() => setSound((current) => !current)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />} Sound</button><button type="button" className={visual ? 'active' : ''} onClick={() => setVisual((current) => !current)}><BellRing size={17} /> Visual</button></div>} /><section className="alarm-filters panel"><div className="filter-title"><SlidersHorizontal size={18} /> Filters</div><label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as 'all' | AlarmSeverity)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select></label><label>Station<select value={stationId} onChange={(event) => setStationId(event.target.value)}><option value="all">All stations</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></section><section className="alarms-panel panel">{filtered.length === 0 ? <EmptyState title="No matching alarms" detail="Try clearing a filter or choosing a different date." /> : <div className="alarm-list">{filtered.map((alarm) => { const station = stations.find((item) => item.id === alarm.stationId); return <article className={`alarm-row ${alarm.severity}`} key={alarm.id}><span className="alarm-symbol"><BellRing size={19} /></span><div className="alarm-main"><div><SeverityBadge severity={alarm.severity} /><span className="alarm-station">{station?.name}</span></div><h2>{alarm.title}</h2><p>{alarm.description}</p></div><div className="alarm-time"><span>{new Date(alarm.createdAt).toLocaleDateString()}</span><small>{new Date(alarm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><b>{alarm.acknowledged ? 'Reviewed' : 'New'}</b></div></article> })}</div>}</section></>
}
