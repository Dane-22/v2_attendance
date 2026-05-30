import apiClient from './client';
import { ApiResponse } from '../types/api';
import { NotificationsPayload } from '../types';

export const notificationApi = {
  getAll: async (params?: { page?: number; limit?: number; filter?: string }) => {
    const response = await apiClient.get<ApiResponse<NotificationsPayload>>('/notifications', { params });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return response.data.data;
  },

  markAsRead: async (id: number) => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    const response = await apiClient.put<ApiResponse<{ markedCount: number }>>('/notifications/read-all');
    return response.data.data;
  },

  clearAll: async () => {
    const response = await apiClient.delete<ApiResponse<{ clearedCount: number }>>('/notifications/clear-all');
    return response.data.data;
  },

  deleteOne: async (id: number) => {
    await apiClient.delete(`/notifications/${id}`);
  },

  createTestNotification: async (type: string, isUrgent = false) => {
    const response = await apiClient.post<ApiResponse<any>>('/notifications/test', { type, isUrgent });
    return response.data.data;
  },
};
