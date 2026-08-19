import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Radio } from 'lucide-react'
import type { Station } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'

export function EgyptMap({ stations }: { stations: Station[] }) {
  const [selected, setSelected] = useState(stations[0]?.id ?? '')
  const active = stations.find((station) => station.id === selected)
  return <section className="egypt-map panel"><div className="panel-header"><div><p className="section-kicker">GEOGRAPHIC OVERVIEW</p><h2>Institute stations across Egypt</h2><span>Viewer map · simulated connection status</span></div><span className="map-live"><Radio size={15} /> Live</span></div><div className="map-stage" aria-label="Interactive map of Egypt"><svg viewBox="0 0 800 360" role="img" aria-label="Map of Egypt with two stations"><path className="egypt-land" d="M137 68 L525 45 L680 120 L622 195 L683 282 L459 324 L282 301 L205 225 L96 165 Z" /><path className="egypt-water" d="M72 53 C178 83 245 79 323 65 C397 51 475 58 558 34" /><path className="nile-line" d="M515 66 C497 113 500 152 473 181 C454 203 459 254 422 307" /></svg>{stations.map((station, index) => <button type="button" key={station.id} aria-label={`View ${station.name}`} className={`station-marker marker-${index} ${station.id === selected ? 'selected' : ''}`} onClick={() => setSelected(station.id)}><MapPin size={29} fill="currentColor" /><span>{station.name}</span></button>)}{active && <div className="map-popup"><div><StatusBadge status={active.status} /><strong>{active.name}</strong><p>{active.location} · {active.locationAr}</p><span>Battery {active.battery}% · Signal {active.signal}/4</span></div><Link to={`/devices/${active.id}`}>Open station</Link></div>}</div></section>
}
