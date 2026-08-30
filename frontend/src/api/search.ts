// src/api/search.ts
import { apiClient } from './client';
import { SearchResultDto, ShareSnapshotDto } from '../types/api';

export const searchApi = {
  search: async (query: string, includeUsers: boolean = false): Promise<SearchResultDto> => {
    const res = await apiClient.get<SearchResultDto>('/api/v1/search', {
      params: { query, includeUsers }
    });
    return res.data;
  },

  getSnapshot: async (token: string): Promise<ShareSnapshotDto> => {
    const res = await apiClient.get<ShareSnapshotDto>(`/api/v1/sharing/snapshots/${token}`);
    return res.data;
  }
};

