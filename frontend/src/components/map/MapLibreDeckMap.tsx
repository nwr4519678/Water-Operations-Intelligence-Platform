// src/components/map/MapLibreDeckMap.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Map as MapLibreMap, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { WaterStation, BoundingBox } from '../../data/stationTypes';
import { createWaterTelemetryDeckLayers } from '../../map/deckLayers';
import { Layers, Compass, Maximize2, RotateCcw, AlertTriangle } from 'lucide-react';

export interface MapLibreDeckMapProps {
  stations: WaterStation[];
  bounds?: BoundingBox;
  selectedStationId?: string | null;
  onSelectStation?: (station: WaterStation) => void;
  language?: 'en' | 'ar';
  height?: string;
}

export const MapLibreDeckMap: React.FC<MapLibreDeckMapProps> = ({
  stations,
  bounds,
  selectedStationId,
  onSelectStation,
  language = 'en',
  height = '560px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);

  const [zoom, setZoom] = useState<number>(6.2);
  const [is3d, setIs3d] = useState<boolean>(false);
  const [hoveredStation, setHoveredStation] = useState<WaterStation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);

  const isAr = language === 'ar';

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
      }
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  // Compute default center from bounds
  const defaultCenter = useMemo<[number, number]>(() => {
    if (bounds) {
      return [bounds.centerLng, bounds.centerLat];
    }
    return [30.8, 27.2];
  }, [bounds]);

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;
    if (!webGlAvailable) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'carto-voyager': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap, © CARTO',
          },
        },
        layers: [
          {
            id: 'carto-voyager-layer',
            type: 'raster',
            source: 'carto-voyager',
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
    });

    // Add navigation control
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'top-left');

    // Create deck.gl MapboxOverlay
    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
    });

    map.addControl(overlay as any);
    deckOverlayRef.current = overlay;
    mapInstanceRef.current = map;

    map.on('zoom', () => {
      setZoom(map.getZoom());
    });

    // Initial fitBounds
    if (bounds) {
      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 45, maxZoom: 8.5, duration: 1000 }
      );
    }

    return () => {
      if (deckOverlayRef.current) {
        deckOverlayRef.current.finalize();
        deckOverlayRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [webGlAvailable]);

  // Handle deck.gl Hover & Click
  const handleHover = useCallback((info: any) => {
    if (info.object) {
      setHoveredStation(info.object as WaterStation);
      setHoverPos({ x: info.x, y: info.y });
    } else {
      setHoveredStation(null);
      setHoverPos(null);
    }
  }, []);

  const handleClick = useCallback(
    (info: any) => {
      if (info.object) {
        const station = info.object as WaterStation;
        if (onSelectStation) {
          onSelectStation(station);
        }
      }
    },
    [onSelectStation]
  );

  // 2. Update deck.gl layers whenever dependencies change
  useEffect(() => {
    if (!deckOverlayRef.current) return;

    const layers = createWaterTelemetryDeckLayers({
      stations,
      selectedStationId,
      hoveredStationId: hoveredStation?.id || null,
      onHover: handleHover,
      onClick: handleClick,
      is3d,
      zoom,
      language,
    });

    deckOverlayRef.current.setProps({ layers });
  }, [stations, selectedStationId, hoveredStation, is3d, zoom, language, handleHover, handleClick]);

  // 3. Fly to selected station
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return;
    const st = stations.find((s) => s.id === selectedStationId);
    if (st) {
      mapInstanceRef.current.flyTo({
        center: [st.longitude, st.latitude],
        zoom: Math.max(10, mapInstanceRef.current.getZoom()),
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedStationId, stations]);

  // Toggle 2D / 3D Pitch
  const toggle3d = () => {
    if (!mapInstanceRef.current) return;
    const next3d = !is3d;
    setIs3d(next3d);

    mapInstanceRef.current.easeTo({
      pitch: next3d ? 50 : 0,
      bearing: next3d ? -18 : 0,
      duration: 1000,
    });
  };

  // Reset to National Extent
  const handleResetBounds = () => {
    if (!mapInstanceRef.current || !bounds) return;
    mapInstanceRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 45, duration: 1200 }
    );
    if (is3d) {
      mapInstanceRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      setIs3d(false);
    }
  };

  if (!webGlAvailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-slate-800">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3" />
        <h3 className="text-base font-bold">WebGL Hardware Acceleration Required</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          MapLibre GL JS & deck.gl require WebGL support to render high-performance GPU telemetry layers. Please enable hardware acceleration in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-slate-900 bg-slate-50">
      {/* MapLibre Canvas Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-0 outline-none" />

      {/* Floating GIS Command Controls (Top Right) */}
      <div className="absolute top-3.5 right-3.5 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={toggle3d}
          title={is3d ? 'Switch to 2D Top-Down View' : 'Switch to 3D Oblique Perspective'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border transition-all cursor-pointer ${
            is3d
              ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/20'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${is3d ? 'rotate-45 text-white' : 'text-slate-500'}`} />
          <span>{is3d ? '3D Mode' : '2D GIS'}</span>
        </button>

        <button
          type="button"
          onClick={handleResetBounds}
          title="Reset to Full National Network Bounds"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAr ? 'كامل الشبكة' : 'Fit Bounds'}</span>
        </button>
      </div>

      {/* Interactive Hover Tooltip */}
      {hoveredStation && hoverPos && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div
            className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-lg text-xs min-w-[210px] space-y-1"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
              <span className="font-mono font-bold text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {hoveredStation.code}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  hoveredStation.connectionState === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : hoveredStation.connectionState === 'warning'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                ● {hoveredStation.connectionState}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-[12px] leading-tight pt-0.5">
              {isAr ? hoveredStation.nameAr || hoveredStation.name : hoveredStation.nameEn || hoveredStation.name}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>{isAr ? 'المنطقة:' : 'Region:'}</span>
              <span className="font-medium text-slate-700">{hoveredStation.region}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {hoveredStation.latitude.toFixed(4)}°N, {hoveredStation.longitude.toFixed(4)}°E
            </div>
          </div>
        </div>
      )}

      {/* SCADA Telemetry Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          {isAr ? 'دليل محطات الرصد التليمترى' : 'Telemetry GIS Hierarchy'}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" />
          <span className="text-slate-700 font-medium">{isAr ? 'المقر القومي للتحكم (1)' : 'National HQ Control Center (1)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 shrink-0" />
          <span className="text-slate-700 font-medium">{isAr ? 'محطات مرجعية كبرى (9)' : 'Strategic Master Stations (9)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200 shrink-0" />
          <span className="text-slate-700 font-medium">{isAr ? 'محطات حقلية ذكية (400 RTU)' : 'Field RTU Stations (400)'}</span>
        </div>
      </div>
    </div>
  );
};
