import { Activity } from 'lucide-react'

interface LevelGaugeProps { label: string; value: number; updatedAt: string; min?: number; max?: number; trend?: 'up' | 'down' }

export function LevelGauge({ label, value, updatedAt, min = 0, max = 20, trend = 'up' }: LevelGaugeProps) {
  const progress = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const circumference = Math.PI * 76
  const dashOffset = circumference - progress * circumference
  return <section className="level-gauge" aria-label={`${label}: ${value.toFixed(3)} metres`}><div className="gauge-title"><Activity size={17} /><span>{label}</span></div><svg viewBox="0 0 200 120" role="img" aria-label={`${label} gauge`}><path d="M24 100 A76 76 0 0 1 176 100" className="gauge-track" /><path d="M24 100 A76 76 0 0 1 176 100" className="gauge-progress" strokeDasharray={circumference} strokeDashoffset={dashOffset} /><line x1="100" y1="100" x2={100 + Math.cos(Math.PI * (1 - progress)) * 55} y2={100 - Math.sin(Math.PI * (1 - progress)) * 55} className="gauge-needle" /><circle cx="100" cy="100" r="5" className="gauge-pin" /></svg><strong>{value.toFixed(3)} <em>m</em></strong><p><i className={trend} /> {trend === 'up' ? 'Rising gently' : 'Falling gently'} · {updatedAt}</p></section>
}
