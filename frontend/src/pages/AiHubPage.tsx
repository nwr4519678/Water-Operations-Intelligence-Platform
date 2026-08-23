// src/pages/AiHubPage.tsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAiAnomalies,
  useAiMaintenance,
  useAiClusters,
  useAiStationInsight,
} from '../hooks/useAiQueries';
import { useMapStations } from '../hooks/useViewerQueries';

import { AnomalyCard } from '../components/ai/AnomalyCard';
import { MaintenancePredictionTable } from '../components/ai/MaintenancePredictionTable';
import { ClusterMapView } from '../components/ai/ClusterMapView';
import { RiskMatrixGrid } from '../components/ai/RiskMatrixGrid';
import { AiAnomalyItem, AiMaintenancePayload, AiClusterPayload } from '../types/api';

export const AiHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'anomalies';
  const [selectedStationId, setSelectedStationId] = useState('MST-01');

  const { data: anomaliesData } = useAiAnomalies();
  const { data: maintenanceData } = useAiMaintenance(selectedStationId);
  const { data: clustersData } = useAiClusters();
  const { data: stationInsightData } = useAiStationInsight(selectedStationId);
  const { data: stationsData } = useMapStations({ pageSize: 500 });

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const anomalies = (anomaliesData?.items.map((i) => i.payload as AiAnomalyItem)) || [];
  const maintenancePayload = maintenanceData?.payload as AiMaintenancePayload | undefined;
  const clusterPayload = clustersData?.payload as AiClusterPayload | undefined;

  return (
    <section className="dashboard">
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Navigation Filter Bar */}
        <div className="filter-bar">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-chip ${activeTab === 'anomalies' ? 'active' : ''}`}
              onClick={() => setTab('anomalies')}
            >
              Anomalies ({anomalies.length})
            </button>

            <button
              type="button"
              className={`filter-chip ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => setTab('maintenance')}
            >
              Predictive Maintenance
            </button>

            <button
              type="button"
              className={`filter-chip ${activeTab === 'clusters' ? 'active' : ''}`}
              onClick={() => setTab('clusters')}
            >
              Spatial Clusters
            </button>

            <button
              type="button"
              className={`filter-chip ${activeTab === 'focus' ? 'active' : ''}`}
              onClick={() => setTab('focus')}
            >
              Focus Stations
            </button>

            <button
              type="button"
              className={`filter-chip ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => setTab('insights')}
            >
              Station Insights
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div style={{ padding: 20 }}>
          {activeTab === 'anomalies' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {anomalies.map((a) => (
                <AnomalyCard key={a.id} anomaly={a} />
              ))}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePredictionTable payload={maintenancePayload} />
          )}

          {activeTab === 'clusters' && (
            <ClusterMapView payload={clusterPayload} />
          )}

          {activeTab === 'focus' && (
            <RiskMatrixGrid />
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>
                  Select Station for Deep Inspection:
                </span>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="select"
                  style={{ background: '#fff', padding: '6px 10px' }}
                >
                  {stationsData?.items.map((s) => (
                    <option key={s.stationId} value={s.stationId}>
                      {s.stationCode} — {s.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  AI Deep Diagnostic: {selectedStationId}
                </h3>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
                  {(stationInsightData?.payload as any)?.healthSummary || 'Telemetry stream is nominal and in compliance with hydrological balance models.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
