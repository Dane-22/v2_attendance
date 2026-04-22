"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const attendance_routes_1 = __importDefault(require("./routes/attendance.routes"));
const payroll_routes_1 = __importDefault(require("./routes/payroll.routes"));
const qr_routes_1 = __importDefault(require("./routes/qr.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const logs_routes_1 = __importDefault(require("./routes/logs.routes"));
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logMonitoring_service_1 = require("./services/logMonitoring.service");
const logCleanup_job_1 = require("./jobs/logCleanup.job");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || PORT;
// Create HTTP server for Socket.IO
const httpServer = (0, http_1.createServer)(app);
// Configure Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL || 'https://attendacev2.xandree.com'
            : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }
});
global.io = io;
// Socket.IO connection handler with JWT authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        // Verify and decode JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        socket.data.user = decoded;
        next();
    }
    catch (error) {
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
    socket.on('join-branch', (branchCode) => {
        const roomName = `branch-${branchCode}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });
    // Handle room leaving
    socket.on('leave-branch', (branchCode) => {
        const roomName = `branch-${branchCode}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
    });
    socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
    });
});
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/attendance', attendance_routes_1.default);
app.use('/api/payroll', payroll_routes_1.default);
app.use('/api/qr', qr_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/logs', logs_routes_1.default);
app.use('/api/branches', branch_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use(error_middleware_1.errorHandler);
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
        (0, logMonitoring_service_1.scheduleLogMonitoring)();
        console.log('✅ Log monitoring service scheduled');
        // Schedule log cleanup (runs daily at midnight)
        (0, logCleanup_job_1.scheduleLogCleanup)();
        console.log('✅ Log cleanup job scheduled');
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔌 WebSocket ready for connections`);
        });
    }
    catch (error) {
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
//# sourceMappingURL=server.js.map