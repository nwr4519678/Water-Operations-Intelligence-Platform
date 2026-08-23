// src/components/map/StationMap.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapStationDto } from '../../types/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/constants';

export interface StationMapProps {
  stations: MapStationDto[];
  selectedStationId?: string | null;
  onSelectStation?: (station: MapStationDto) => void;
  language?: 'en' | 'ar';
  height?: string;
}

function createStationIcon(status: string, category?: string, isSelected: boolean = false) {
  let color = '#10b981'; // Green online
  let size = 12;
  let isPulsing = false;

  if (category === 'hq') {
    color = '#ef4444'; // Cairo HQ
    size = 16;
    isPulsing = true;
  } else if (category === 'master') {
    color = '#3b82f6'; // Master stations
    size = 14;
    isPulsing = true;
  } else if (status === 'MAINTENANCE' || status === 'warning') {
    color = '#f59e0b';
    size = 12;
  } else if (status === 'OFFLINE' || status === 'offline') {
    color = '#64748b';
    size = 10;
  }

  if (isSelected) {
    size += 4;
  }

  return L.divIcon({
    className: 'custom-station-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        ${
          isPulsing
            ? `<span style="position: absolute; inset: -4px; border-radius: 50%; background-color: ${color}; opacity: 0.35; pointer-events: none;"></span>`
            : ''
        }
        <span style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          display: block;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          ${isSelected ? 'outline: 3px solid #3b82f6;' : ''}
        "></span>
      </div>
    `,
  });
}

function buildPopup(s: MapStationDto, isAr: boolean) {
  const title = isAr ? s.nameAr || s.name : s.nameEn || s.name;
  const subTitle = isAr ? s.nameEn || s.name : s.nameAr || s.name;
  const zone = isAr ? s.zoneAr || s.regionId : s.zoneEn || s.regionId;

  return `
    <div class="leaflet-custom-popup" dir="${isAr ? 'rtl' : 'ltr'}" style="text-align: ${isAr ? 'right' : 'left'}; min-width: 230px; font-family: ${isAr ? "'Noto Kufi Arabic', system-ui, sans-serif" : "'Manrope', system-ui, sans-serif"};">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <div>
          <span style="font-weight: 700; font-size: 13px; display: block; color: #1e293b;">${title}</span>
          <span style="font-weight: 500; font-size: 10px; color: #64748b;">${subTitle}</span>
        </div>
        <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-family: monospace; background: #e0f2fe; color: #0369a1;">${s.stationCode}</span>
      </div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;"><b>${isAr ? 'المنطقة:' : 'Region:'}</b> ${zone}</div>
      <div style="display: flex; gap: 10px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #0284c7;">
        <span><b>${isAr ? 'المنسوب:' : 'Level:'}</b> ${s.currentWaterLevel ?? '—'} m</span>
        <span><b>${isAr ? 'التصرف:' : 'Flow:'}</b> ${s.flowRate ?? '—'}</span>
      </div>
      <div style="margin-top: 8px; text-align: center;">
        <button
          type="button"
          onclick="window.__navigateToStation && window.__navigateToStation('${s.stationId}')"
          style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%; font-size: 11px; color: #ffffff; background: #1677f0; font-weight: 700; padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 1px 3px rgba(22, 119, 240, 0.3); transition: all 0.15s ease;"
          onmouseover="this.style.background='#1357cc'; this.style.transform='translateY(-1px)';"
          onmouseout="this.style.background='#1677f0'; this.style.transform='translateY(0)';"
        >
          <span>${isAr ? 'فتح التحليلات التليمترية الكاملة ↗' : 'Click to inspect analytics ↗'}</span>
        </button>
      </div>
    </div>
  `;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  language = 'en',
  height = '580px',
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const isAr = language === 'ar';

  // Global Bridge for Leaflet Popups to React Router
  useEffect(() => {
    (window as any).__navigateToStation = (stationId: string) => {
      navigate(`/stations/${stationId}`);
    };
    return () => {
      delete (window as any).__navigateToStation;
    };
  }, [navigate]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO',
    }).addTo(map);

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 14,
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapInstanceRef.current = map;

    // Reset control
    const resetControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom cursor-pointer');
        btn.innerHTML = '⟲ Egypt';
        btn.title = 'Reset to Full Egypt View';
        btn.style.backgroundColor = '#ffffff';
        btn.style.color = '#0f172a';
        btn.style.fontWeight = '700';
        btn.style.fontSize = '11px';
        btn.style.padding = '5px 9px';
        btn.style.cursor = 'pointer';
        btn.style.border = '1px solid #cbd5e1';
        btn.style.borderRadius = '6px';
        btn.onclick = (e) => {
          e.stopPropagation();
          map.flyTo(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, { duration: 1.2 });
        };
        return btn;
      },
    });
    map.addControl(new resetControl());

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    stations.forEach((s) => {
      const isSelected = s.stationId === selectedStationId;
      const icon = createStationIcon(s.status, s.category, isSelected);
      const marker = L.marker([s.latitude, s.longitude], { icon });

      marker.bindPopup(buildPopup(s, isAr));

      marker.on('click', () => {
        if (onSelectStation) {
          onSelectStation(s);
        }
      });

      markersMapRef.current.set(s.stationId, marker);

      if (s.category === 'hq') {
        marker.addTo(map);
      } else {
        clusterGroup.addLayer(marker);
      }
    });
  }, [stations, isAr, selectedStationId, onSelectStation]);

  // 3. Fly to Selected Station
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return;
    const s = stations.find((item) => item.stationId === selectedStationId);
    if (s) {
      mapInstanceRef.current.flyTo([s.latitude, s.longitude], 13, { duration: 1.2 });
      const marker = markersMapRef.current.get(selectedStationId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedStationId, stations]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-slate-900">
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          Telemetry Node Key
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-200" />
          <span className="text-slate-700 font-medium">Greater Cairo Operations HQ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
          <span className="text-slate-700 font-medium">Strategic Master Stations (9)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span className="text-slate-700 font-medium">Field RTUs Online (400)</span>
        </div>
      </div>
    </div>
  );
};
