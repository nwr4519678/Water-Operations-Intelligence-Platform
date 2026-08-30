// src/components/map/MapLibreDeckMap.tsx
// Production-grade MapLibre GL JS + deck.gl GIS map component.
// English only. No Arabic. No fabricated telemetry in popup.
// Single source of truth: stations prop from MapPage.
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapLibreMap, NavigationControl, FullscreenControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { WaterStation, BoundingBox } from '../../data/stationTypes';
import { createWaterTelemetryDeckLayers } from '../../map/deckLayers';
import { buildSchematicDistributionPaths } from '../../map/waterNetworkData';
import { STATUS_CSS } from '../../map/mapConstants';
import { Compass, RotateCcw, AlertTriangle, Layers, Droplets, GitBranch, Eye, EyeOff } from 'lucide-react';

export interface MapLibreDeckMapProps {
  stations: WaterStation[];
  bounds?: BoundingBox;
  selectedStationId?: string | null;
  onSelectStation?: (station: WaterStation) => void;
  onZoomChange?: (zoom: number) => void;
  height?: string;
}

// Popup DOM — real CSV data only. Building DOM nodes avoids injecting raw CSV
// values into HTML and keeps the action wired to the current React callback.
function buildPopupElement(station: WaterStation, onOpen: () => void): HTMLDivElement {
  const stateColor =
    station.connectionState === 'online'  ? '#10b981' :
    station.connectionState === 'warning' ? '#f59e0b' :
    station.connectionState === 'offline' ? '#ef4444' : '#94a3b8';

  const tierBg =
    station.type === 'main'   ? '#fef2f2' :
    station.type === 'master' ? '#eff6ff' : '#f0fdf4';
  const tierText =
    station.type === 'main'   ? '#991b1b' :
    station.type === 'master' ? '#1e40af' : '#166534';

  const root = document.createElement('div');
  root.style.cssText = "font-family:'Manrope','Inter',system-ui,sans-serif;min-width:240px;max-width:300px;color:#0f172a;line-height:1.4;";
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;';
  const identity = document.createElement('div');
  identity.style.cssText = 'flex:1;min-width:0;';
  const title = document.createElement('div');
  title.textContent = station.name;
  title.style.cssText = 'font-weight:800;font-size:13px;color:#0f172a;line-height:1.3;word-wrap:break-word;';
  const code = document.createElement('div');
  code.textContent = station.code;
  code.style.cssText = 'font-size:10px;color:#64748b;margin-top:2px;font-family:monospace;';
  identity.append(title, code);
  const type = document.createElement('span');
  type.textContent = station.typeLabel;
  type.style.cssText = `flex-shrink:0;font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700;background:${tierBg};color:${tierText};border:1px solid ${tierText}30;`;
  header.append(identity, type);

  const details = document.createElement('div');
  details.style.cssText = 'background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:11px;';
  const addRow = (label: string, value: string, color = '#1e293b') => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;gap:10px;margin-bottom:4px;';
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = 'color:#64748b;font-weight:600;';
    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    valueEl.style.cssText = `color:${color};font-weight:700;text-align:right;max-width:160px;`;
    row.append(labelEl, valueEl);
    details.append(row);
  };
  addRow('Region', station.region);
  addRow('Connection', `● ${station.connectionState.toUpperCase()}`, stateColor);
  addRow('Coordinates', `${station.latitude.toFixed(4)}°N, ${station.longitude.toFixed(4)}°E`, '#475569');

  const notice = document.createElement('div');
  notice.textContent = 'Telemetry: awaiting live data feed';
  notice.style.cssText = 'margin-top:8px;font-size:10px;color:#94a3b8;font-style:italic;text-align:center;';
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Open Station Analytics →';
  button.style.cssText = 'display:block;width:100%;margin-top:8px;font-size:11px;color:#fff;background:#2563eb;font-weight:700;padding:7px 12px;border-radius:8px;border:none;cursor:pointer;';
  button.addEventListener('click', onOpen);
  button.addEventListener('mouseenter', () => { button.style.background = '#1d4ed8'; });
  button.addEventListener('mouseleave', () => { button.style.background = '#2563eb'; });
  root.append(header, details, notice, button);
  return root;
}

export const MapLibreDeckMap: React.FC<MapLibreDeckMapProps> = ({
  stations,
  bounds,
  selectedStationId,
  onSelectStation,
  onZoomChange,
  height = '560px',
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef   = useRef<MapLibreMap | null>(null);
  const deckOverlayRef   = useRef<MapboxOverlay | null>(null);
  const popupRef         = useRef<Popup | null>(null);

  const [zoom, setZoom] = useState<number>(6.2);
  const [is3d, setIs3d] = useState<boolean>(false);
  const [hoveredStation, setHoveredStation] = useState<WaterStation | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [webGlAvailable, setWebGlAvailable] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showWaterNetwork, setShowWaterNetwork] = useState(true);
  const [showDistribution, setShowDistribution] = useState(true);
  const distributionPaths = useMemo(() => buildSchematicDistributionPaths(stations), [stations]);

  // Global bridge: popup button -> React Router navigation
  useEffect(() => {
    (window as any).__navigateToStation = (id: string) => navigate(`/stations/${id}`);
    return () => { delete (window as any).__navigateToStation; };
  }, [navigate]);

  // WebGL availability check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlAvailable(false);
    } catch {
      setWebGlAvailable(false);
    }
  }, []);

  // Show popup for a station (real CSV data only)
  const showStationPopup = useCallback((station: WaterStation) => {
    if (!mapInstanceRef.current) return;
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    const popup = new Popup({ closeButton: true, closeOnClick: false, maxWidth: '320px', className: 'wt-popup' })
      .setLngLat([station.longitude, station.latitude])
      .setDOMContent(buildPopupElement(station, () => navigate(`/stations/${station.id}`)))
      .addTo(mapInstanceRef.current);
    popupRef.current = popup;
  }, []);

  // Keyboard: Escape closes popup
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 1. Initialise MapLibre + deck.gl overlay (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || !webGlAvailable) return;

    const defaultCenter: [number, number] = bounds
      ? [bounds.centerLng, bounds.centerLat]
      : [0, 0];

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
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
              attribution: '&copy; OpenStreetMap, &copy; CARTO',
            },
          },
          layers: [{ id: 'carto-base', type: 'raster', source: 'carto-voyager', minzoom: 0, maxzoom: 19 }],
        },
        center: defaultCenter,
        zoom: bounds ? 6.2 : 1.5,
        pitch: 0,
        bearing: 0,
        maxPitch: 60,
      });
    } catch (error) {
      console.error('MapLibre initialization failed', error);
      setMapError('The GIS map could not be initialized. Check WebGL support and network access, then try again.');
      return;
    }

    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'top-left');
    map.addControl(new FullscreenControl(), 'top-left');
    map.on('error', (event) => {
      if (event.error) console.error('MapLibre map error', event.error);
    });

    // MapLibre supports the deck.gl MapboxOverlay in overlaid mode. Keeping
    // the WebGL contexts separate avoids the interleaved custom-layer viewport
    // path, which is Mapbox-specific and can fail under MapLibre.
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay as any);
    deckOverlayRef.current = overlay;
    mapInstanceRef.current = map;

    map.on('zoom', () => {
      const nextZoom = map.getZoom();
      setZoom(nextZoom);
      onZoomChange?.(nextZoom);
    });

    if (bounds) {
      map.fitBounds(
        [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
        { padding: 50, maxZoom: 8.5, duration: 1000 }
      );
    }

    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      if (deckOverlayRef.current) { deckOverlayRef.current.finalize(); deckOverlayRef.current = null; }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [webGlAvailable]);

  // Deck.gl interaction handlers (memoised — do not recreate on each render)
  const handleHover = useCallback((info: any) => {
    if (info.object) {
      setHoveredStation(info.object as WaterStation);
      setHoverPos({ x: info.x, y: info.y });
    } else {
      setHoveredStation(null);
      setHoverPos(null);
    }
  }, []);

  const handleClick = useCallback((info: any) => {
    if (info.object) {
      const station = info.object as WaterStation;
      showStationPopup(station);
      onSelectStation?.(station);
    }
  }, [onSelectStation, showStationPopup]);

  // 2. Update deck.gl layers when data or selection changes
  useEffect(() => {
    if (!deckOverlayRef.current) return;
    const layers = createWaterTelemetryDeckLayers({
      stations,
      selectedStationId,
      hoveredStationId: hoveredStation?.id ?? null,
      onHover: handleHover,
      onClick: handleClick,
      is3d,
      zoom,
      networkPaths: distributionPaths,
      showWaterNetwork,
      showDistribution,
    });
    deckOverlayRef.current.setProps({ layers });
  }, [stations, selectedStationId, hoveredStation, is3d, zoom, handleHover, handleClick, distributionPaths, showWaterNetwork, showDistribution]);

  // 3. Fly to + popup on external selection change
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return;
    const st = stations.find((s) => s.id === selectedStationId);
    if (st) {
      showStationPopup(st);
      mapInstanceRef.current.flyTo({
        center: [st.longitude, st.latitude],
        zoom: Math.max(10, mapInstanceRef.current.getZoom()),
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedStationId, stations, showStationPopup]);

  const toggle3d = () => {
    if (!mapInstanceRef.current) return;
    const next = !is3d;
    setIs3d(next);
    mapInstanceRef.current.easeTo({ pitch: next ? 50 : 0, bearing: next ? -18 : 0, duration: 1000 });
  };

  const handleResetBounds = () => {
    if (!mapInstanceRef.current || !bounds) return;
    mapInstanceRef.current.fitBounds(
      [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
      { padding: 50, duration: 1200 }
    );
    if (is3d) { mapInstanceRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 }); setIs3d(false); }
  };

  if (!webGlAvailable || mapError) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-slate-800">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600 mb-3" />
        <h3 className="text-base font-bold">{mapError ? 'GIS Map Unavailable' : 'WebGL Hardware Acceleration Required'}</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          {mapError ?? 'MapLibre GL JS and deck.gl require WebGL to render GPU-accelerated telemetry layers. Please enable hardware acceleration in your browser settings.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 map-network-canvas" style={{ height }}>
      {/* MapLibre canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} className="z-0 outline-none" />

      {/* Hover tooltip — positioned DOM element (not a MapLibre popup) */}
      {hoveredStation && hoverPos && (
        <div
          className="pointer-events-none absolute z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs max-w-[220px]"
          style={{ left: hoverPos.x + 14, top: hoverPos.y - 10, transform: 'translateY(-50%)' }}
        >
          <div className="font-bold text-slate-900 text-[12px] leading-tight mb-1">{hoveredStation.name}</div>
          <div className="text-slate-500 mb-0.5">{hoveredStation.typeLabel}</div>
          <div className="text-slate-500 truncate mb-1">{hoveredStation.region}</div>
          <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CSS[hoveredStation.connectionState]?.bg ?? 'bg-slate-50'} ${STATUS_CSS[hoveredStation.connectionState]?.text ?? 'text-slate-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CSS[hoveredStation.connectionState]?.dot ?? 'bg-slate-400'}`} />
            {hoveredStation.connectionState}
          </div>
          <div className="font-mono text-[10px] text-slate-400 mt-1">
            {hoveredStation.latitude.toFixed(4)}&deg;N {hoveredStation.longitude.toFixed(4)}&deg;E
          </div>
        </div>
      )}

      {/* Floating controls (top-right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={toggle3d}
          aria-pressed={is3d}
          title={is3d ? 'Switch to 2D top-down view' : 'Switch to 3D oblique perspective'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow border transition-all cursor-pointer ${
            is3d ? 'bg-blue-600 text-white border-blue-700' : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${is3d ? 'text-white' : 'text-slate-500'}`} />
          <span>{is3d ? '3D Operations' : '2D GIS'}</span>
        </button>

        <div className="map-layer-controls">
          <button type="button" className={showWaterNetwork ? 'active' : ''} onClick={() => setShowWaterNetwork((value) => !value)} aria-pressed={showWaterNetwork} aria-label="Toggle rivers and canals" title="Toggle rivers and canals"><Droplets size={13} /><span>Waterways</span>{showWaterNetwork ? <Eye size={12} /> : <EyeOff size={12} />}</button>
          <button type="button" className={showDistribution ? 'active' : ''} onClick={() => setShowDistribution((value) => !value)} aria-pressed={showDistribution} aria-label="Toggle schematic distribution links" title="Toggle schematic distribution links"><GitBranch size={13} /><span>Distribution</span>{showDistribution ? <Eye size={12} /> : <EyeOff size={12} />}</button>
        </div>

        <button
          type="button"
          onClick={handleResetBounds}
          title="Reset to full national network extent"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow border bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Fit Bounds</span>
        </button>
      </div>

      {/* GIS Legend (bottom-left) */}
      <div className="absolute bottom-4 left-4 z-10 map-network-legend backdrop-blur-md px-3 py-2.5 rounded-xl border shadow text-[11px] space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          Network hierarchy
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" />
          <span className="text-slate-700 font-medium">National HQ Control Center (1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 shrink-0" />
          <span className="text-slate-700 font-medium">Strategic Master Stations (9)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200 shrink-0" />
          <span className="text-slate-700 font-medium">Field RTU Stations (400)</span>
        </div>
        <div className="border-t border-slate-200 pt-1.5 mt-1 space-y-1">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Connection</div>
          {(['online','warning','offline','unknown'] as const).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CSS[s].dot}`} />
              <span className="text-slate-600 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LOD badge (bottom-right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/90 text-slate-600 text-[10px] font-mono px-2 py-1 rounded-lg border border-slate-200 pointer-events-none">
        Z {zoom.toFixed(1)} &middot; {stations.length} nodes
      </div>
    </div>
  );
};
