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
    station.telemetrySnapshot?.waterLevel ?? "—"
  const flow = station.telemetrySnapshot?.flowRate ?? "—"
  const pressure = station.telemetrySnapshot?.pressure ?? "—"

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
  const lastMapZoomRef = useRef(6.2)

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

      // The MapLibre popup is the primary station detail surface. Never let
      // the lightweight hover card remain visible underneath it.
      setHoveredStation(null)
      setHoverPos(null)

      if (!popupRef.current) {
        const popup = new Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 14,
          maxWidth: "320px",
        })
        popup.addClassName("water-primary-popup")
        popup.on("close", () => {
          if (popupRef.current === popup) popupRef.current = null
        })
        popupRef.current = popup
      }

      popupRef.current
        .setLngLat([st.longitude, st.latitude])
        .setHTML(buildPopupHtml(st, isAr))
        .addTo(mapInstanceRef.current)

      // MapLibre can recreate the popup element during addTo(), so apply the
      // stacking priority to the actual DOM node after it is mounted.
      const popupElement = popupRef.current.getElement()
      popupElement?.classList.add("water-primary-popup")
      popupElement?.style.setProperty("z-index", "1000", "important")
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
      // Use a dedicated deck.gl canvas. Interleaved rendering currently
      // triggers a viewport-height error with MapLibre GL in Chromium/Docker.
      interleaved: false,
      layers: [],
    })

    map.addControl(overlay as any)
    deckOverlayRef.current = overlay
    mapInstanceRef.current = map

    // Rebuilding the geographic clusters on every zoom frame makes their
    // representative centers jump between cells while the map is animating.
    // Keep the current layer stable during the gesture and regroup once the
    // camera settles.
    map.on("zoomend", () => {
      setZoom(map.getZoom())
    })

    // Detail popups are intended for close inspection. Close them as soon as
    // the operator zooms back to the national/cluster view.
    map.on("zoom", () => {
      const currentZoom = map.getZoom()
      const isZoomingOut = currentZoom < lastMapZoomRef.current

      // Do not close while flyTo is zooming in to open a station popup. Only
      // close an already-open detail popup when the operator zooms back out.
      if (isZoomingOut && currentZoom < 9 && popupRef.current) {
        popupRef.current.remove()
        popupRef.current = null
      }

      lastMapZoomRef.current = currentZoom
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
  const handleHover = useCallback(
    (info: any) => {
      const object = info.object as
        | { count?: number; station?: WaterStation }
        | WaterStation
        | undefined
      const count = object && "count" in object ? object.count ?? 1 : 1
      const station = object && (object as any).station
        ? (object as any).station as WaterStation
        : (object as WaterStation | undefined)

      // Hover details are useful only for an individual station at close
      // zoom. Cluster labels should remain uncluttered at national zoom.
      if (!station || count > 1 || zoom < 9 || popupRef.current) {
        setHoveredStation(null)
        setHoverPos(null)
        return
      }

      setHoveredStation(station)
      setHoverPos({ x: info.x, y: info.y })
    },
    [zoom],
  )

  const handleClick = useCallback(
    (info: any) => {
      const object = info.object as
        | {
            count?: number
            station?: WaterStation
            longitude: number
            latitude: number
          }
        | undefined
      if (!object || !mapInstanceRef.current) return

      // A cluster click only zooms into its center and never opens a profile.
      if ((object.count ?? 1) > 1) {
        mapInstanceRef.current.flyTo({
          center: [object.longitude, object.latitude],
          zoom: Math.min(mapInstanceRef.current.getZoom() + 2.5, 13),
          duration: 700,
          essential: true,
        })
        return
      }

      // A singleton click zooms to the station and opens the primary
      // blue-action popup. The popup's own action opens the full profile.
      // RTU clusters wrap the station in `object.station`, while the red HQ
      // and blue master layers pass the WaterStation object directly.
      const station = (object.station ?? object) as WaterStation
      if (
        !station.id ||
        !Number.isFinite(station.latitude) ||
        !Number.isFinite(station.longitude)
      ) {
        return
      }

      const zoomToStation = () =>
        mapInstanceRef.current?.flyTo({
          center: [station.longitude, station.latitude],
          zoom: Math.max(mapInstanceRef.current.getZoom(), 13),
          duration: 700,
          essential: true,
        })

      zoomToStation()
      showStationPopup(station)
    },
    [showStationPopup],
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

  // The first render can happen before the database stations arrive. Refit
  // the already-created map when their authoritative bounds become available.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !bounds) return
    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 45, maxZoom: 8.5, duration: 0 },
    )
  }, [bounds])

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

      {hoveredStation && hoverPos && zoom >= 9 && (
        <div
          className="absolute z-20 pointer-events-none w-64 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: Math.min(hoverPos.x + 16, 520),
            top: Math.min(hoverPos.y + 16, 420),
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-slate-900">
                {isAr
                  ? hoveredStation.nameAr || hoveredStation.name
                  : hoveredStation.nameEn || hoveredStation.name}
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                {hoveredStation.code}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                hoveredStation.connectionState === "online"
                  ? "bg-emerald-100 text-emerald-700"
                  : hoveredStation.connectionState === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : hoveredStation.connectionState === "offline"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
              }`}
            >
              {hoveredStation.connectionState}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600">
            <span>
              {isAr ? "النوع" : "Type"}: {hoveredStation.typeLabel}
            </span>
            <span>
              {isAr ? "المنطقة" : "Region"}: {hoveredStation.region}
            </span>
            <span>
              {isAr ? "خط العرض" : "Lat"}: {hoveredStation.latitude.toFixed(4)}
            </span>
            <span>
              {isAr ? "خط الطول" : "Lng"}: {hoveredStation.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}

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
              ? `محطات التحكم القومي (${stations.filter((station) => station.type === "main").length})`
              : `National HQ Control Center (${stations.filter((station) => station.type === "main").length})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            {isAr
              ? `المحطات الرئيسية (${stations.filter((station) => station.type === "master").length})`
              : `Strategic Master Stations (${stations.filter((station) => station.type === "master").length})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200 shrink-0" />
          <span className="text-slate-700 font-medium">
            {isAr
              ? `محطات الرصد الحقلي (${stations.filter((station) => station.type === "rtu").length})`
              : `Field RTU Stations (${stations.filter((station) => station.type === "rtu").length})`}
          </span>
        </div>
      </div>
    </div>
  )
}
