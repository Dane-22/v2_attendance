"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLog = exports.createLog = exports.getLogs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Valid action types and entity types for filtering
const VALID_ACTION_TYPES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SCAN', 'APPROVE', 'REJECT', 'VIEW'];
const VALID_ENTITY_TYPES = ['EMPLOYEE', 'ATTENDANCE', 'PAYROLL', 'SETTINGS', 'USER', 'BRANCH', 'DOCUMENT'];
const VALID_STATUSES = ['SUCCESS', 'FAILED', 'PENDING'];
const getLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { dateRange, startDate, endDate, actionTypes, entityTypes, userId, status, searchQuery } = req.query;
        // Build where clause
        const where = {};
        // Date range filter
        if (dateRange) {
            const now = new Date();
            switch (dateRange) {
                case 'today':
                    where.timestamp = {
                        gte: new Date(now.setHours(0, 0, 0, 0)),
                        lte: new Date(now.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    where.timestamp = {
                        gte: new Date(yesterday.setHours(0, 0, 0, 0)),
                        lte: new Date(yesterday.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'last7days':
                    const last7Days = new Date(now);
                    last7Days.setDate(last7Days.getDate() - 7);
                    where.timestamp = { gte: last7Days };
                    break;
                case 'last30days':
                    const last30Days = new Date(now);
                    last30Days.setDate(last30Days.getDate() - 30);
                    where.timestamp = { gte: last30Days };
                    break;
                case 'custom':
                    if (startDate || endDate) {
                        where.timestamp = {};
                        if (startDate)
                            where.timestamp.gte = new Date(startDate);
                        if (endDate)
                            where.timestamp.lte = new Date(endDate);
                    }
                    break;
            }
        }
        // Action type filter
        if (actionTypes) {
            const types = actionTypes.split(',').filter(t => VALID_ACTION_TYPES.includes(t));
            if (types.length > 0) {
                where.actionType = { in: types };
            }
        }
        // Entity type filter
        if (entityTypes) {
            const types = entityTypes.split(',').filter(t => VALID_ENTITY_TYPES.includes(t));
            if (types.length > 0) {
                where.entityType = { in: types };
            }
        }
        // User filter
        if (userId) {
            where.userId = parseInt(userId);
        }
        // Status filter
        if (status) {
            const statuses = status.split(',').filter(s => VALID_STATUSES.includes(s));
            if (statuses.length > 0) {
                where.status = { in: statuses };
            }
        }
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            where.OR = [
                { userName: { contains: query, mode: 'insensitive' } },
                { actionType: { contains: query, mode: 'insensitive' } },
                { entityType: { contains: query, mode: 'insensitive' } },
                { entityName: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { status: { contains: query, mode: 'insensitive' } }
            ];
        }
        // Get total count
        const total = await prisma.activityLog.count({ where });
        // Get logs with pagination
        const logs = await prisma.activityLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
        });
        // Format response to match frontend types
        const formattedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp.toISOString(),
            user: {
                id: log.userId.toString(),
                name: log.userName,
                role: log.userRole
            },
            actionType: log.actionType,
            entityType: log.entityType,
            entityId: log.entityId || undefined,
            entityName: log.entityName || undefined,
            description: log.description,
            details: log.detailsBefore || log.detailsAfter ? {
                before: log.detailsBefore || undefined,
                after: log.detailsAfter || undefined,
                changes: log.changes || undefined
            } : undefined,
            ipAddress: log.ipAddress || undefined,
            userAgent: log.userAgent || undefined,
            status: log.status,
            metadata: log.metadata || undefined
        }));
        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLogs = getLogs;
const createLog = async (req, res, next) => {
    try {
        const { userId, userName, userRole, actionType, entityType, entityId, entityName, description, details, ipAddress, userAgent, status, metadata, branchId } = req.body;
        // Generate unique ID
        const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const log = await prisma.activityLog.create({
            data: {
                id: logId,
                userId: parseInt(userId),
                userName,
                userRole,
                actionType,
                entityType,
                entityId,
                entityName,
                description,
                detailsBefore: details?.before || null,
                detailsAfter: details?.after || null,
                changes: details?.changes || null,
                ipAddress: ipAddress || req.ip,
                userAgent: userAgent || req.headers['user-agent'],
                status: status || 'SUCCESS',
                metadata: metadata || null,
                branchId: branchId ? parseInt(branchId) : null
            }
        });
        res.status(201).json({
            success: true,
            data: log
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createLog = createLog;
const deleteLog = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.activityLog.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Log deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLog = deleteLog;
//# sourceMappingURL=logs.controller.js.map