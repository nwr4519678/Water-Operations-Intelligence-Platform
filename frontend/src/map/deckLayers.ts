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
  // Keep a cluster roughly within a 32px screen cell. A fixed geographic
  // cell leaves a misleading "4" visible even at street-level zoom when
  // several nearby stations happen to share that large cell.
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
      return [239, 68, 68, 240] // #ef4444 red
    default:
      return [100, 116, 139, 220] // #64748b slate
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
    language = "en",
  } = options

  const isAr = language === "ar"

  const hqStations = stations.filter((s) => s.type === "main")
  const masterStations = stations.filter((s) => s.type === "master")
  const rtuStations = stations.filter((s) => s.type === "rtu")
  const rtuClusters = clusterRtuStations(rtuStations, zoom)

  const layers: any[] = []

  // ── Layer 1: Field RTU Stations (Distinct, easy-to-click GPU points) ───────
  if (rtuClusters.length > 0) {
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
        radiusMinPixels: zoom > 9 ? 6.5 : zoom > 7 ? 5.5 : 4.5,
        radiusMaxPixels: 12,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 100 : 0],
        getRadius: (d) =>
          d.station.id === selectedStationId
            ? 9
            : d.station.id === hoveredStationId
              ? 7.5
              : d.count > 1
                ? Math.min(20, 6 + Math.log2(d.count) * 3)
                : 5.5,
        getFillColor: (d) => {
          // Selection is communicated by size and outline; preserve the
          // station's health color instead of turning every selected RTU blue.
          return getStatusColor(d.station.connectionState)
        },
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

    const labeledClusters = rtuClusters.filter((cluster) => cluster.count > 1)
    if (labeledClusters.length > 0) {
      layers.push(
        new TextLayer<ClusterPoint>({
          id: "water-rtu-cluster-labels",
          data: labeledClusters,
          pickable: false,
          getPosition: (d) => [d.longitude, d.latitude, is3d ? 110 : 0],
          // A singleton is a station marker, never a numbered cluster.
          getText: (d) => (d.count > 1 ? String(d.count) : ""),
          getSize: 11,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          fontWeight: "bold",
        }),
      )
    }
  }

  // ── Layer 2: Master Stations (Large Prominent Strategic Nodes) ───────────
  if (masterStations.length > 0) {
    // Outer halo
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-master-halo-layer",
        data: masterStations,
        pickable: false,
        opacity: 0.4,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 16,
        radiusMaxPixels: 28,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: 18,
        getFillColor: [59, 130, 246, 80],
        getLineColor: [59, 130, 246, 200],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
      }),
    )

    // Master Core
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
        radiusMinPixels: 9,
        radiusMaxPixels: 16,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 600 : 0],
        getRadius: (d) =>
          d.id === selectedStationId
            ? 13
            : d.id === hoveredStationId
              ? 11
              : 9.5,
        getFillColor: (d) =>
          d.id === selectedStationId ? [30, 64, 175, 255] : [59, 130, 246, 255],
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

  // ── Layer 3: Main Control Center (HQ Sovereign Beacon) ───────────────────
  if (hqStations.length > 0) {
    // Outer Beacon Ring
    layers.push(
      new ScatterplotLayer<WaterStation>({
        id: "water-hq-halo-layer",
        data: hqStations,
        pickable: false,
        opacity: 0.45,
        stroked: true,
        filled: true,
        radiusUnits: "pixels",
        radiusMinPixels: 22,
        radiusMaxPixels: 38,
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: 26,
        getFillColor: [239, 68, 68, 70],
        getLineColor: [239, 68, 68, 220],
        getLineWidth: 2.5,
        lineWidthUnits: "pixels",
      }),
    )

    // HQ Core
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
        getPosition: (d) => [d.longitude, d.latitude, is3d ? 1200 : 0],
        getRadius: (d) =>
          d.id === selectedStationId ? 16 : d.id === hoveredStationId ? 14 : 12,
        getFillColor: [239, 68, 68, 255],
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 3,
        lineWidthUnits: "pixels",
        updateTriggers: {
          getRadius: [selectedStationId, hoveredStationId],
        },
        onHover,
        onClick,
      }),
    )
  }

  // ── Layer 4: Labels for Master & HQ Nodes (Zoom >= 6.8) ───────────────────
  if (zoom >= 6.8) {
    const labeledStations = [...hqStations, ...masterStations]
    layers.push(
      new TextLayer<WaterStation>({
        id: "water-key-node-labels",
        data: labeledStations,
        pickable: false,
        getPosition: (d) => [
          d.longitude,
          d.latitude,
          is3d ? (d.type === "main" ? 1300 : 700) : 0,
        ],
        getText: (d) => (isAr ? d.nameAr || d.name : d.nameEn || d.name),
        getSize: zoom > 9 ? 12 : 10.5,
        getColor: [15, 23, 42, 255],
        getAngle: 0,
        getTextAnchor: "start",
        getAlignmentBaseline: "center",
        getPixelOffset: [16, 0],
        fontFamily: isAr
          ? "'Noto Kufi Arabic', system-ui, sans-serif"
          : "'Manrope', system-ui, sans-serif",
        fontWeight: "bold",
        background: true,
        getBackgroundColor: [255, 255, 255, 230],
        backgroundPadding: [4, 2, 4, 2],
      }),
    )
  }

  return layers
}
