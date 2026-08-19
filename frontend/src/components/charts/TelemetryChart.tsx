import { useMemo, useState } from 'react'
import { Download, ImageDown, Maximize2 } from 'lucide-react'
import { Brush, CartesianGrid, Legend, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TelemetryPoint } from '../../types'
import { exportChartPng, exportTelemetryCsv } from '../../services/exportService'

type Resolution = 'Raw' | 'Hourly avg' | 'Daily avg'
interface TelemetryChartProps { stationName: string; telemetry: TelemetryPoint[]; threshold: number }

function downsample(data: TelemetryPoint[], resolution: Resolution): TelemetryPoint[] {
  const stride = resolution === 'Raw' ? 1 : resolution === 'Hourly avg' ? 2 : 6
  return data.filter((_, index) => index % stride === 0).map((point, _, sample) => ({ ...point, label: point.label, anomaly: sample.length > 5 && point.anomaly }))
}

export function TelemetryChart({ stationName, telemetry, threshold }: TelemetryChartProps) {
  const [resolution, setResolution] = useState<Resolution>('Raw')
  const [expanded, setExpanded] = useState(false)
  const data = useMemo(() => downsample(telemetry, resolution), [resolution, telemetry])
  const latest = telemetry.at(-1)?.upstream ?? 0
  return <section className={`telemetry-chart panel ${expanded ? 'chart-expanded' : ''}`}><div className="panel-header"><div><p className="section-kicker">LIVE TELEMETRY</p><h2>Water level trend</h2><span>Safety threshold, quality flags and AI anomaly overlay</span></div><div className="chart-actions"><div className="resolution-control" aria-label="Data resolution">{(['Raw', 'Hourly avg', 'Daily avg'] as Resolution[]).map((option) => <button key={option} type="button" className={resolution === option ? 'active' : ''} onClick={() => setResolution(option)}>{option}</button>)}</div><button title="Export PNG" type="button" onClick={() => exportChartPng(`${stationName.replaceAll(' ', '_')}_trend.png`, `${stationName} water level`, latest)}><ImageDown size={17} /></button><button title="Export CSV" type="button" onClick={() => exportTelemetryCsv(`${stationName.replaceAll(' ', '_')}_telemetry.csv`, telemetry)}><Download size={17} /></button><button title="Expand chart" type="button" onClick={() => setExpanded((current) => !current)}><Maximize2 size={17} /></button></div></div><div className="chart-legend"><span><i className="line-upstream" /> Up Stream Level</span><span><i className="line-downstream" /> Down Stream Level</span><span><i className="line-anomaly" /> AI anomaly</span></div><div className="rechart-holder"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 14, right: 18, bottom: 4, left: -16 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--chart-grid)" /><XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={35} tick={{ fontSize: 11, fill: 'var(--muted)' }} /><YAxis domain={['dataMin - 0.25', 'dataMax + 0.25']} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} unit=" m" /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 12px 30px rgba(15,23,42,.12)' }} /><Legend wrapperStyle={{ display: 'none' }} /><ReferenceLine y={threshold} stroke="#e46c68" strokeDasharray="6 5" label={{ value: 'Advisory high', position: 'insideTopRight', fill: '#d45755', fontSize: 11 }} /><Line type="monotone" dataKey="upstream" name="Up Stream Level" stroke="#3867d6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="downstream" name="Down Stream Level" stroke="#7f73c8" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />{data.filter((point) => point.anomaly).map((point) => <ReferenceDot key={point.timestamp} x={point.label} y={point.upstream} r={5} fill="#e46c68" stroke="#fff" strokeWidth={2} label={{ value: 'AI anomaly', position: 'top', fill: '#d45755', fontSize: 10 }} />)}<Brush dataKey="label" height={22} stroke="#8ea8ed" travellerWidth={8} /></LineChart></ResponsiveContainer></div><div className="chart-footer"><span>Last signal: {latest.toFixed(3)} m</span><span>Interactive brush: zoom the visible range</span></div></section>
}
