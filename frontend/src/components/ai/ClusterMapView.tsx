// src/components/ai/ClusterMapView.tsx
import React, { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '../common/Card';
import { AiClusterPayload } from '../../types/api';

export const ClusterMapView: React.FC<{
  payload?: AiClusterPayload | null;
}> = ({ payload }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);

  const clusters = payload?.clusters || [];

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap, &copy; CARTO',
          },
        },
        layers: [
          {
            id: 'base-tiles',
            type: 'raster',
            source: 'carto-voyager',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [30.5, 27.0],
      zoom: 5.5,
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      // Add cluster GeoJSON source & circle layer
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: clusters.map((c) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [c.centroidLongitude, c.centroidLatitude],
          },
          properties: {
            clusterName: c.clusterName,
            stationCount: c.stationIds.length,
          },
        })),
      };

      if (!map.getSource('ai-clusters')) {
        map.addSource('ai-clusters', {
          type: 'geojson',
          data: geojson,
        });

        // Outer halo
        map.addLayer({
          id: 'cluster-halo',
          type: 'circle',
          source: 'ai-clusters',
          paint: {
            'circle-radius': 36,
            'circle-color': '#8b5cf6',
            'circle-opacity': 0.2,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#8b5cf6',
            'circle-stroke-opacity': 0.6,
          },
        });

        // Center core
        map.addLayer({
          id: 'cluster-core',
          type: 'circle',
          source: 'ai-clusters',
          paint: {
            'circle-radius': 8,
            'circle-color': '#7c3aed',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Click popup
        map.on('click', 'cluster-core', (e) => {
          const props = e.features?.[0]?.properties;
          if (props) {
            const coords = (e.features![0].geometry as any).coordinates.slice();
            new Popup()
              .setLngLat(coords)
              .setHTML(`
                <div style="font-family:'Manrope',sans-serif;font-size:12px;color:#0f172a;padding:4px;">
                  <strong style="color:#7c3aed;">${props.clusterName}</strong>
                  <div style="color:#64748b;margin-top:2px;">${props.stationCount} Stations correlated</div>
                </div>
              `)
              .addTo(map);
          }
        });

        map.on('mouseenter', 'cluster-core', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'cluster-core', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [clusters]);

  return (
    <Card className="p-0 overflow-hidden bg-white border-slate-200 text-slate-900 shadow-xs">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">
          Spatial Hydrological Clusters (DBSCAN)
        </h3>
        <p className="text-[11px] text-slate-400">
          Geographic co-variance & regional hydraulic correlation groupings (MapLibre GL JS)
        </p>
      </div>
      <div ref={mapContainerRef} style={{ height: '360px', width: '100%' }} />
    </Card>
  );
};
