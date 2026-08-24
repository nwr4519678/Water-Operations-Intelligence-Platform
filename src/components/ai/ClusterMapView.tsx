// src/components/ai/ClusterMapView.tsx
import React, { useEffect, useRef } from "react"
import L from "leaflet"
import { Card } from "../common/Card"
import { AiClusterPayload } from "../../types/api"
import { DEFAULT_MAP_CENTER } from "../../utils/constants"

export const ClusterMapView: React.FC<{
  payload?: AiClusterPayload | null
}> = ({ payload }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const clusters = payload?.clusters || []

  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: 6,
      zoomControl: false,
    })

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 18,
        attribution: "© CARTO",
      },
    ).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    clusters.forEach((c) => {
      const circle = L.circle([c.centroidLatitude, c.centroidLongitude], {
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.25,
        radius: 45000,
      }).addTo(map)

      circle.bindPopup(`
        <div style="font-size: 12px; font-family: sans-serif;">
          <b>${c.clusterName}</b><br/>
          <span>${c.stationIds.length} Stations correlated</span>
        </div>
      `)
    })
  }, [clusters])

  return (
    <Card className="p-0 overflow-hidden bg-white border-slate-200 text-slate-900 shadow-xs">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">
          Spatial Hydrological Clusters (DBSCAN)
        </h3>
        <p className="text-[11px] text-slate-400">
          Geographic co-variance & regional hydraulic correlation groupings
        </p>
      </div>
      <div ref={mapContainerRef} style={{ height: "360px", width: "100%" }} />
    </Card>
  )
}
