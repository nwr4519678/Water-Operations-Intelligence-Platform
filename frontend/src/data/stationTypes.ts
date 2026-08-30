// src/data/stationTypes.ts
// Canonical data model for the Water Telemetry GIS platform.
// English only. No nameAr or language-toggle fields.

export type StationType = 'main' | 'master' | 'rtu';
export type ConnectionState = 'online' | 'warning' | 'offline' | 'unknown';

// Telemetry is optional: all fields undefined until a real telemetry source provides them.
// DO NOT supply placeholder/demo numbers here.
export interface TelemetrySnapshot {
  flowRate?: number | string;
  flowUnit?: string;
  pressure?: number | string;
  waterLevel?: number | string;
  waterQuality?: number | string;
  pumpState?: 'running' | 'stopped' | 'standby';
  batteryLevel?: number;
  signalStrength?: number;
  lastUpdateUtc?: string;
  isSimulated?: boolean;
}

// Future alarm model stub — no fake alarms are populated from CSV data.
export type AlarmType =
  | 'LOW_PRESSURE'
  | 'HIGH_PRESSURE'
  | 'LOW_LEVEL'
  | 'HIGH_LEVEL'
  | 'NO_FLOW'
  | 'LEAK_DETECTED'
  | 'COMMUNICATION_LOSS'
  | 'SENSOR_FAILURE'
  | 'PUMP_FAILURE'
  | 'WATER_QUALITY';

// Future network-topology stub — no pipeline geometry is invented from station coordinates.
export interface NetworkLinkStub {
  fromStationId: string;
  toStationId: string;
  linkType: 'main_canal' | 'distribution' | 'branch' | 'drainage';
  geometryAvailable: false; // always false until real GeoJSON is provided
}

// Optional future network geometry. No instance is created from station
// coordinates; callers must provide real surveyed GeoJSON-derived paths.
export interface NetworkPath {
  id: string;
  path: Array<[number, number]>;
  color?: [number, number, number, number];
  width?: number;
  layer?: 'river' | 'canal' | 'distribution';
}

export interface WaterStation {
  id: string;          // Deterministic internal key (stable between reloads)
  code: string;        // Short display code (e.g., HQ-001, MST-01, RTU-2001)
  name: string;        // Canonical station name
  nameEn?: string;     // English portion from CSV
  nameAr?: string;     // Arabic portion if present in CSV
  type: StationType;
  typeLabel: string;   // Human-readable: 'Main Control Center' | 'Master Station' | 'Field RTU Station'
  region: string;      // Direct from CSV 'Region / Branch / Function'
  latitude: number;
  longitude: number;
  coordinates: [number, number]; // [longitude, latitude] for deck.gl / GeoJSON
  connectionStatus: string;       // Raw CSV value, preserved as-is
  connectionState: ConnectionState;
  telemetrySnapshot?: TelemetrySnapshot;
}

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  centerLng: number;
  centerLat: number;
}

export interface DatasetValidationReport {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  mainCount: number;
  masterCount: number;
  rtuCount: number;
  onlineCount: number;
  warningCount: number;
  offlineCount: number;
  unknownCount: number;
  regions: string[];
  duplicateCount: number;
  duplicateKeys: string[];
  bounds: BoundingBox;
  errors: string[];
}

export function mapDtoToWaterStation(dto: any): WaterStation {
  const code = dto.stationCode || dto.stationId || 'STA';
  const isHQ = dto.category === 'hq' || code.startsWith('HQ');
  const isMaster = dto.category === 'master' || code.startsWith('MST');
  const type: StationType = isHQ ? 'main' : isMaster ? 'master' : 'rtu';
  const typeLabel = isHQ ? 'Main Control Center' : isMaster ? 'Master Station' : 'Field RTU Station';
  const statusStr = String(dto.status || '').toUpperCase();
  const connectionState: ConnectionState =
    statusStr === 'ONLINE' ? 'online' : statusStr === 'MAINTENANCE' ? 'warning' : 'offline';

  const lat = typeof dto.latitude === 'number' ? dto.latitude : parseFloat(dto.latitude) || 27.0;
  const lng = typeof dto.longitude === 'number' ? dto.longitude : parseFloat(dto.longitude) || 31.0;

  return {
    id: String(dto.stationId || code),
    code: String(code),
    name: dto.nameEn || dto.name || code,
    nameEn: dto.nameEn || dto.name,
    nameAr: dto.nameAr,
    type,
    typeLabel,
    region: dto.zoneEn || dto.regionId || 'National Network',
    latitude: lat,
    longitude: lng,
    coordinates: [lng, lat],
    connectionStatus: statusStr,
    connectionState,
    telemetrySnapshot: {
      waterLevel: dto.currentWaterLevel ?? dto.staffGaugeHeight ?? undefined,
      flowRate: dto.flowRate,
      pressure: dto.pressureBar,
      waterQuality: dto.quality,
      lastUpdateUtc: dto.lastReadingUtc ?? undefined,
    }
  };
}

