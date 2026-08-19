import { Battery, ChevronRight, Radio, Signal, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeading } from '../components/ui/PageHeading'
import { StatusBadge } from '../components/ui/StatusBadge'
import { stations } from '../services/mockData'

export function Devices() { return <><PageHeading eyebrow="DEVICES / STATIONS" title="MERI monitoring stations" description="Two field stations delivering read-only tide-gauge telemetry to EchoCloud." /><div className="device-grid">{stations.map((station) => <article className="device-card" key={station.id}><div className={`device-banner ${station.bannerTone}`}><div className="banner-watermark"><Waves size={64} /></div><StatusBadge status={station.status} /></div><div className="device-card-body"><p className="section-kicker">{station.type}</p><h2>{station.name}</h2><p className="device-location">{station.location} <span>·</span> {station.locationAr}</p><p className="device-description">{station.description}</p><div className="device-health"><span><Radio size={16} /> {station.lastSeen}</span><span><Battery size={16} /> {station.battery}%</span><span><Signal size={16} /> {station.signal}/4 bars</span></div><Link to={`/devices/${station.id}`} className="device-open">Open station <ChevronRight size={18} /></Link></div></article>)}</div></> }
