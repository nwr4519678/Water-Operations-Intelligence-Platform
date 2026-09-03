// src/components/map/MapLibreDeckMap.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Map as MapLibreMap, NavigationControl, Popup } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { WaterStation, BoundingBox } from "../../data/stationTypes"
import { createWaterTelemetryDeckLayers } from "../../map/deckLayers"
import { RotateCcw, AlertTriangle, Layers, Check } from "lucide-react"

export interface MapLibreDeckMapProps {
  stations: WaterStation[]
  bounds?: BoundingBox
  selectedStationId?: string | null
  onSelectStation?: (station: WaterStation) => void
  language?: "en"
  height?: string
}

export type BasemapThemeKey = "osm" | "humanitarian" | "satellite" | "topo"

// OSM standard tiles look visually identical to Carto Voyager (same OSM data, same cartographic
// palette: cream land, vivid blue water, clean roads). Free, no API key, no watermark.
export const BASEMAP_OPTIONS: {
  key: BasemapThemeKey
  label: string
  icon: string
  description: string
  style: Record<string, any>
}[] = [
  {
    key: "osm",
    label: "Hydrology",
    icon: "🌊",
    // Esri World Street Map — English labels worldwide, vibrant blue water, clean modern style
    description: "Clean modern basemap — English labels, vibrant blue water bodies, crisp road network",
    style: {
      version: 8,
      sources: {
        "esri-street": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "esri-street-layer",
          type: "raster",
          source: "esri-street",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  {
    key: "humanitarian",
    label: "Humanitarian",
    icon: "🗺️",
    // OSM Humanitarian — same OSM data with extra emphasis on water & infrastructure
    description: "Humanitarian OSM style — enhanced water & infrastructure visibility",
    style: {
      version: 8,
      sources: {
        "osm-hot": {
          type: "raster",
          tiles: [
            "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors, Tiles courtesy of Humanitarian OpenStreetMap Team",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "osm-hot-layer",
          type: "raster",
          source: "osm-hot",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  {
    key: "satellite",
    label: "Satellite",
    icon: "🛰️",
    description: "High-resolution satellite imagery — Esri World Imagery",
    style: {
      version: 8,
      sources: {
        "esri-imagery": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles © Esri, Maxar, Earthstar Geographics",
          maxzoom: 18,
        },
      },
      layers: [
        {
          id: "esri-imagery-layer",
          type: "raster",
          source: "esri-imagery",
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    },
  },
  {
    key: "topo",
    label: "Topographic",
    icon: "⛰️",
    description: "Detailed elevation contours, terrain relief & physical geography",
    style: {
      version: 8,
      sources: {
        "esri-topo": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles © Esri, USGS, Garmin",
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "esri-topo-layer",
          type: "raster",
          source: "esri-topo",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
]

function buildPopupHtml(station: WaterStation) {
  const name = station.nameEn || station.name
  const level = station.telemetrySnapshot?.waterLevel ?? "—"
  const formattedLevel = typeof level === "number" ? `${level.toFixed(2)} m` : level !== "—" ? `${level} m` : "—"
  const isOnline = station.connectionState === "online"
  const isWarning = station.connectionState === "warning"
  const statusColor = isOnline ? "#059669" : isWarning ? "#d97706" : "#dc2626"
  const statusBg = isOnline ? "rgba(16,185,129,0.12)" : isWarning ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)"
  const statusBorder = isOnline ? "rgba(16,185,129,0.3)" : isWarning ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"

  return `
    <div style="font-family: 'Inter', -apple-system, system-ui, sans-serif; min-width: 250px; text-align: left; color: #0f172a; padding: 2px;">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px; padding-right: 24px;">
        <div>
          <span style="font-weight: 800; font-size: 13.5px; display: block; color: #0f172a; line-height: 1.25; letter-spacing: -0.01em;">${name}</span>
          <span style="font-weight: 600; font-size: 10.5px; color: #64748b; display: block; margin-top: 2px;">${station.region} · National Node</span>
        </div>
        <span style="font-size: 9.5px; padding: 2px 7px; border-radius: 6px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, monospace; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; flex-shrink: 0;">${station.code}</span>
      </div>

      <div style="background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin: 8px 0;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;">Water Elevation</span>
          <span style="font-weight: 900; font-size: 16px; color: #0369a1; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: -0.02em;">${formattedLevel}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
          <span style="color: #64748b; font-weight: 600;">System Health</span>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 800; font-size: 10px; color: ${statusColor}; text-transform: uppercase; padding: 2px 7px; border-radius: 9999px; background: ${statusBg}; border: 1px solid ${statusBorder};">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></span>
            ${station.connectionState}
          </span>
        </div>
      </div>

      <div style="display: flex; gap: 6px; margin-top: 8px;">
        <button
          type="button"
          onclick="window.__navigateToStation && window.__navigateToStation('${station.id}')"
          style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: #ffffff; background: #2563eb; font-weight: 800; padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 2px 4px rgba(37,99,235,0.25);"
          onmouseover="this.style.background='#1d4ed8';"
          onmouseout="this.style.background='#2563eb';"
        >
          <span>Deep Telemetry Analytics ↗</span>
        </button>
      </div>
    </div>
  `
}

export const MapLibreDeckMap: React.FC<MapLibreDeckMapProps> = ({
  stations,
  bounds,
  selectedStationId,
  onSelectStation,
  height = "560px",
}) => {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const deckOverlayRef = useRef<MapboxOverlay | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const lastMapZoomRef = useRef(6.2)

  const [activeBasemap, setActiveBasemap] = useState<BasemapThemeKey>("osm")
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false)
  const [zoom, setZoom] = useState<number>(6.2)
  const [isMapReady, setIsMapReady] = useState<boolean>(false)
  const activePopupStationIdRef = useRef<string | null>(null)
  const [hoveredStation, setHoveredStation] = useState<WaterStation | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true)

  // Global Bridge for Popup Click to React Router
  useEffect(() => {
    ;(window as any).__navigateToStation = (stationId: string) => {
      navigate(`/stations/${stationId}`)
    }
    return () => {
      delete (window as any).__navigateToStation
    }
  }, [navigate])

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas")
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) setWebGlAvailable(false)
    } catch {
      setWebGlAvailable(false)
    }
  }, [])

  // Compute default center from bounds
  const defaultCenter = useMemo<[number, number]>(() => {
    if (bounds) return [bounds.centerLng, bounds.centerLat]
    return [30.8, 27.2]
  }, [bounds])

  // Function to show popup on map
  const showStationPopup = useCallback((st: WaterStation) => {
    if (!mapInstanceRef.current) return
    setHoveredStation(null)
    setHoverPos(null)

    // 1. Remove previous popup instance so they never stack up
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    // 2. Clear any stray popup DOM nodes in map container
    const container = mapContainerRef.current
    if (container) {
      const existing = container.querySelectorAll(".maplibregl-popup")
      existing.forEach((el) => el.remove())
    }

    // 3. Create fresh single popup instance with closeOnClick: false (so clicks don't accidentally dismiss it)
    const popup = new Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: "bottom",
      offset: [0, -12],
      maxWidth: "360px",
    })
    popup.addClassName("water-primary-popup")
    popup.on("close", () => {
      popupRef.current = null
      activePopupStationIdRef.current = null
    })
    popupRef.current = popup
    activePopupStationIdRef.current = st.id

    popup
      .setLngLat([st.longitude, st.latitude])
      .setHTML(buildPopupHtml(st))
      .addTo(mapInstanceRef.current)

    const popupElement = popup.getElement()
    popupElement?.classList.add("water-primary-popup")
    popupElement?.style.setProperty("z-index", "1000", "important")
  }, [])

  // Switch basemap layer dynamically
  const switchBasemap = useCallback((key: BasemapThemeKey) => {
    setActiveBasemap(key)
    setShowBasemapMenu(false)
    const map = mapInstanceRef.current
    if (!map) return
    const cfg = BASEMAP_OPTIONS.find((b) => b.key === key)
    if (!cfg) return

    try {
      map.setStyle(cfg.style as any)
    } catch (err) {
      console.warn("Failed to switch basemap:", err)
    }
  }, [])

  // 1. Initialize MapLibre GL Map (Clean & Rich Hydrology — Zero Watermark)
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return
    if (!webGlAvailable) return

    const initialConfig = BASEMAP_OPTIONS.find((b) => b.key === "osm") || BASEMAP_OPTIONS[0]

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: initialConfig.style as any,
      center: defaultCenter,
      zoom: 6.2,
      pitch: 0,
      bearing: 0,
      maxPitch: 0,
      dragRotate: false,
      touchPitch: false,
      renderWorldCopies: false,
    })

    map.addControl(new NavigationControl({ showCompass: false, showZoom: true }), "top-left")

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
    })

    map.addControl(overlay as any)
    deckOverlayRef.current = overlay
    mapInstanceRef.current = map

    // Eliminate default MapLibre control margins (10px, 10px) so Deck.gl canvas aligns 100% vertically with map coordinates
    const overlayContainer = (overlay as any)._container
    if (overlayContainer) {
      overlayContainer.style.margin = "0"
      overlayContainer.style.top = "0"
      overlayContainer.style.left = "0"
      if (overlayContainer.parentElement) {
        overlayContainer.parentElement.style.margin = "0"
        overlayContainer.parentElement.style.padding = "0"
        overlayContainer.parentElement.style.top = "0"
        overlayContainer.parentElement.style.left = "0"
      }
    }

    map.on("zoomend", () => {
      setZoom(map.getZoom())
    })

    map.on("load", () => {
      setIsMapReady(true)
    })

    map.on("styledata", () => {
      setIsMapReady(true)
    })

    map.on("click", () => {
      setHoveredStation(null)
      setHoverPos(null)
    })

    const canvasEl = map.getCanvas()
    const onCanvasLeave = () => {
      setHoveredStation(null)
      setHoverPos(null)
      if (canvasEl) canvasEl.style.cursor = ""
    }
    canvasEl.addEventListener("mouseleave", onCanvasLeave)

    if (bounds) {
      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 45, maxZoom: 8.5, duration: 1000 }
      )
    }

    return () => {
      if (popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }
      if (deckOverlayRef.current) {
        deckOverlayRef.current.finalize()
        deckOverlayRef.current = null
      }
      map.remove()
      mapInstanceRef.current = null
    }
  }, [webGlAvailable])

  // Handle deck.gl Hover & Click
  const handleHover = useCallback((info: any) => {
    const object = info.object as { count?: number; station?: WaterStation } | WaterStation | undefined
    const count = object && "count" in object ? object.count ?? 1 : 1
    const station = object && (object as any).station
      ? ((object as any).station as WaterStation)
      : (object as WaterStation | undefined)

    // Visual pointer feedback on canvas
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getCanvas().style.cursor = (station || count > 1) ? "pointer" : ""
    }

    if (!station || count > 1 || popupRef.current) {
      setHoveredStation(null)
      setHoverPos(null)
      return
    }

    setHoveredStation(station)
    if (mapInstanceRef.current) {
      const pt = mapInstanceRef.current.project([station.longitude, station.latitude])
      setHoverPos({ x: pt.x, y: pt.y })
    } else if (info.x != null && info.y != null) {
      setHoverPos({ x: info.x, y: info.y })
    }
  }, [])

  const handleClick = useCallback((info: any) => {
    setHoveredStation(null)
    setHoverPos(null)

    const object = info.object as { count?: number; station?: WaterStation; stations?: WaterStation[] } | WaterStation | undefined
    if (!object || !mapInstanceRef.current) return

    if ("count" in object && (object.count ?? 1) > 1 && object.stations) {
      const lats = object.stations.map((s) => s.latitude)
      const lngs = object.stations.map((s) => s.longitude)
      mapInstanceRef.current.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, maxZoom: 12, duration: 800 }
      )
      const primaryStation = object.stations[0]
      if (primaryStation) {
        showStationPopup(primaryStation)
        if (onSelectStation) {
          onSelectStation(primaryStation)
        }
      }
      return
    }

    const station = ("station" in object && object.station ? object.station : object) as WaterStation
    if (!station.id || !Number.isFinite(station.latitude) || !Number.isFinite(station.longitude)) return

    mapInstanceRef.current.flyTo({
      center: [station.longitude, station.latitude],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 10.5),
      duration: 700,
      essential: true,
    })

    showStationPopup(station)

    if (onSelectStation) {
      onSelectStation(station)
    }
  }, [onSelectStation, showStationPopup])

  // 2. Update deck.gl layers
  useEffect(() => {
    if (!deckOverlayRef.current) return

    const layers = createWaterTelemetryDeckLayers({
      stations,
      selectedStationId,
      hoveredStationId: hoveredStation?.id || null,
      onHover: handleHover,
      onClick: handleClick,
      is3d: false,
      zoom,
      language: "en",
    })

    deckOverlayRef.current.setProps({ layers })
  }, [
    stations,
    selectedStationId,
    hoveredStation,
    zoom,
    handleHover,
    handleClick,
  ])

  // Refit map when authoritative bounds arrive
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !bounds) return
    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 45, maxZoom: 8.5, duration: 0 }
    )
  }, [bounds])

  // Fly to and show popup for selected station reliably
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return
    const st = stations.find((s) => s.id === selectedStationId)
    if (!st) return

    // Show popup immediately
    showStationPopup(st)

    // Center map smoothly on station
    try {
      mapInstanceRef.current.flyTo({
        center: [st.longitude, st.latitude],
        zoom: Math.max(9.5, mapInstanceRef.current.getZoom()),
        duration: 800,
        essential: true,
      })
    } catch {
      // Map may still be loading
    }
  }, [selectedStationId, stations, isMapReady, showStationPopup])

  const handleResetBounds = () => {
    if (!mapInstanceRef.current || !bounds) return
    mapInstanceRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 45, duration: 1200 }
    )
  }

  if (!webGlAvailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-slate-800">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3" />
        <h3 className="text-base font-bold">WebGL Hardware Acceleration Required</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          MapLibre GL JS & deck.gl require WebGL support to render the national telemetry canvas.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm" style={{ height }}>
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} style={{ width: "100%", height }} className="z-0 outline-none" />

      {/* Premium GIS Hover Tooltip */}
      {hoveredStation && hoverPos && (
        <div
          className="absolute z-20 pointer-events-none transition-transform duration-75"
          style={{
            left:
              hoverPos.x > (mapContainerRef.current?.clientWidth ?? 800) - 270
                ? Math.max(12, hoverPos.x - 255)
                : hoverPos.x + 22,
            top:
              hoverPos.y > (mapContainerRef.current?.clientHeight ?? 600) - 190
                ? Math.max(12, hoverPos.y - 165)
                : Math.max(12, hoverPos.y - 35),
          }}
        >
          {/* Card */}
          <div
            style={{
              width: 240,
              background: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              borderRadius: 14,
              border: "1px solid rgba(226, 232, 240, 0.9)",
              boxShadow:
                "0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8) inset",
              overflow: "hidden",
              fontFamily:
                "'Inter', 'Segoe UI', -apple-system, system-ui, sans-serif",
            }}
          >
            {/* Top accent bar — colour by status */}
            <div
              style={{
                height: 3,
                background:
                  hoveredStation.connectionState === "online"
                    ? "linear-gradient(90deg, #10b981, #059669)"
                    : hoveredStation.connectionState === "warning"
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #ef4444, #dc2626)",
              }}
            />

            {/* Header */}
            <div style={{ padding: "10px 14px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0f172a",
                      letterSpacing: "-0.01em",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {hoveredStation.nameEn && hoveredStation.nameEn !== "Unnamed"
                      ? hoveredStation.nameEn
                      : hoveredStation.name && hoveredStation.name !== "Unnamed"
                        ? hoveredStation.name
                        : `${hoveredStation.region} Station`}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#64748b",
                      marginTop: 2,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {hoveredStation.code}
                  </div>
                </div>

                {/* Status pill */}
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 20,
                    background:
                      hoveredStation.connectionState === "online"
                        ? "#ecfdf5"
                        : hoveredStation.connectionState === "warning"
                          ? "#fffbeb"
                          : "#fef2f2",
                    color:
                      hoveredStation.connectionState === "online"
                        ? "#059669"
                        : hoveredStation.connectionState === "warning"
                          ? "#d97706"
                          : "#dc2626",
                    border: `1px solid ${
                      hoveredStation.connectionState === "online"
                        ? "#a7f3d0"
                        : hoveredStation.connectionState === "warning"
                          ? "#fde68a"
                          : "#fecaca"
                    }`,
                  }}
                >
                  {hoveredStation.connectionState}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                margin: "10px 14px 0",
                height: 1,
                background: "#f1f5f9",
              }}
            />

            {/* Water level metric */}
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Water Elevation
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#0284c7",
                    lineHeight: 1.1,
                    marginTop: 2,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {typeof hoveredStation.telemetrySnapshot?.waterLevel === "number"
                    ? hoveredStation.telemetrySnapshot.waterLevel.toFixed(2)
                    : "—"}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#64748b",
                      marginLeft: 4,
                    }}
                  >
                    m
                  </span>
                </div>
              </div>

              {/* Station type badge */}
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 9px",
                  borderRadius: 6,
                  background:
                    hoveredStation.type === "main"
                      ? "#fef2f2"
                      : hoveredStation.type === "master"
                        ? "#eff6ff"
                        : "#f8fafc",
                  color:
                    hoveredStation.type === "main"
                      ? "#dc2626"
                      : hoveredStation.type === "master"
                        ? "#1d4ed8"
                        : "#475569",
                  border: `1px solid ${
                    hoveredStation.type === "main"
                      ? "#fecaca"
                      : hoveredStation.type === "master"
                        ? "#bfdbfe"
                        : "#e2e8f0"
                  }`,
                }}
              >
                {hoveredStation.type === "main"
                  ? "HQ"
                  : hoveredStation.type === "master"
                    ? "Master"
                    : "RTU"}
              </div>
            </div>

            {/* Footer: coords + region */}
            <div
              style={{
                padding: "0 14px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #f8fafc",
                marginTop: -2,
              }}
            >
              <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>
                📍 {hoveredStation.region}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  color: "#64748b",
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                {hoveredStation.latitude.toFixed(3)}°,{" "}
                {hoveredStation.longitude.toFixed(3)}°
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Floating GIS Command Controls (Top Left alongside zoom controls, keeping top-right clear) */}
      <div className="absolute top-2.5 left-14 z-10 flex items-center gap-2 pointer-events-auto">
        {/* Basemap Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            title="Switch Map Tile Theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>{BASEMAP_OPTIONS.find((b) => b.key === activeBasemap)?.label || "Basemap"}</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute left-0 mt-1.5 w-52 rounded-xl bg-white/98 border border-slate-200 shadow-xl backdrop-blur-md p-1.5 flex flex-col gap-1 z-30 animate-fadeIn">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Basemap Theme
              </div>
              {BASEMAP_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => switchBasemap(opt.key)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeBasemap === opt.key
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                      : "text-slate-700 hover:bg-slate-100/80"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  {activeBasemap === opt.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fit Bounds */}
        <button
          type="button"
          onClick={handleResetBounds}
          title="Reset to Full National Network Bounds"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Fit Bounds</span>
        </button>
      </div>

      {/* Telemetry Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          Station Reading Status
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            Recent Telemetry ({stations.filter((station) => station.connectionState === "online").length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            Historical Baseline ({stations.filter((station) => station.connectionState === "warning").length})
          </span>
        </div>
      </div>
    </div>
  )
}
