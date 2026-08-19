import type { Alarm, Report, Station, TelemetryPoint } from '../types'

export const stations: Station[] = [
  {
    id: 'meri-demo',
    name: 'MERI Demo',
    location: 'Damietta Barrages',
    locationAr: 'قناطر دمياط',
    type: 'Tide Gauge Station',
    status: 'healthy',
    latitude: 31.42,
    longitude: 31.81,
    description: 'Real-time tide level monitoring at Damietta Barrages for water operations research.',
    lastSeen: 'Live now',
    battery: 92,
    signal: 4,
    storage: 74,
    cloudSync: true,
    bannerTone: 'delta',
  },
  {
    id: 'meri-wadi-al-natroun',
    name: 'MERI-WadiAl-Natroun',
    location: 'Wadi El Natrun',
    locationAr: 'وادي النطرون',
    type: 'Tide Gauge Station',
    status: 'warning',
    latitude: 30.39,
    longitude: 30.35,
    description: 'Environmental tide and water level monitoring station serving the Wadi El Natrun research area.',
    lastSeen: '18 min ago',
    battery: 68,
    signal: 3,
    storage: 41,
    cloudSync: true,
    bannerTone: 'desert',
  },
]

export const alarms: Alarm[] = [
  { id: 'a-01', stationId: 'meri-wadi-al-natroun', title: 'Battery watch', description: 'Battery capacity is below the preferred 70% operating threshold.', severity: 'warning', createdAt: '2026-08-19T10:24:00.000Z', acknowledged: false },
  { id: 'a-02', stationId: 'meri-demo', title: 'Scheduled calibration', description: 'Monthly sensor calibration window begins tomorrow at 09:00.', severity: 'info', createdAt: '2026-08-18T16:00:00.000Z', acknowledged: true },
  { id: 'a-03', stationId: 'meri-demo', title: 'High-level advisory', description: 'Upstream level passed the advisory baseline briefly; readings are stable.', severity: 'info', createdAt: '2026-08-17T14:12:00.000Z', acknowledged: true },
]

export const reports: Report[] = [
  { id: 'r-01', stationId: 'meri-demo', name: 'MERI_Demo_2025-11-01_2025-11-30.csv', range: 'Nov 01 – Nov 30, 2025', createdAt: '2025-11-30 11:41:48', finishedAt: '2025-11-30 11:43:26', rows: 43200, status: 'Finished' },
  { id: 'r-02', stationId: 'meri-wadi-al-natroun', name: 'MERI_WadiAl-Natroun_2025-10-01_2025-10-31.csv', range: 'Oct 01 – Oct 31, 2025', createdAt: '2025-11-29 09:08:12', finishedAt: '2025-11-29 09:09:40', rows: 44640, status: 'Finished' },
  { id: 'r-03', stationId: 'meri-demo', name: 'MERI_Demo_2025-10-01_2025-10-31.csv', range: 'Oct 01 – Oct 31, 2025', createdAt: '2025-11-12 07:32:13', finishedAt: '2025-11-12 07:37:06', rows: 44640, status: 'Finished' },
  { id: 'r-04', stationId: 'meri-wadi-al-natroun', name: 'MERI_WadiAl-Natroun_2025-09-01_2025-09-30.csv', range: 'Sep 01 – Sep 30, 2025', createdAt: '2025-10-29 19:40:31', finishedAt: '2025-10-29 19:42:12', rows: 43200, status: 'Finished' },
  { id: 'r-05', stationId: 'meri-demo', name: 'MERI_Demo_2025-08-01_2025-08-31.csv', range: 'Aug 01 – Aug 31, 2025', createdAt: '2025-10-27 15:48:17', finishedAt: '2025-10-27 15:48:55', rows: 44640, status: 'Finished' },
  { id: 'r-06', stationId: 'meri-wadi-al-natroun', name: 'MERI_WadiAl-Natroun_2025-07-01_2025-07-31.csv', range: 'Jul 01 – Jul 31, 2025', createdAt: '2025-10-04 07:20:56', finishedAt: '2025-10-04 07:21:00', rows: 44640, status: 'Finished' },
  { id: 'r-07', stationId: 'meri-demo', name: 'MERI_Demo_2025-06-01_2025-06-30.csv', range: 'Jun 01 – Jun 30, 2025', createdAt: '2025-09-30 05:01:23', finishedAt: '2025-09-30 05:02:26', rows: 43200, status: 'Finished' },
]

const stationBase = (stationId: string) => stationId === 'meri-demo' ? 13.78 : 4.36

export function getStation(stationId: string): Station | undefined { return stations.find((station) => station.id === stationId) }

export function getTelemetry(stationId: string, count = 48): TelemetryPoint[] {
  const base = stationBase(stationId)
  return Array.from({ length: count }, (_, index) => {
    const swing = Math.sin(index / 5) * 0.22 + Math.cos(index / 9) * 0.08
    const upstream = Number((base + swing).toFixed(3))
    const timestamp = new Date(Date.now() - (count - index - 1) * 30 * 60 * 1000)
    return {
      timestamp: timestamp.toISOString(),
      label: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      upstream,
      downstream: Number((upstream - 0.43 + Math.sin(index / 3) * 0.04).toFixed(3)),
      battery: Math.max(20, (stationId === 'meri-demo' ? 94 : 70) - Math.floor(index / 28)),
      signal: stationId === 'meri-demo' ? 4 : 3,
      quality: index === count - 11 ? 'suspicious' : 'good',
      anomaly: index === count - 11,
    }
  })
}

export function makeNewTelemetry(stationId: string, previous: TelemetryPoint): TelemetryPoint {
  const movement = (Math.random() - 0.48) * 0.04
  const upstream = Number((previous.upstream + movement).toFixed(3))
  const now = new Date()
  return { ...previous, timestamp: now.toISOString(), label: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), upstream, downstream: Number((upstream - 0.43 + (Math.random() - 0.5) * 0.02).toFixed(3)), quality: 'good', anomaly: false }
}
