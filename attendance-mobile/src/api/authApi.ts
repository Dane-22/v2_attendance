import apiClient from './client';
import { ApiResponse } from '../types/api';
import { AuthPayload } from '../types';

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', {
      username,
      password,
    });

    return response.data.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/change-password', payload);
    return response.data;
  },
};
