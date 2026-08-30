import { NetworkPath, WaterStation } from '../data/stationTypes';

// Cartographic reference overlay for the operator map. These corridors are
// intentionally labelled as schematic until surveyed GeoJSON is supplied.
// They provide the network context requested by the operations UI; they are
// not telemetry, hydraulic measurements, or an engineering design authority.
export const SCHEMATIC_WATERWAYS: NetworkPath[] = [
  { id: 'nile-main-stem', layer: 'river', color: [45, 205, 230, 220], width: 4, path: [[31.23,30.05],[30.98,29.72],[30.75,29.30],[30.65,28.80],[30.80,28.10],[31.18,27.18],[31.42,26.56],[32.08,25.72],[32.64,25.69],[32.89,25.69],[32.90,24.10]] },
  { id: 'delta-west-branch', layer: 'river', color: [119, 172, 255, 205], width: 3, path: [[31.23,30.05],[30.92,30.28],[30.72,30.56],[30.58,30.72],[30.47,30.82]] },
  { id: 'delta-east-branch', layer: 'river', color: [119, 172, 255, 205], width: 3, path: [[31.23,30.05],[31.45,30.28],[31.66,30.55],[31.82,30.84],[31.82,31.18]] },
  { id: 'delta-north-channel', layer: 'canal', color: [185, 127, 255, 190], width: 2.2, path: [[30.95,30.15],[31.25,30.20],[31.62,30.23],[31.98,30.31],[32.31,30.43]] },
  { id: 'cairo-ismaïlia-corridor', layer: 'canal', color: [185, 127, 255, 185], width: 2.4, path: [[31.23,30.05],[31.50,30.08],[31.83,30.12],[32.20,30.28],[32.55,30.58]] },
  { id: 'upper-egypt-canal-corridor', layer: 'canal', color: [185, 127, 255, 170], width: 2, path: [[31.20,29.80],[31.30,29.20],[31.38,28.52],[31.38,27.88],[31.55,27.32],[31.82,26.75],[32.20,26.25]] },
];

function distanceSquared(a: WaterStation, b: WaterStation) {
  const latScale = Math.cos(((a.latitude + b.latitude) / 2) * Math.PI / 180);
  return ((a.longitude - b.longitude) * latScale) ** 2 + (a.latitude - b.latitude) ** 2;
}

// A deliberately low-opacity visual topology built from the authoritative
// station coordinates. It is useful for orientation only and is never shown
// as surveyed pipe geometry or used for telemetry calculations.
export function buildSchematicDistributionPaths(stations: WaterStation[]): NetworkPath[] {
  const parents = stations.filter((station) => station.type === 'main' || station.type === 'master');
  if (!parents.length) return [];
  return stations
    .filter((station) => station.type === 'rtu')
    .map((station) => {
      const parent = parents.reduce((best, candidate) => distanceSquared(station, candidate) < distanceSquared(station, best) ? candidate : best, parents[0]);
      return {
        id: `distribution-${station.id}`,
        layer: 'distribution' as const,
        color: [72, 221, 190, 95] as [number, number, number, number],
        width: 1,
        path: [[station.longitude, station.latitude], [parent.longitude, parent.latitude]] as Array<[number, number]>,
      };
    });
}
