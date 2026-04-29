/**
 * WebSocket Routes
 * Handles Socket.IO connection and room management
 */

import { Server as SocketIOServer } from 'socket.io';

export const setupWebSocketRoutes = (io: SocketIOServer): void => {
  // Connection handler is already in server.ts
  // This file can be used for additional WebSocket route configurations
  // For now, room management is handled directly in server.ts connection handler
};

// Helper function to emit attendance updates to a specific branch room
export const emitAttendanceUpdate = (
  io: SocketIOServer,
  branchCode: string,
  data: {
    attendanceId?: number;
    type: 'clock_in' | 'clock_out' | 'mark_absent';
    action?: 'clock_in' | 'clock_out' | 'mark_absent';
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    branchCode: string;
    branchName: string;
    timestamp: string;
    previousStatus?: string;
    newStatus?: string;
    status?: string;
  }
): void => {
  const roomName = `branch-${branchCode}`;
  io.to(roomName).emit('attendance:update', data);
  console.log(`[WebSocket] Emitted attendance update to room: ${roomName}`, data);
};

// Helper function to emit stats updates to a specific branch room
export const emitStatsUpdate = (
  io: SocketIOServer,
  branchCode: string,
  data: {
    completed: number;
    present: number;
    available: number;
    absent: number;
    total: number;
  }
): void => {
  const roomName = `branch-${branchCode}`;
  io.to(roomName).emit('stats:update', data);
  console.log(`[WebSocket] Emitted stats update to room: ${roomName}`, data);
};

// Helper function to emit notification updates to user or role rooms
export const emitNotificationUpdate = (
  io: SocketIOServer,
  data: {
    recipientType: string;
    recipientId: number;
    notificationId?: number;
    action: 'create' | 'update' | 'delete' | 'mark_all_read' | 'clear_all';
  }
): void => {
  let roomName: string;

  if (data.recipientType.startsWith('role_')) {
    roomName = data.recipientType.replace('role_', 'role-');
  } else {
    roomName = `user-${data.recipientId}`;
  }

  io.to(roomName).emit('notification:update', data);
  console.log(`[WebSocket] Emitted notification update to room: ${roomName}`, data);
};
