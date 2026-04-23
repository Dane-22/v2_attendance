import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import payrollRoutes from './routes/payroll.routes';
import qrRoutes from './routes/qr.routes';
import reportRoutes from './routes/report.routes';
import logsRoutes from './routes/logs.routes';
import branchRoutes from './routes/branch.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';
import { logBufferService } from './services/logBuffer.service';
import { scheduleLogMonitoring } from './services/logMonitoring.service';
import { scheduleLogCleanup } from './jobs/logCleanup.job';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || PORT;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Configure Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://attendacev2.xandree.com'
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }
});

// Make io instance available globally for controllers
declare global {
  var io: SocketIOServer;
}
global.io = io;

// Socket.IO connection handler with JWT authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('[WebSocket] JWT verification failed:', error);
    // For development, allow connection even with invalid token
    // In production, uncomment: return next(new Error('Authentication error'));
    next();
  }
});

io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);

  // Join user-specific and role-based rooms for notifications
  const user = socket.data.user;
  if (user) {
    // Join user-specific room
    const userRoom = `user-${user.id}`;
    socket.join(userRoom);
    console.log(`Socket ${socket.id} joined user room: ${userRoom}`);

    // Join role-based room
    if (user.role) {
      const roleRoom = `role-${user.role}`;
      socket.join(roleRoom);
      console.log(`Socket ${socket.id} joined role room: ${roleRoom}`);
    }
  }

  // Handle room joining
  socket.on('join-branch', (branchCode: string) => {
    const roomName = `branch-${branchCode}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // Handle room leaving
  socket.on('leave-branch', (branchCode: string) => {
    const roomName = `branch-${branchCode}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://attendacev2.xandree.com'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize log buffer service (already auto-initialized on import)
    console.log('✅ Log buffer service initialized');

    // Schedule log monitoring (runs every 5 minutes)
    scheduleLogMonitoring();
    console.log('✅ Log monitoring service scheduled');

    // Schedule log cleanup (runs daily at midnight)
    scheduleLogCleanup();
    console.log('✅ Log cleanup job scheduled');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
