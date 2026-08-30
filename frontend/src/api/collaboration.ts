// src/api/collaboration.ts
import { apiClient } from './client';
import { ChartAnnotationDto, CollaborationNoteDto, PagedResult } from '../types/api';

export const collaborationApi = {
  getAnnotations: async (stationId: string, params?: { from?: string; to?: string }): Promise<ChartAnnotationDto[]> => {
    const res = await apiClient.get<ChartAnnotationDto[]>(`/api/v1/stations/${stationId}/annotations`, { params });
    return res.data;
  },

  getCollaborationNotes: async (stationId: string, params?: { page?: number; pageSize?: number }): Promise<PagedResult<CollaborationNoteDto>> => {
    const res = await apiClient.get<PagedResult<CollaborationNoteDto>>(`/api/v1/stations/${stationId}/collaboration-notes`, { params });
    return res.data;
  }
};

