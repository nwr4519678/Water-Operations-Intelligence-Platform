import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import L from "leaflet"
import "leaflet.markercluster"
import { Station, allStations, MapLanguage } from "../data/stationsData"

interface NetworkMapProps {
  tall?: boolean
  stations?: Station[]
  selectedStationId?: string | null
  onSelectStation?: (station: Station) => void
  showLegend?: boolean
  language?: MapLanguage
}

function createNodeIcon(color: string, size: number = 11, isPulsing: boolean = false) {
  return L.divIcon({
    className: "custom-node-marker",
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${isPulsing ? `<span style="position: absolute; inset: -4px; border-radius: 50%; background-color: ${color}; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <span style="background-color: ${color}; width: ${size}px; height: ${size}px; display: block; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.32);"></span>
      </div>
    `
  })
}

function buildPopupHtml(s: Station, lang: MapLanguage): string {
  const isHQ = s.category === 'hq'
  const isMaster = s.category === 'master'
  const titleColor = isHQ ? '#ef4444' : isMaster ? '#3b82f6' : s.status === 'warning' ? '#f59e0b' : s.status === 'offline' ? '#64748b' : '#10b981'
  const badgeClass = s.status === 'online' ? 'status-online' : s.status === 'warning' ? 'status-warning' : 'status-offline'

  const isAr = lang === 'ar'
  const title = isAr ? s.nameAr : s.nameEn
  const subTitle = isAr ? s.nameEn : s.nameAr
  const zone = isAr ? s.zoneAr : s.zoneEn
  const type = isAr ? s.typeAr : s.typeEn
  const mechanism = isAr ? s.mechanismAr : s.mechanismEn
  const signal = isAr ? s.signalAr : s.signalEn
  const unit = (s.category === 'master' || s.category === 'hq') ? (isAr ? 'م³/ث' : 'm³/s') : (isAr ? 'لتر/ث' : 'L/s')

  return `
    <div class="leaflet-custom-popup" dir="${isAr ? 'rtl' : 'ltr'}" style="text-align: ${isAr ? 'right' : 'left'}; min-width: 220px; font-family: ${isAr ? "'Noto Kufi Arabic', system-ui, sans-serif" : "'Manrope', system-ui, sans-serif"};">
      <div class="popup-title" style="color: ${titleColor}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div>
          <span style="font-weight: 700; font-size: 13px; display: block;">${title}</span>
          <span style="font-weight: 500; font-size: 10px; color: #64748b;">${subTitle}</span>
        </div>
        <span class="popup-status-badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-family: monospace;">${s.id}</span>
      </div>
      <div class="popup-meta"><b>${isAr ? 'المنطقة:' : 'Region:'}</b> ${zone}</div>
      <div class="popup-meta"><b>${isAr ? 'المستوى:' : 'Type:'}</b> ${type}</div>
      <div class="popup-meta" style="display: flex; gap: 10px; margin-top: 5px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
        <span><b>${isAr ? 'المنسوب:' : 'Level:'}</b> ${s.level} ${isAr ? 'م' : 'm'}</span>
        <span><b>${isAr ? 'التصرف:' : 'Flow:'}</b> ${s.flow} ${unit}</span>
        <span><b>${isAr ? 'الضغط:' : 'Pressure:'}</b> ${s.pressure} bar</span>
      </div>
      <div class="popup-meta"><b>${isAr ? 'الإشارة:' : 'Signal:'}</b> ${signal}</div>
      ${mechanism ? `<div class="popup-meta" style="font-size: 10px; color: #94a3b8; margin-top: 3px;">${mechanism}</div>` : ''}
      <div style="margin-top: 8px; text-align: center;">
        <button
          type="button"
          onclick="window.__navigateToStation && window.__navigateToStation('${s.id}')"
          style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; font-size: 11px; color: #ffffff; background: #1677f0; font-weight: 700; padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 1px 3px rgba(22, 119, 240, 0.3); transition: all 0.15s ease;"
          onmouseover="this.style.background='#1357cc'; this.style.transform='translateY(-1px)';"
          onmouseout="this.style.background='#1677f0'; this.style.transform='translateY(0)';"
        >
          <span>${isAr ? 'فتح التحليلات التليمترية الكاملة ↗' : 'Click to inspect analytics ↗'}</span>
        </button>
      </div>
    </div>
  `
}

export default function NetworkMap({
  tall = false,
  stations = allStations,
  selectedStationId,
  onSelectStation,
  showLegend = true,
  language = 'en'
}: NetworkMapProps) {
  const navigate = useNavigate()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    (window as any).__navigateToStation = (stationId: string) => {
      navigate(`/stations/${stationId}`)
    }
    return () => {
      delete (window as any).__navigateToStation
    }
  }, [navigate])

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [28.2000, 31.0000],
      zoom: 6.2,
      zoomControl: true,
      attributionControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map)

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      disableClusteringAtZoom: 14,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true
    })

    map.addLayer(clusterGroup)

    mapInstanceRef.current = map
    clusterGroupRef.current = clusterGroup
    setMapReady(true)

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
      clusterGroupRef.current = null
      markersMapRef.current.clear()
    }
  }, [])

  // 2. Populate and update markers when stations or language changes
  useEffect(() => {
    const map = mapInstanceRef.current
    const clusterGroup = clusterGroupRef.current
    if (!map || !clusterGroup || !mapReady) return

    clusterGroup.clearLayers()
    markersMapRef.current.forEach((marker, id) => {
      if (id === 'HQ-001') {
        map.removeLayer(marker)
      }
    })
    markersMapRef.current.clear()

    const iconCenter = createNodeIcon('#ef4444', 16, true)
    const iconMaster = createNodeIcon('#3b82f6', 13)
    const iconFieldGood = createNodeIcon('#10b981', 9)
    const iconFieldWarn = createNodeIcon('#f59e0b', 10)
    const iconFieldOff = createNodeIcon('#94a3b8', 9)

    stations.forEach(s => {
      let icon = iconFieldGood
      if (s.category === 'hq') {
        icon = iconCenter
      } else if (s.category === 'master') {
        icon = iconMaster
      } else {
        if (s.status === 'warning') icon = iconFieldWarn
        else if (s.status === 'offline') icon = iconFieldOff
      }

      const marker = L.marker([s.lat, s.lng], { icon })
      marker.bindPopup(buildPopupHtml(s, language))

      marker.on('click', () => {
        if (onSelectStation) {
          onSelectStation(s)
        }
      })

      markersMapRef.current.set(s.id, marker)

      if (s.category === 'hq') {
        marker.addTo(map)
      } else {
        clusterGroup.addLayer(marker)
      }
    })
  }, [stations, mapReady, language, onSelectStation])

  // 3. Zoom / Fly to selectedStationId
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current || !clusterGroupRef.current) return
    const marker = markersMapRef.current.get(selectedStationId)
    const station = stations.find(s => s.id === selectedStationId)

    if (marker && station) {
      const map = mapInstanceRef.current
      const clusterGroup = clusterGroupRef.current

      map.flyTo([station.lat, station.lng], Math.max(map.getZoom(), 12), {
        duration: 0.8
      })

      clusterGroup.zoomToShowLayer(marker, () => {
        marker.openPopup()
      })
    }
  }, [selectedStationId, stations])

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([28.2000, 31.0000], 6.2, { duration: 0.6 })
      mapInstanceRef.current.closePopup()
    }
  }

  const isAr = language === 'ar'

  return (
    <div className="map-canvas relative overflow-hidden rounded-lg bg-slate-50 border border-slate-200" style={tall ? { height: 560 } : {}}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: tall ? 560 : 415 }} />

      {/* Floating Top Controls Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* Live Stations Counter */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isAr ? `${stations.length} محطة متصلة` : `${stations.length} Active Stations`}</span>
          </div>
        </div>

        {/* Full Egypt Reset Button */}
        <button
          onClick={handleResetView}
          className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-sm border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          title={isAr ? "إعادة ضبط نطاق خريطة مصر بالكامل" : "Reset view to all Egypt"}
        >
          <span>⟲</span>
          <span>{isAr ? "كامل الجمهورية" : "All Egypt"}</span>
        </button>
      </div>

      {/* Map Legend */}
      {showLegend && (
        <div className="map-legend" dir={isAr ? "rtl" : "ltr"}>
          <span className="font-bold text-[10px] text-slate-700 pb-0.5 border-b border-slate-200">
            {isAr ? "دليل الخريطة والرموز" : "Map Legend"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="dot red"/>
            {isAr ? "المقر القومي للتحكم (HQ)" : "National Control HQ"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="dot blue"/>
            {isAr ? "محطات رئيسية كبرى (9 Master)" : "Major Strategic Masters (9)"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="dot good"/>
            {isAr ? "محطة حقلية نشطة (RTU)" : "Active Field RTU"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="dot warning"/>
            {isAr ? "تنبيه تشغيلي (Warning)" : "Operational Warning"}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="dot offline"/>
            {isAr ? "غير متصلة (Offline)" : "Offline Station"}
          </span>
        </div>
      )}
    </div>
  )
}
