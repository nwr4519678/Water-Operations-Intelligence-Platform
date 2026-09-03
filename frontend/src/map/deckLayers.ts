// src/map/deckLayers.ts
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers"
import { WaterStation, ConnectionState } from "../data/stationTypes"

export interface DeckLayersOptions {
  stations: WaterStation[]
  selectedStationId?: string | null
  hoveredStationId?: string | null
  onHover?: (info: any) => void
  onClick?: (info: any) => void
  is3d?: boolean
  zoom?: number
  language?: "en" | "ar"
}

type ClusterPoint = {
  station: WaterStation
  stations: WaterStation[]
  count: number
  latitude: number
  longitude: number
}

function clusterRtuStations(stations: WaterStation[], zoom: number): ClusterPoint[] {
  // Keep a cluster roughly within a 32px screen cell.
  const cellSize = Math.max(0.001, (32 * 360) / (256 * 2 ** Math.max(0, zoom)))
  const groups = new Map<string, WaterStation[]>()

  for (const station of stations) {
    const cellX = Math.floor(station.longitude / cellSize)
    const cellY = Math.floor(station.latitude / cellSize)
    const key = `${cellX}:${cellY}`
    const group = groups.get(key) ?? []
    group.push(station)
    groups.set(key, group)
  }

  return [...groups.values()].map((group) => {
    const representative = group.find((station) => station.id === stations[0]?.id) ?? group[0]
    return {
      station: representative,
      stations: group,
      count: group.length,
      latitude: group.reduce((sum, station) => sum + station.latitude, 0) / group.length,
      longitude: group.reduce((sum, station) => sum + station.longitude, 0) / group.length,
    }
  })
}

function getStatusColor(
  state: ConnectionState,
): [number, number, number, number] {
  switch (state) {
    case "online":
      return [16, 185, 129, 240] // #10b981 emerald
    case "warning":
      return [245, 158, 11, 240] // #f59e0b amber
    case "offline":
      return [239, 68, 68, 240]  // #ef4444 red
    default:
      return [100, 116, 139, 220] // #64748b slate
  }
}

// Shared font stack: Inter is pre-installed on Windows/macOS; fallback to system-ui
const LABEL_FONT =
  "'Inter', 'Segoe UI', -apple-system, system-ui, BlinkMacSystemFont, sans-serif"

export function createWaterTelemetryDeckLayers(options: DeckLayersOptions) {
  const {
    stations,
    selectedStationId,
    hoveredStationId,
    onHover,
    onClick,
    is3d = false,
    zoom = 6.5,
    language = "en",
  } = options

  const isAr = language === "ar"

  const hqStations = stations.filter((s) => s.type === "main")
  const masterStations = stations.filter((s) => s.type === "master")
  const rtuStations = stations.filter((s) => s.type === "rtu")
  const rtuClusters = clusterRtuStations(rtuStations, zoom)

  const layers: any[] = []

  // ── Layer 1: Field RTU Stations ──────────────────────────────────────────
  if (rtuClusters.length > 0) {
    // Generous outer picking aura for RTU stations
    layers.push(
      new ScatterplotLayer<ClusterPoint>({
        id: "water-rtu-aura-layer",
        data: rtuClusters,
        pickable: true,
        opacity: 0.3,
        stroked: false,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 14,
        radiusMaxPixels: 24,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: (d) => (d.count > 1 ? Math.min(26, 14 + Math.log2(d.count) * 3) : 15),
        getFillColor: (d) => getStatusColor(d.station.connectionState),
        onHover,
        onClick,
      }),
    )

    // RTU Core dot
    layers.push(
      new ScatterplotLayer<ClusterPoint>({
        id: "water-rtu-layer",
        data: rtuClusters,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        opacity: 0.95,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 8,
        radiusMaxPixels: 18,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: (d) =>
          d.station.id === selectedStationId
            ? 11
            : d.station.id === hoveredStationId
              ? 10
              : d.count > 1
                ? Math.min(22, 8 + Math.log2(d.count) * 3)
                : 8.5,
        getFillColor: (d) => getStatusColor(d.station.connectionState),
        getLineColor: [255, 255, 255, 255],
        getLineWidth: (d) => (d.station.id === selectedStationId ? 2.5 : 1.5),
        lineWidthUnits: "pixels",
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId, zoom],
          getFillColor: [selectedStationId, hoveredStationId],
          getLineWidth: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      }),
    )

    // Cluster count badge labels
    const labeledClusters = rtuClusters.filter((c) => c.count > 1)
    if (labeledClusters.length > 0) {
      layers.push(
        new TextLayer<ClusterPoint>({
          id: "water-rtu-cluster-labels",
          data: labeledClusters,
          pickable: false,
          getPosition: (d) => [d.longitude, d.latitude, 0],
          getText: (d) => String(d.count),
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          fontFamily: LABEL_FONT,
          fontWeight: "900",
        }),
      )
    }
  }

  // ── Layer 2: Master Stations (Large Strategic Nodes) ─────────────────────
  if (masterStations.length > 0) {
    // Outer halo ring (also pickable for easy, accurate hover/click)
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-master-halo-layer",
        data: masterStations,
        pickable: true,
        opacity: 0.4,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 18,
        radiusMaxPixels: 32,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: 22,
        getFillColor: [59, 130, 246, 80],
        getLineColor: [59, 130, 246, 200],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
        onHover,
        onClick,
      }),
    )

    // Master core dot
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-master-core-layer",
        data: masterStations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 10,
        radiusMaxPixels: 18,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: (d) =>
          d.id === selectedStationId
            ? 14
            : d.id === hoveredStationId
              ? 12
              : 10.5,
        getFillColor: (d) => {
          const color = getStatusColor(d.connectionState)
          return d.id === selectedStationId
            ? [Math.max(0, color[0] - 25), Math.max(0, color[1] - 25), Math.max(0, color[2] - 25), 255]
            : color
        },
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2.5,
        lineWidthUnits: "pixels",
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
          getFillColor: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      }),
    )
  }

  // ── Layer 3: HQ / Main Control Center (Sovereign Beacon) ─────────────────
  if (hqStations.length > 0) {
    // Outer beacon ring (also pickable for easy, accurate hover/click)
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-hq-halo-layer",
        data: hqStations,
        pickable: true,
        opacity: 0.45,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 24,
        radiusMaxPixels: 42,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: 28,
        getFillColor: [239, 68, 68, 70],
        getLineColor: [239, 68, 68, 220],
        getLineWidth: 2.5,
        lineWidthUnits: "pixels",
        onHover,
        onClick,
      }),
    )

    // HQ core dot
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-hq-core-layer",
        data: hqStations,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        opacity: 1,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 12,
        radiusMaxPixels: 20,
        getPosition: (d) => [d.longitude, d.latitude, 0],
        getRadius: (d) =>
          d.id === selectedStationId ? 16 : d.id === hoveredStationId ? 14 : 12,
        getFillColor: (d) => getStatusColor(d.connectionState),
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 3,
        lineWidthUnits: "pixels",
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
          getFillColor: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      }),
    )
  }

  return layers
}

