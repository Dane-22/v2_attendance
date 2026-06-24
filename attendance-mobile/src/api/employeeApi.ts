import apiClient from './client';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface SearchEmployee {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  position: string | null;
  branchName: string | null;
  branchCode: string | null;
  status: string | null;
  profileImage: string | null;
}

export interface ResolvedEmployee {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  middleName?: string | null;
  lastName: string | null;
  branchCode: string | null;
  branchName: string | null;
  status: string | null;
  faceCaptureImage?: string | null;
}

export interface FaceCaptureUploadResult extends ResolvedEmployee {
  profileImage?: string | null;
  updatedAt?: string | null;
}

export const employeeApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<SearchEmployee[]>>('/employees', { params });
    return response.data;
  },

  transfer: async (id: number, payload: { branchCode: string; reason?: string }) => {
    const response = await apiClient.patch<ApiResponse<{ employee: SearchEmployee; previousBranch: string | null }>>(
      `/employees/${id}/transfer`,
      payload
    );
    return response.data.data;
  },

  resolveScan: async (payload: { qrCodeData?: string; employeeCode?: string; employeeId?: number }) => {
    const response = await apiClient.post<ApiResponse<{ decoded: any; employee: ResolvedEmployee; isValid: boolean }>>('/qr/decode', { qrData: payload.qrCodeData || payload.employeeCode });
    return response.data.data.employee;
  },

  uploadFaceCapture: async (id: number, payload: { uri: string; branchCode: string; fileName?: string; mimeType?: string }) => {
    const formData = new FormData();
    formData.append('branchCode', payload.branchCode);
    formData.append(
      'faceCapture',
      {
        uri: payload.uri,
        name: payload.fileName || `face-capture-${id}.jpg`,
        type: payload.mimeType || 'image/jpeg',
      } as any
    );

    const response = await apiClient.post<ApiResponse<FaceCaptureUploadResult>>(
      `/employees/${id}/upload-face-capture`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },
};
