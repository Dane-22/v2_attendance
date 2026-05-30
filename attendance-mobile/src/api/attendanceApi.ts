import apiClient from './client';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { AttendanceAuditRecord, AttendanceRecord, AttendanceStatsSummary } from '../types';

export const attendanceApi = {
  getAudit: async (params: { date?: string; branch_code?: string; status?: string }) => {
    const response = await apiClient.get<
      ApiResponse<{
        date: string;
        records: AttendanceAuditRecord[];
        stats: {
          totalRecords: number;
          currentlyPresent: number;
          completedShifts: number;
          absent: number;
          present: number;
          late: number;
        };
      }>
    >('/attendance/audit', { params });

    return response.data.data;
  },

  getAll: async (params?: { page?: number; limit?: number; branch_code?: string; employeeId?: number }) => {
    const response = await apiClient.get<PaginatedResponse<AttendanceRecord[]>>('/attendance', { params });
    return response.data;
  },

  getToday: async (employeeId: number) => {
    const response = await apiClient.get<ApiResponse<AttendanceRecord | null>>('/attendance/today', {
      params: { employeeId },
    });
    return response.data.data;
  },

  getStats: async (employeeId: number) => {
    const response = await apiClient.get<
      ApiResponse<{
        period: { start: string; end: string };
        stats: AttendanceStatsSummary;
      }>
    >('/attendance/stats', {
      params: { employeeId },
    });

    return response.data.data;
  },

  clock: async (qrCodeData: string, notes?: string) => {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/clock', {
      qrCodeData,
      notes,
    });

    return response.data;
  },

  markAbsent: async (branch_code: string) => {
    const response = await apiClient.post<ApiResponse<{ markedCount: number }>>('/attendance/mark-absent', {
      branch_code,
    });
    return response.data.data;
  },

  markIndividualAbsent: async (employeeId: number) => {
    const response = await apiClient.post<ApiResponse<any>>(`/attendance/mark-absent/${employeeId}`);
    return response.data.data;
  },

  manualClockIn: async (employeeId: number, branch_code?: string) => {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/manual-clock-in', {
      employeeId,
      branch_code,
    });
    return response.data.data;
  },

  manualClockInWithTransfer: async (employeeId: number, branch_code: string) => {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/manual-clock-in-with-transfer', {
      employeeId,
      branch_code,
    });
    return response.data.data;
  },

  manualClockOut: async (employeeId: number) => {
    const response = await apiClient.post<ApiResponse<any>>('/attendance/manual-clock-out', {
      employeeId,
    });
    return response.data.data;
  },
};
