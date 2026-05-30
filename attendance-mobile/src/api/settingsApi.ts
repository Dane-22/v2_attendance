import apiClient from './client';
import { ApiResponse } from '../types/api';
import { SettingsPayload } from '../types';

export const settingsApi = {
  get: async () => {
    const response = await apiClient.get<ApiResponse<SettingsPayload | null>>('/settings');
    return response.data.data;
  },

  update: async (payload: Partial<SettingsPayload>) => {
    const response = await apiClient.put<ApiResponse<SettingsPayload>>('/settings', payload);
    return response.data.data;
  },
};
