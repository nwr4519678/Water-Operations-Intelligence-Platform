import { Activity, AlertTriangle, Download, Gauge, MapPinned, Radio } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AiInsights } from '../components/ui/AiInsights'
import { PageHeading } from '../components/ui/PageHeading'
import { EgyptMap } from '../components/map/EgyptMap'
import { StatusBadge } from '../components/ui/StatusBadge'
import { alarms, stations } from '../services/mockData'

const stats = [
  { label: 'Total Devices', value: '2', detail: 'MERI field stations', icon: Gauge, tone: 'blue' },
  { label: 'Active Alerts', value: '0', detail: 'No critical alarms', icon: AlertTriangle, tone: 'green' },
  { label: 'Downloads', value: '10', detail: 'Reports generated', icon: Download, tone: 'purple' },
  { label: 'Last Seen', value: 'Live', detail: 'All stations reporting', icon: Radio, tone: 'orange' },
]

export function Dashboard() {
  return <><PageHeading eyebrow="DASHBOARD / OVERVIEW" title="Water operations at a glance" description="Viewer-only intelligence for MERI tidal stations in Damietta Barrages and Wadi El Natrun." action={<div className="last-refresh"><Activity size={16} /> Data refreshed just now</div>} /><section className="stat-grid">{stats.map(({ label, value, detail, icon: Icon, tone }) => <article className="stat-card" key={label}><span className={`stat-icon ${tone}`}><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>)}</section><section className="dashboard-grid"><EgyptMap stations={stations} /><AiInsights /></section><section className="station-overview panel"><div className="panel-header"><div><p className="section-kicker">LIVE STATIONS</p><h2>Station health overview</h2><span>Latest telemetry and connection status</span></div><Link className="text-link" to="/devices">View all stations →</Link></div><div className="overview-table"><div className="table-head"><span>Station</span><span>Location</span><span>Health</span><span>Battery</span><span>Last seen</span><span /></div>{stations.map((station) => <div className="table-row" key={station.id}><span className="station-name"><i><MapPinned size={16} /></i><b>{station.name}</b><small>{station.type}</small></span><span>{station.location}<small>{station.locationAr}</small></span><span><StatusBadge status={station.status} /></span><span>{station.battery}%</span><span>{station.lastSeen}</span><Link to={`/devices/${station.id}`}>Quick view →</Link></div>)}</div></section><section className="recent-alerts panel"><div className="panel-header"><div><p className="section-kicker">ALARM VIEWER</p><h2>Recent operational notices</h2></div><Link className="text-link" to="/alerts">Open alarms →</Link></div><div className="notice-list">{alarms.slice(0, 3).map((alarm) => <div key={alarm.id} className={`notice ${alarm.severity}`}><span>{alarm.severity === 'warning' ? <AlertTriangle size={18} /> : <Activity size={18} />}</span><div><strong>{alarm.title}</strong><p>{alarm.description}</p></div><small>{new Date(alarm.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div>)}</div></section></>
}
