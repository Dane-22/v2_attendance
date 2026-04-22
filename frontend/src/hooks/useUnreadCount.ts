'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useWebSocket } from './useWebSocket';

/**
 * Hook to fetch and sync unread notification count
 * Uses React Query for data fetching and WebSocket for real-time updates
 */
export const useUnreadCount = () => {
  const { setUnreadCount } = useAppStore();
  const { on } = useWebSocket();

  // Fetch unread count from API
  const { data, refetch } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data?.data?.unreadCount || 0;
    },
    refetchInterval: 60000, // Refetch every minute as fallback
  });

  // Update app store when data changes
  useEffect(() => {
    if (data !== undefined) {
      setUnreadCount(data);
    }
  }, [data, setUnreadCount]);

  // Listen for WebSocket updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('[WebSocket] Notification update received, refetching count');
      refetch();
    };

    on('notification:update', handleNotificationUpdate);
  }, [on, refetch]);

  return {
    unreadCount: data || 0,
    refetch,
  };
};

export default useUnreadCount;
