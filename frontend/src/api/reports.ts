// src/api/reports.ts
import { apiClient } from './client';
import { CreateReportRequest, PagedResult, ReportDto } from '../types/api';

export const reportsApi = {
  listReports: async (params?: { reportType?: string; page?: number; pageSize?: number }): Promise<PagedResult<ReportDto>> => {
    const res = await apiClient.get<PagedResult<ReportDto>>('/api/v1/reports', { params });
    return res.data;
  },

  createReport: async (data: CreateReportRequest): Promise<ReportDto> => {
    const res = await apiClient.post<ReportDto>('/api/v1/reports', data);
    return res.data;
  },

  getReport: async (reportId: string): Promise<ReportDto> => {
    const res = await apiClient.get<ReportDto>(`/api/v1/reports/${reportId}`);
    return res.data;
  },

  downloadReportUrl: (reportId: string): string => {
    return `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7048'}/api/v1/reports/${reportId}/download`;
  }
};

