// src/components/map/MapLibreDeckMap.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Map as MapLibreMap, NavigationControl, Popup } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { WaterStation, BoundingBox } from "../../data/stationTypes"
import { createWaterTelemetryDeckLayers } from "../../map/deckLayers"
import { Compass, RotateCcw, AlertTriangle } from "lucide-react"

export interface MapLibreDeckMapProps {
  stations: WaterStation[]
  bounds?: BoundingBox
  selectedStationId?: string | null
  onSelectStation?: (station: WaterStation) => void
  language?: "en" | "ar"
  height?: string
}

function buildPopupHtml(station: WaterStation, isAr: boolean) {
  const name = isAr
    ? station.nameAr || station.name
    : station.nameEn || station.name
  const subName = isAr
    ? station.nameEn || station.name
    : station.nameAr || station.name
  const level =
    station.telemetrySnapshot?.waterLevel ??
    (station.type === "main"
      ? "3.45"
      : station.type === "master"
        ? "178.5"
        : "2.65")
  const flow =
    station.telemetrySnapshot?.flowRate ??
    (station.type === "main"
      ? "1,450 m³/s"
      : station.type === "master"
        ? "2,100 m³/s"
        : "320 L/s")
  const pressure =
    station.telemetrySnapshot?.pressure ??
    (station.type === "main" ? "5.8" : "4.2")

  return `
    <div style="font-family: ${
      isAr
        ? "'Noto Kufi Arabic', system-ui, sans-serif"
        : "'Manrope', system-ui, sans-serif"
    }; min-width: 240px; text-align: ${
      isAr ? "right" : "left"
    }; color: #0f172a;" dir="${isAr ? "rtl" : "ltr"}">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <div>
          <span style="font-weight: 800; font-size: 13px; display: block; color: #0f172a; line-height: 1.25;">${name}</span>
          <span style="font-weight: 500; font-size: 10px; color: #64748b; display: block; margin-top: 2px;">${subName}</span>
        </div>
        <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-family: monospace; background: #eff6ff; color: #1677f0; border: 1px solid #bfdbfe; flex-shrink: 0;">${station.code}</span>
      </div>

      <div style="font-size: 11px; color: #475569; margin-top: 4px;">
        <b>${isAr ? "المنطقة:" : "Region:"}</b> ${station.region}
      </div>

      <div style="display: flex; gap: 10px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #0284c7;">
        <span><b>${isAr ? "المنسوب:" : "Level:"}</b> ${level} m</span>
        <span><b>${isAr ? "التصرف:" : "Flow:"}</b> ${flow}</span>
        <span><b>${isAr ? "الضغط:" : "Pressure:"}</b> ${pressure} bar</span>
      </div>

      <div style="margin-top: 10px; text-align: center;">
        <button
          type="button"
          onclick="window.__navigateToStation && window.__navigateToStation('${station.id}')"
          style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%; font-size: 11px; color: #ffffff; background: #1677f0; font-weight: 700; padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 1px 3px rgba(22, 119, 240, 0.3); transition: all 0.15s ease;"
          onmouseover="this.style.background='#1357cc'; this.style.transform='translateY(-1px)';"
          onmouseout="this.style.background='#1677f0'; this.style.transform='translateY(0)';"
        >
          <span>${
            isAr
              ? "فتح التحليلات التليمترية الكاملة ↗"
              : "Click to inspect analytics ↗"
          }</span>
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
  language = "en",
  height = "560px",
}) => {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const deckOverlayRef = useRef<MapboxOverlay | null>(null)
  const popupRef = useRef<Popup | null>(null)

  const [zoom, setZoom] = useState<number>(6.2)
  const [is3d, setIs3d] = useState<boolean>(false)
  const [hoveredStation, setHoveredStation] = useState<WaterStation | null>(
    null,
  )
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true)

  const isAr = language === "ar"

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
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
      if (!gl) {
        setWebGlAvailable(false)
      }
    } catch {
      setWebGlAvailable(false)
    }
  }, [])

  // Compute default center from bounds
  const defaultCenter = useMemo<[number, number]>(() => {
    if (bounds) {
      return [bounds.centerLng, bounds.centerLat]
    }
    return [30.8, 27.2]
  }, [bounds])

  // Function to show popup on map
  const showStationPopup = useCallback(
    (st: WaterStation) => {
      if (!mapInstanceRef.current) return

      if (!popupRef.current) {
        popupRef.current = new Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 14,
          maxWidth: "320px",
        })
      }

      popupRef.current
        .setLngLat([st.longitude, st.latitude])
        .setHTML(buildPopupHtml(st, isAr))
        .addTo(mapInstanceRef.current)
    },
    [isAr],
  )

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return
    if (!webGlAvailable) return

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-voyager": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap, © CARTO",
          },
        },
        layers: [
          {
            id: "carto-voyager-layer",
            type: "raster",
            source: "carto-voyager",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: defaultCenter,
      zoom: 6.2,
      pitch: 0,
      bearing: 0,
      maxPitch: 60,
    })

    // Add navigation control
    map.addControl(
      new NavigationControl({ showCompass: true, showZoom: true }),
      "top-left",
    )

    // Create deck.gl MapboxOverlay
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    })

    map.addControl(overlay as any)
    deckOverlayRef.current = overlay
    mapInstanceRef.current = map

    map.on("zoom", () => {
      setZoom(map.getZoom())
    })

    // Initial fitBounds
    if (bounds) {
      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 45, maxZoom: 8.5, duration: 1000 },
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
    if (info.object) {
      setHoveredStation(info.object as WaterStation)
      setHoverPos({ x: info.x, y: info.y })
    } else {
      setHoveredStation(null)
      setHoverPos(null)
    }
  }, [])

  const handleClick = useCallback(
    (info: any) => {
      if (info.object) {
        const station = info.object as WaterStation
        showStationPopup(station)
        if (onSelectStation) {
          onSelectStation(station)
        }
      }
    },
    [onSelectStation, showStationPopup],
  )

  // 2. Update deck.gl layers whenever dependencies change
  useEffect(() => {
    if (!deckOverlayRef.current) return

    const layers = createWaterTelemetryDeckLayers({
      stations,
      selectedStationId,
      hoveredStationId: hoveredStation?.id || null,
      onHover: handleHover,
      onClick: handleClick,
      is3d,
      zoom,
      language,
    })

    deckOverlayRef.current.setProps({ layers })
  }, [
    stations,
    selectedStationId,
    hoveredStation,
    is3d,
    zoom,
    language,
    handleHover,
    handleClick,
  ])

  // 3. Fly to and show popup for selected station
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return
    const st = stations.find((s) => s.id === selectedStationId)
    if (st) {
      showStationPopup(st)
      mapInstanceRef.current.flyTo({
        center: [st.longitude, st.latitude],
        zoom: Math.max(10, mapInstanceRef.current.getZoom()),
        duration: 1200,
        essential: true,
      })
    }
  }, [selectedStationId, stations, showStationPopup])

  // Toggle 2D / 3D Pitch
  const toggle3d = () => {
    if (!mapInstanceRef.current) return
    const next3d = !is3d
    setIs3d(next3d)

    mapInstanceRef.current.easeTo({
      pitch: next3d ? 50 : 0,
      bearing: next3d ? -18 : 0,
      duration: 1000,
    })
  }

  // Reset to National Extent
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || !bounds) return
    mapInstanceRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 45, duration: 1200 },
    )
    if (is3d) {
      mapInstanceRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 })
      setIs3d(false)
    }
  }

  if (!webGlAvailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-slate-800">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3" />
        <h3 className="text-base font-bold">
          WebGL Hardware Acceleration Required
        </h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          MapLibre GL JS & deck.gl require WebGL support to render
          high-performance GPU telemetry layers. Please enable hardware
          acceleration in your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-slate-900 bg-slate-50">
      {/* MapLibre Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height }}
        className="z-0 outline-none"
      />

      {/* Floating GIS Command Controls (Top Right) */}
      <div className="absolute top-3.5 right-3.5 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={toggle3d}
          title={
            is3d
              ? "Switch to 2D Top-Down View"
              : "Switch to 3D Oblique Perspective"
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border transition-all cursor-pointer ${
            is3d
              ? "bg-blue-600 text-white border-blue-700 shadow-blue-500/20"
              : "bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Compass
            className={`w-3.5 h-3.5 ${
              is3d ? "rotate-45 text-white" : "text-slate-500"
            }`}
          />
          <span>{is3d ? "3D Mode" : "2D GIS"}</span>
        </button>

        <button
          type="button"
          onClick={handleResetBounds}
          title="Reset to Full National Network Bounds"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAr ? "كامل الشبكة" : "Fit Bounds"}</span>
        </button>
      </div>

      {/* SCADA Telemetry Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          {isAr ? "دليل محطات الرصد التليمترى" : "Telemetry GIS Hierarchy"}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            {isAr
              ? "المقر القومي للتحكم (1)"
              : "National HQ Control Center (1)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            {isAr ? "محطات مرجعية كبرى (9)" : "Strategic Master Stations (9)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            {isAr ? "محطات حقلية ذكية (400 RTU)" : "Field RTU Stations (400)"}
          </span>
        </div>
      </div>
    </div>
  )
}
