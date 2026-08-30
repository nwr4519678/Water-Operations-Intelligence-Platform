// src/map/mapConstants.ts
// Centralised visualization configuration for the Water Telemetry GIS Platform.
// All colours, zoom thresholds, layer IDs, and tier sizes live here.

// ── Status colour palette ──────────────────────────────────────────────────────
export const STATUS_COLORS = {
  online:  [16,  185, 129, 240] as [number, number, number, number],
  warning: [245, 158,  11, 240] as [number, number, number, number],
  offline: [239,  68,  68, 240] as [number, number, number, number],
  unknown: [100, 116, 139, 220] as [number, number, number, number],
} as const;

export const STATUS_CSS: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  online:  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  ring: 'border-emerald-200', dot: 'bg-emerald-500'  },
  warning: { bg: 'bg-amber-50',    text: 'text-amber-700',    ring: 'border-amber-200',   dot: 'bg-amber-500'    },
  offline: { bg: 'bg-red-50',      text: 'text-red-700',      ring: 'border-red-200',     dot: 'bg-red-500'      },
  unknown: { bg: 'bg-slate-50',    text: 'text-slate-600',    ring: 'border-slate-200',   dot: 'bg-slate-400'    },
};

// ── Tier colours ───────────────────────────────────────────────────────────────
export const TIER_COLORS = {
  main:   { fill: [220,  38,  38, 255] as [number, number, number, number], halo: [239, 68,  68,  70] as [number, number, number, number], haloRing: [239, 68,  68, 200] as [number, number, number, number] },
  master: { fill: [37,   99, 235, 255] as [number, number, number, number], halo: [59, 130, 246,  80] as [number, number, number, number], haloRing: [59, 130, 246, 200] as [number, number, number, number] },
  rtu:    { fill: [16,  185, 129, 240] as [number, number, number, number] },
} as const;

// ── LOD zoom thresholds ────────────────────────────────────────────────────────
export const LOD = {
  NATIONAL:  7.0,
  REGIONAL:  9.0,
  LOCAL:    12.0,
} as const;

export type LodLevel = 'national' | 'regional' | 'local' | 'detail';

export function getLodLevel(zoom: number): LodLevel {
  if (zoom < LOD.NATIONAL) return 'national';
  if (zoom < LOD.REGIONAL)  return 'regional';
  if (zoom < LOD.LOCAL)     return 'local';
  return 'detail';
}

// ── Layer sizes ────────────────────────────────────────────────────────────────
export const LAYER_SIZES = {
  rtu:    { national: 0, regional: 3.5, local: 5.0, detail: 6.5, selected: 9.0, hovered: 7.5 },
  master: { core: 9.5, selected: 13.0, hovered: 11.0, halo: 18.0 },
  hq:     { core: 12.0, selected: 16.0, hovered: 14.0, halo: 26.0 },
} as const;

// ── Layer IDs ─────────────────────────────────────────────────────────────────
export const LAYER_IDS = {
  rtuCore:      'wt-rtu-core',
  rtuDensity:   'wt-rtu-density',
  masterHalo:   'wt-master-halo',
  masterCore:   'wt-master-core',
  masterLabels: 'wt-master-labels',
  hqHalo:       'wt-hq-halo',
  hqCore:       'wt-hq-core',
  hqLabel:      'wt-hq-label',
  allLabels:    'wt-all-labels',
  networkPaths: 'wt-network-paths',
  alarmBeacons: 'wt-alarm-beacons',
} as const;

// ── Connection-state normalizer ────────────────────────────────────────────────
// Deterministic: classifies raw CSV connection-status strings.
// UNKNOWN is the fallback for any unrecognised value.
// A value is NEVER classified as offline merely because it is unrecognised.
export type ConnectionState = 'online' | 'warning' | 'offline' | 'unknown';

export function normalizeConnectionStatus(raw: string): ConnectionState {
  const s = (raw ?? '').toLowerCase().trim();
  if (!s) return 'unknown';
  if (s.includes('offline') || s.includes('disconnected') || s.includes('loss') || s.includes('fail')) return 'offline';
  if (s.includes('warning') || s.includes('degraded') || s.includes('maintenance') || s.includes('intermittent')) return 'warning';
  if (
    s.includes('stable') || s.includes('live') || s.includes('online') ||
    s.includes('transmission') || s.includes('satellite') ||
    s.includes('gsm') || s.includes('gprs') || s.includes('4g') || s.includes('3g') || s.includes('active')
  ) return 'online';
  return 'unknown';
}

// ── Deterministic station ID ───────────────────────────────────────────────────
// Stable between reloads: derived only from immutable CSV fields.
// This is an internal technical key, NOT a user-facing label.
export function createDeterministicStationId(params: {
  type: 'main' | 'master' | 'rtu';
  name: string;
  latitude: number;
  longitude: number;
}): string {
  const { type, name, latitude, longitude } = params;
  const coordHash = Math.abs(
    Math.round(latitude * 10000) * 31 + Math.round(longitude * 10000)
  ).toString(16).slice(0, 6).toUpperCase();
  const prefix = type === 'main' ? 'HQ' : type === 'master' ? 'MST' : 'RTU';
  const slug = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return prefix + '-' + slug + '-' + coordHash;
}
