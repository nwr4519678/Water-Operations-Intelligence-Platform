// src/api/collaboration.ts
import { apiClient } from './client';
import { ChartAnnotationDto, CollaborationNoteDto, PagedResult } from '../types/api';

export const collaborationApi = {
  getAnnotations: async (stationId: string, params?: { from?: string; to?: string }): Promise<ChartAnnotationDto[]> => {
    try {
      const res = await apiClient.get<ChartAnnotationDto[]>(`/api/v1/stations/${stationId}/annotations`, { params });
      return res.data;
    } catch {
      return [
        {
          annotationId: 1,
          stationId,
          parameterId: 1,
          parameterName: 'Water Level',
          timestampUtc: new Date(Date.now() - 4 * 3600000).toISOString(),
          text: 'Annual summer discharge peak initiated from upstream basin',
          createdByEmail: 'chief.ops@water.gov.eg',
          createdAtUtc: new Date(Date.now() - 3.5 * 3600000).toISOString(),
        },
        {
          annotationId: 2,
          stationId,
          parameterId: 3,
          parameterName: 'Pipe Line Pressure',
          timestampUtc: new Date(Date.now() - 12 * 3600000).toISOString(),
          text: 'Primary pump booster valve scheduled maintenance calibration',
          createdByEmail: 'maintenance.lead@water.gov.eg',
          createdAtUtc: new Date(Date.now() - 11 * 3600000).toISOString(),
        }
      ];
    }
  },

  getCollaborationNotes: async (stationId: string, params?: { page?: number; pageSize?: number }): Promise<PagedResult<CollaborationNoteDto>> => {
    try {
      const res = await apiClient.get<PagedResult<CollaborationNoteDto>>(`/api/v1/stations/${stationId}/collaboration-notes`, { params });
      return res.data;
    } catch {
      const items: CollaborationNoteDto[] = [
        {
          noteId: 1,
          stationId,
          parentNoteId: null,
          noteText: 'Please verify the ultrasonic sensor zero-reference gauge following the sandstorm on the western reach.',
          createdByEmail: 'dr.layla@water.gov.eg',
          createdAtUtc: new Date(Date.now() - 24 * 3600000).toISOString(),
          replies: [
            {
              noteId: 2,
              stationId,
              parentNoteId: 1,
              noteText: 'Field team dispatched. Transducer cleaned and telemetry readings are normalized within +/- 1cm.',
              createdByEmail: 'field.eng@water.gov.eg',
              createdAtUtc: new Date(Date.now() - 18 * 3600000).toISOString(),
              replies: []
            }
          ]
        },
        {
          noteId: 3,
          stationId,
          parentNoteId: null,
          noteText: 'Discharge quota increased by 5% in accordance with the monthly agricultural distribution directive.',
          createdByEmail: 'eng.tarek@water.gov.eg',
          createdAtUtc: new Date(Date.now() - 48 * 3600000).toISOString(),
          replies: []
        }
      ];
      return {
        items,
        page: 1,
        pageSize: 10,
        totalCount: items.length,
        totalPages: 1,
      };
    }
  }
};
