// src/map/deckLayers.ts
// deck.gl layer factory for the Water Telemetry GIS platform.
// High-performance GPU geospatial layers with dynamic Level-of-Detail (LOD).
import { ScatterplotLayer, TextLayer, PathLayer, ColumnLayer } from '@deck.gl/layers';
import { WaterStation, ConnectionState, NetworkPath } from '../data/stationTypes';
import { SCHEMATIC_WATERWAYS } from './waterNetworkData';
import {
  STATUS_COLORS,
  TIER_COLORS,
  LAYER_SIZES,
  LAYER_IDS,
  LOD,
  getLodLevel,
} from './mapConstants';

export interface DeckLayersOptions {
  stations: WaterStation[];
  selectedStationId?: string | null;
  hoveredStationId?: string | null;
  onHover?: (info: any) => void;
  onClick?: (info: any) => void;
  is3d?: boolean;
  zoom?: number;
  networkPaths?: NetworkPath[];
  showWaterNetwork?: boolean;
  showDistribution?: boolean;
}

function getStatusColor(state: ConnectionState): [number, number, number, number] {
  return STATUS_COLORS[state] ?? STATUS_COLORS.unknown;
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
    networkPaths = [],
    showWaterNetwork = true,
    showDistribution = true,
  } = options;

  const lod = getLodLevel(zoom);
  const hqStations     = stations.filter((s) => s.type === 'main');
  const masterStations = stations.filter((s) => s.type === 'master');
  const rtuStations    = stations.filter((s) => s.type === 'rtu');
  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const layers: any[] = [];

  // Future topology layer: deliberately empty for the current CSV-only
  // dataset. It becomes active only when real surveyed network paths arrive.
  const waterPaths = showWaterNetwork ? [...SCHEMATIC_WATERWAYS, ...networkPaths.filter((path) => path.layer !== 'distribution')] : [];
  if (waterPaths.length > 0) {
    layers.push(
      new PathLayer<NetworkPath>({
        id: LAYER_IDS.networkPaths,
        data: waterPaths,
        pickable: false,
        getPath: (d) => d.path,
        getColor: (d) => d.color ?? [37, 99, 235, 150],
        getWidth: (d) => d.width ?? 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        billboard: true,
        jointRounded: true,
        capRounded: true,
      })
    );
  }

  const distributionPaths = showDistribution ? networkPaths.filter((path) => path.layer === 'distribution') : [];
  if (distributionPaths.length > 0) {
    layers.push(
      new PathLayer<NetworkPath>({
        id: 'wt-distribution-network',
        data: distributionPaths,
        pickable: false,
        getPath: (d) => d.path,
        getColor: (d) => d.color ?? [72, 221, 190, 95],
        getWidth: (d) => d.width ?? 1,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        opacity: 0.8,
        billboard: true,
        jointRounded: true,
        capRounded: true,
      })
    );
  }

  // Operational 3D hierarchy: deck.gl columns encode network responsibility,
  // not fabricated telemetry. HQ/master/RTU elevations remain readable while
  // orbiting the oblique MapLibre camera.
  if (is3d && stations.length > 0) {
    layers.push(
      new ColumnLayer<WaterStation>({
        id: 'wt-operational-hierarchy-columns',
        data: stations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 220],
        diskResolution: 16,
        radius: 1200,
        extruded: true,
        elevationScale: 0.7,
        getPosition: (d) => [d.longitude, d.latitude],
        getElevation: (d) => d.type === 'main' ? 1800 : d.type === 'master' ? 900 : 180,
        getFillColor: (d) => {
          if (d.id === selectedStationId) return [37, 99, 235, 230];
          if (d.type === 'main') return [239, 68, 68, 220];
          if (d.type === 'master') return [37, 99, 235, 210];
          return getStatusColor(d.connectionState);
        },
        getLineColor: [255, 255, 255, 170],
        getLineWidth: 1,
        onHover,
        onClick,
        updateTriggers: { getFillColor: [selectedStationId] },
      })
    );
  }

  // ── RTU DENSITY REPRESENTATION (national zoom < LOD.NATIONAL) ────────────────
  // At national scale, RTUs are rendered as high-performance semi-transparent density dots
  if (lod === 'national' && rtuStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.rtuDensity,
        data: rtuStations,
        pickable: false,
        opacity: 0.4,
        stroked: false,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: 2.0,
        radiusMaxPixels: 3.5,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: 2.5,
        getFillColor: [16, 185, 129, 140],
      })
    );
  }

  // ── FIELD RTU STATIONS (regional, local, detail LOD) ─────────────────────────
  if (lod !== 'national' && rtuStations.length > 0) {
    const baseRadius =
      lod === 'regional' ? LAYER_SIZES.rtu.regional :
      lod === 'local'    ? LAYER_SIZES.rtu.local    :
                           LAYER_SIZES.rtu.detail;

    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.rtuCore,
        data: rtuStations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        opacity: 0.95,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: baseRadius,
        radiusMaxPixels: LAYER_SIZES.rtu.selected + 2,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 120 : 0],
        getRadius: (d) =>
          d.id === selectedStationId ? LAYER_SIZES.rtu.selected :
          d.id === hoveredStationId  ? LAYER_SIZES.rtu.hovered  :
          baseRadius,
        getFillColor: (d) => {
          if (d.id === selectedStationId) return [37, 99, 235, 255];
          return getStatusColor(d.connectionState);
        },
        getLineColor: (d) =>
          d.id === selectedStationId ? [255, 255, 255, 255] : [255, 255, 255, 200],
        getLineWidth: (d) => (d.id === selectedStationId ? 2.5 : 1.2),
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius:    [selectedStationId, hoveredStationId, lod],
          getFillColor: [selectedStationId],
          getLineColor: [selectedStationId],
          getLineWidth: [selectedStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── MASTER STATION HALO (all LOD levels) ─────────────────────────────────────
  if (masterStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.masterHalo,
        data: masterStations,
        pickable: false,
        opacity: 0.4,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: LAYER_SIZES.master.halo - 2,
        radiusMaxPixels: LAYER_SIZES.master.halo + 10,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: LAYER_SIZES.master.halo,
        getFillColor: TIER_COLORS.master.halo,
        getLineColor: TIER_COLORS.master.haloRing,
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
      })
    );

    // Master core
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.masterCore,
        data: masterStations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 200],
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: LAYER_SIZES.master.core,
        radiusMaxPixels: LAYER_SIZES.master.selected + 4,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: (d) =>
          d.id === selectedStationId ? LAYER_SIZES.master.selected :
          d.id === hoveredStationId  ? LAYER_SIZES.master.hovered  :
          LAYER_SIZES.master.core,
        getFillColor: (d) =>
          d.id === selectedStationId ? [30, 64, 175, 255] : TIER_COLORS.master.fill,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius:    [selectedStationId, hoveredStationId],
          getFillColor: [selectedStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── HQ STATION (all LOD levels) ───────────────────────────────────────────────
  if (hqStations.length > 0) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.hqHalo,
        data: hqStations,
        pickable: false,
        opacity: 0.45,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: LAYER_SIZES.hq.halo - 4,
        radiusMaxPixels: LAYER_SIZES.hq.halo + 14,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: LAYER_SIZES.hq.halo,
        getFillColor: TIER_COLORS.main.halo,
        getLineColor: TIER_COLORS.main.haloRing,
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
      })
    );

    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: LAYER_IDS.hqCore,
        data: hqStations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 200],
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: 'pixels',
        radiusMinPixels: LAYER_SIZES.hq.core,
        radiusMaxPixels: LAYER_SIZES.hq.selected + 4,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: (d) =>
          d.id === selectedStationId ? LAYER_SIZES.hq.selected :
          d.id === hoveredStationId  ? LAYER_SIZES.hq.hovered  :
          LAYER_SIZES.hq.core,
        getFillColor: TIER_COLORS.main.fill,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 3,
        lineWidthUnits: 'pixels',
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      })
    );
  }

  // ── SELECTION TARGET RING ───────────────────────────────────────────────────
  if (selectedStation) {
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: 'wt-selection-pulse-ring',
        data: [selectedStation],
        pickable: false,
        opacity: 0.8,
        stroked: true,
        filled: false,
        radiusUnits: 'pixels',
        getPosition: (d) => [d.longitude, d.latitude, is3d ? (d.type === 'main' ? 1200 : d.type === 'master' ? 600 : 120) : 0],
        getRadius: selectedStation.type === 'main' ? 34 : selectedStation.type === 'master' ? 24 : 16,
        getLineColor: [37, 99, 235, 240],
        getLineWidth: 2.5,
        lineWidthUnits: 'pixels',
      })
    );
  }

  // ── HQ LABEL (always visible) ─────────────────────────────────────────────────
  if (hqStations.length > 0) {
    layers.push(
      new TextLayer<WaterStation>({
        id: LAYER_IDS.hqLabel,
        data: hqStations,
        pickable: false,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1300 : 0],
        getText: (d) => d.nameEn ?? d.name,
        getSize: 11.5,
        getColor: [15, 23, 42, 255],
        getAngle: 0,
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [20, 0],
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: [255, 255, 255, 230],
        backgroundPadding: [5, 3, 5, 3],
      })
    );
  }

  // ── MASTER LABELS (zoom >= LOD.NATIONAL) ─────────────────────────────────────
  if (zoom >= LOD.NATIONAL && masterStations.length > 0) {
    layers.push(
      new TextLayer<WaterStation>({
        id: LAYER_IDS.masterLabels,
        data: masterStations,
        pickable: false,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 700 : 0],
        getText: (d) => d.nameEn ?? d.name,
        getSize: zoom > 9 ? 11 : 9.5,
        getColor: [15, 23, 42, 230],
        getAngle: 0,
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [16, 0],
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: [255, 255, 255, 210],
        backgroundPadding: [4, 2, 4, 2],
        updateTriggers: { getSize: [zoom] },
      })
    );
  }

  // ── RTU LABELS (detail LOD only, zoom >= LOD.LOCAL) ──────────────────────────
  if (zoom >= LOD.LOCAL && rtuStations.length > 0) {
    layers.push(
      new TextLayer<WaterStation>({
        id: LAYER_IDS.allLabels,
        data: rtuStations,
        pickable: false,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 200 : 0],
        getText: (d) => d.nameEn ?? d.name,
        getSize: 9,
        getColor: [30, 41, 59, 220],
        getAngle: 0,
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getPixelOffset: [10, 0],
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        fontWeight: '600',
        background: true,
        getBackgroundColor: [255, 255, 255, 200],
        backgroundPadding: [3, 1, 3, 1],
      })
    );
  }

  return layers;
}
