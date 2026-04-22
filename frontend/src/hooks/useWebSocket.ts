/**
 * WebSocket Hook
 * Manages Socket.IO connection, reconnection, and event listeners
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHookReturn {
  isConnected: boolean;
  joinBranch: (branchCode: string) => void;
  leaveBranch: (branchCode: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export const useWebSocket = (): WebSocketHookReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    console.log('[WebSocket] Connecting to:', wsUrl);

    // Create Socket.IO client
    const socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    return () => {
      console.log('[WebSocket] Disconnecting...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinBranch = useCallback((branchCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-branch', branchCode);
      console.log('[WebSocket] Joined branch:', branchCode);
    }
  }, []);

  const leaveBranch = useCallback((branchCode: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-branch', branchCode);
      console.log('[WebSocket] Left branch:', branchCode);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  return {
    isConnected,
    joinBranch,
    leaveBranch,
    emit,
    on,
    off,
  };
};
