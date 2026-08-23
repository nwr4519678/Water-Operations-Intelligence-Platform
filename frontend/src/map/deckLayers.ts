// src/map/deckLayers.ts
import { ScatterplotLayer } from '@deck.gl/layers';
import { TextLayer } from '@deck.gl/layers';
import { WaterStation, StationType, ConnectionState } from '../data/stationTypes';

export interface DeckLayersOptions {
  stations: WaterStation[];
  selectedStationId?: string | null;
  hoveredStationId?: string | null;
  onHover?: (info: any) => void;
  onClick?: (info: any) => void;
  is3d?: boolean;
  zoom?: number;
  language?: 'en' | 'ar';
}

function getStatusColor(state: ConnectionState): [number, number, number, number] {
  switch (state) {
    case 'online':
      return [16, 185, 129, 230]; // #10b981 emerald
    case 'warning':
      return [245, 158, 11, 230]; // #f59e0b amber
    case 'offline':
      return [239, 68, 68, 230];  // #ef4444 red
    default:
      return [100, 116, 139, 200]; // #64748b slate
  }
}

export function createWaterTelemetryDeckLayers(options: DeckLayersOptions) {
  const {
    stations,
    selectedStationId,
    hoveredStationId,
    onHover,
    onClick,
    is3d = false,
    zoom = 6.5,
    language = 'en',
  } = options;

  const isAr = language === 'ar';

  const hqStations = stations.filter((s) => s.type === 'main');
  const masterStations = stations.filter((s) => s.type === 'master');
  const rtuStations = stations.filter((s) => s.type === 'rtu');

  const layers: any[] = [];

  // ── Layer 1: Field RTU Stations (Dense GPU Scatterplot) ───────────────────
  if (rtuStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'water-rtu-layer',
        data: rtuStations,
        pickable: true,
        opacity: 0.95,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: zoom > 10 ? 5 : zoom > 7 ? 4 : 3,
        radiusMaxPixels: 9,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 100 : 0],
        getRadius: (d) => (d.id === selectedStationId ? 8 : d.id === hoveredStationId ? 6 : 4),
        getFillColor: (d) => {
          if (d.id === selectedStationId) return [37, 99, 235, 255]; // Royal Blue selection
          return getStatusColor(d.connectionState);
        },
        getLineColor: (d) => {
          if (d.id === selectedStationId) return [255, 255, 255, 255];
          if (d.id === hoveredStationId) return [255, 255, 255, 240];
          return [255, 255, 255, 180];
        },
        getLineWidth: (d) => (d.id === selectedStationId ? 2.5 : d.id === hoveredStationId ? 2 : 1.2),
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId, zoom],
          getFillColor: [selectedStationId, hoveredStationId],
          getLineColor: [selectedStationId, hoveredStationId],
          getLineWidth: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── Layer 2: Master Stations Halo (Outer Pulsing / Glow) ─────────────────
  if (masterStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'water-master-halo-layer',
        data: masterStations,
        pickable: false,
        opacity: 0.35,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: 12,
        radiusMaxPixels: 24,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: 16,
        getFillColor: [59, 130, 246, 70],
        getLineColor: [59, 130, 246, 160],
        getLineWidth: 1.5,
        lineWidthUnits: 'pixels',
      })
    );

    // Master Stations Core Node
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'water-master-core-layer',
        data: masterStations,
        pickable: true,
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: 7,
        radiusMaxPixels: 14,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: (d) => (d.id === selectedStationId ? 11 : d.id === hoveredStationId ? 9 : 7.5),
        getFillColor: (d) => (d.id === selectedStationId ? [30, 64, 175, 255] : [59, 130, 246, 255]),
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
          getFillColor: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── Layer 3: Main Control Center (HQ Sovereign Beacon) ───────────────────
  if (hqStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'water-hq-halo-layer',
        data: hqStations,
        pickable: false,
        opacity: 0.45,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: 16,
        radiusMaxPixels: 32,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: 22,
        getFillColor: [239, 68, 68, 60],
        getLineColor: [239, 68, 68, 180],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
      })
    );

    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'water-hq-core-layer',
        data: hqStations,
        pickable: true,
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: 9,
        radiusMaxPixels: 18,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: (d) => (d.id === selectedStationId ? 13 : d.id === hoveredStationId ? 11 : 9.5),
        getFillColor: [239, 68, 68, 255], // Red sovereign center
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── Layer 4: Labels for Master & HQ Nodes (Zoom >= 6.8) ───────────────────
  if (zoom >= 6.8) {
    const labeledStations = [...hqStations, ...masterStations];
    layers.push(
      new TextLayer<WaterStation>({
        id: 'water-key-node-labels',
        data: labeledStations,
        pickable: false,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? (d.type === 'main' ? 1300 : 700) : 0],
        getText: (d) => (isAr ? d.nameAr || d.name : d.nameEn || d.name),
        getSize: zoom > 9 ? 12 : 10.5,
        getColor: [15, 23, 42, 255],
        getAngle: 0,
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [14, 0],
        fontFamily: isAr ? "'Noto Kufi Arabic', system-ui, sans-serif" : "'Manrope', system-ui, sans-serif",
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: [255, 255, 255, 225],
        backgroundPadding: [4, 2, 4, 2],
      })
    );
  }

  return layers;
}
