// src/api/viewer.ts
import { apiClient } from './client';
import {
  OperationsOverviewDto,
  MapStationDto,
  StationDetailDto,
  AlarmDto,
  OrganizationDto,
  RegionDto,
  StationSummaryDto,
  TelemetryPointDto,
  PagedResult
} from '../types/api';

export interface MapStationsParams {
  search?: string;
  regionId?: string;
  status?: string;
  minLatitude?: number;
  maxLatitude?: number;
  minLongitude?: number;
  maxLongitude?: number;
  page?: number;
  pageSize?: number;
}

export interface AlarmsParams {
  stationId?: string;
  severity?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const viewerApi = {
  overview: async (asOf?: string): Promise<OperationsOverviewDto> => {
    const res = await apiClient.get<OperationsOverviewDto>('/api/v1/viewer/overview', { params: { asOf } });
    return res.data;
  },

  mapStations: async (params?: MapStationsParams): Promise<PagedResult<MapStationDto>> => {
    const res = await apiClient.get<PagedResult<MapStationDto>>('/api/v1/viewer/map/stations', { params });
    return res.data;
  },

  stationDetail: async (stationId: string): Promise<StationDetailDto> => {
    const res = await apiClient.get<StationDetailDto>(`/api/v1/viewer/stations/${stationId}`);
    return res.data;
  },

  alarms: async (params?: AlarmsParams): Promise<PagedResult<AlarmDto>> => {
    const res = await apiClient.get<PagedResult<AlarmDto>>('/api/v1/viewer/alarms', { params });
    return res.data;
  },

  alarmDetail: async (alarmId: string): Promise<AlarmDto> => {
    const res = await apiClient.get<AlarmDto>(`/api/v1/viewer/alarms/${alarmId}`);
    return res.data;
  },

  organizations: async (): Promise<OrganizationDto[]> => {
    const res = await apiClient.get<OrganizationDto[]>('/api/v1/viewer/organizations');
    return res.data;
  },

  regions: async (organizationId: string = '11111111-1111-1111-1111-111111111111'): Promise<RegionDto[]> => {
    const res = await apiClient.get<RegionDto[]>(`/api/v1/viewer/organizations/${organizationId}/regions`);
    return res.data;
  },

  regionStations: async (regionId: string): Promise<StationSummaryDto[]> => {
    const res = await apiClient.get<StationSummaryDto[]>(`/api/v1/viewer/regions/${regionId}/stations`);
    return res.data;
  },

  stationMeasurements: async (stationId: string, params?: { from?: string; to?: string; parameterId?: number; limit?: number }): Promise<TelemetryPointDto[]> => {
    const res = await apiClient.get<TelemetryPointDto[]>(`/api/v1/viewer/stations/${stationId}/measurements`, { params });
    return res.data;
  },

  stationAlarms: async (stationId: string): Promise<AlarmDto[]> => {
    const res = await apiClient.get<AlarmDto[]>(`/api/v1/viewer/stations/${stationId}/alarms`);
    return res.data;
  },
};

