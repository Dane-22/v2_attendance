import { PrismaClient, attendance_status } from '@prisma/client';
import { 
  ApiResponse, 
  CreateOvertimeRequestInput, 
  ReviewOvertimeRequestInput, 
  OvertimeRequestFilter
} from '../types/api.types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emitNotificationUpdate } from '../routes/websocket.routes';

const prisma = new PrismaClient();

export class OvertimeRequestController {
  // Create overtime request
  static async createOvertimeRequest(
    req: AuthenticatedRequest,
    data: CreateOvertimeRequestInput
  ): Promise<ApiResponse> {
    console.log('[OvertimeRequest] Create request received:', data);
    try {
      const adminId = req.admin?.id;
      console.log('[OvertimeRequest] Admin ID:', adminId);
      if (!adminId) {
        console.log('[OvertimeRequest] No admin ID found');
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      // Validate employee exists by name
      const nameParts = data.employeeName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      console.log('[OvertimeRequest] Looking for employee:', { firstName, lastName, fullName: data.employeeName });

      let employee = await prisma.employee.findFirst({
        where: {
          firstName: firstName,
          lastName: lastName
        }
      });

      if (!employee) {
        console.log('[OvertimeRequest] Employee not found with exact match. Trying first name only...');
        // Try to find by first name only if last name is empty or not found
        employee = await prisma.employee.findFirst({
          where: {
            firstName: firstName
          }
        });

        if (!employee) {
          console.log('[OvertimeRequest] Employee not found with name:', data.employeeName);
          return {
            success: false,
            message: `Employee not found with the provided name: "${data.employeeName}". Please check the exact name (e.g., "John Doe")`
          };
        }

        console.log('[OvertimeRequest] Found employee by first name only:', employee.firstName, employee.lastName);
      } else {
        console.log('[OvertimeRequest] Found employee:', employee.firstName, employee.lastName);
      }

      // Validate attendance record exists on request date
      // Skip attendance check for admins submitting for themselves (via employeeId)
      const admin = await prisma.admins.findUnique({
        where: { id: adminId },
        select: { employeeId: true }
      });

      const isSelfRequest = admin?.employeeId === employee.id;

      if (!isSelfRequest) {
        console.log('[OvertimeRequest] Checking attendance for employeeId:', employee.id, 'on date:', data.requestDate);
        const attendance = await prisma.attendance.findFirst({
          where: {
            employeeId: employee.id,
            date: new Date(data.requestDate)
          }
        });

        console.log('[OvertimeRequest] Attendance record:', attendance);
        if (!attendance) {
          console.log('[OvertimeRequest] No attendance record found');
          return {
            success: false,
            message: 'No attendance record found for the requested date'
          };
        }

        // If attendance status is absent, reject the overtime request
        if (attendance.status === attendance_status.absent) {
          console.log('[OvertimeRequest] Attendance status is absent');
          return {
            success: false,
            message: 'Overtime request cannot be created for absent attendance'
          };
        }
      } else {
        console.log('[OvertimeRequest] Skipping attendance check for admin self-request');
      }

      // Check for duplicate requests for same employee/date
      const existingRequest = await prisma.overtimeRequest.findFirst({
        where: {
          employeeId: employee.id,
          requestDate: new Date(data.requestDate),
          status: {
            in: ['PENDING', 'APPROVED', 'APPLIED_TO_PAYROLL']
          }
        }
      });

      if (existingRequest) {
        return {
          success: false,
          message: `An overtime request already exists for this employee and date (Status: ${existingRequest.status})`
        };
      }

      // Auto-calculate hours from start/end time if not provided
      let requestedHours = data.requestedHours;
      if (!requestedHours) {
        const startMins = this.timeToMinutes(data.startTime);
        const endMins = this.timeToMinutes(data.endTime);
        requestedHours = (endMins - startMins) / 60;
        
        if (requestedHours <= 0) {
          return {
            success: false,
            message: 'End time must be after start time'
          };
        }
      }

      // Create overtime request
      const overtimeRequest = await prisma.overtimeRequest.create({
        data: {
          employeeId: employee.id,
          requestedByAdminId: adminId,
          requestDate: new Date(data.requestDate),
          startTime: data.startTime,
          endTime: data.endTime,
          requestedHours: requestedHours,
          reason: data.reason,
          status: 'PENDING'
        }
      });

      // Create notification for all admins except the requester
      const admins = await prisma.admins.findMany({
        where: {
          role: {
            in: ['admin', 'super_admin']
          },
          id: {
            not: adminId
          }
        }
      });

      const notificationPromises = admins.map(admin =>
        prisma.notifications.create({
          data: {
            recipient_type: 'admin',
            recipient_id: admin.id,
            type: 'OVERTIME_REQUEST',
            title: 'New Overtime Request',
            message: `Overtime request submitted for ${employee.firstName} ${employee.lastName} on ${data.requestDate}`,
            link: `/dashboard/notifications?overtimeRequestId=${overtimeRequest.id}`
          }
        })
      );

      await Promise.all(notificationPromises);

      // Emit WebSocket event for real-time notification updates
      if (global.io) {
        admins.forEach(admin => {
          emitNotificationUpdate(global.io, {
            recipientType: 'admin',
            recipientId: admin.id,
            action: 'create',
          });
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          id: `OT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          userId: adminId,
          userName: req.admin?.name || 'Unknown',
          userRole: 'admin',
          actionType: 'CREATE',
          entityType: 'OVERTIME_REQUEST',
          entityId: overtimeRequest.id.toString(),
          entityName: `Overtime Request - ${employee.firstName} ${employee.lastName}`,
          description: `Created overtime request for ${employee.firstName} ${employee.lastName} on ${data.requestDate}`,
          detailsAfter: {
            employeeId: employee.id,
            employeeName: data.employeeName,
            requestDate: data.requestDate,
            startTime: data.startTime,
            endTime: data.endTime,
            requestedHours: requestedHours,
            reason: data.reason
          }
        }
      });

      return {
        success: true,
        message: 'Overtime request created successfully',
        data: overtimeRequest
      };
    } catch (error) {
      console.error('Error creating overtime request:', error);
      return {
        success: false,
        message: 'Failed to create overtime request'
      };
    }
  }

  // Get all overtime requests with pagination and filters
  static async getOvertimeRequests(
    req: AuthenticatedRequest,
    query: OvertimeRequestFilter & { page?: number; limit?: number }
  ): Promise<ApiResponse> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.employeeId) {
        where.employeeId = query.employeeId;
      }

      if (query.branchCode) {
        where.employee = {
          branchCode: query.branchCode
        };
      }

      if (query.startDate && query.endDate) {
        where.requestDate = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate)
        };
      }

      const [requests, total] = await Promise.all([
        prisma.overtimeRequest.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                position: true,
                branchName: true,
                branchCode: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.overtimeRequest.count({ where })
      ]);

      return {
        success: true,
        message: 'Overtime requests retrieved successfully',
        data: requests,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting overtime requests:', error);
      return {
        success: false,
        message: 'Failed to retrieve overtime requests'
      };
    }
  }

  // Get overtime request by ID
  static async getOvertimeRequestById(
    req: AuthenticatedRequest,
    id: number
  ): Promise<ApiResponse> {
    try {
      const request = await prisma.overtimeRequest.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              position: true,
              branchName: true,
              branchCode: true
            }
          }
        }
      });

      if (!request) {
        return {
          success: false,
          message: 'Overtime request not found'
        };
      }

      return {
        success: true,
        message: 'Overtime request retrieved successfully',
        data: request
      };
    } catch (error) {
      console.error('Error getting overtime request:', error);
      return {
        success: false,
        message: 'Failed to retrieve overtime request'
      };
    }
  }

  // Approve overtime request
  static async approveOvertimeRequest(
    req: AuthenticatedRequest,
    id: number,
    data: ReviewOvertimeRequestInput
  ): Promise<ApiResponse> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      const request = await prisma.overtimeRequest.findUnique({
        where: { id },
        include: {
          employee: true
        }
      });

      if (!request) {
        return {
          success: false,
          message: 'Overtime request not found'
        };
      }

      if (request.status !== 'PENDING') {
        return {
          success: false,
          message: 'Only pending requests can be approved'
        };
      }

      // Update request status
      const updatedRequest = await prisma.overtimeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedByAdminId: adminId,
          reviewedAt: new Date()
        },
        include: {
          employee: true
        }
      });

      // Create notification to the requester (admin who requested the overtime)
      await prisma.notifications.create({
        data: {
          recipient_type: 'admin',
          recipient_id: request.requestedByAdminId,
          type: 'OVERTIME_REQUEST',
          title: 'Overtime Request Approved',
          message: `Overtime request for ${request.employee.firstName} ${request.employee.lastName} on ${request.requestDate.toDateString()} has been approved`,
          link: `/dashboard/notifications?overtimeRequestId=${id}`
        }
      });

      // Emit WebSocket event for real-time notification update to requester
      if (global.io) {
        emitNotificationUpdate(global.io, {
          recipientType: 'admin',
          recipientId: request.requestedByAdminId,
          action: 'create',
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          id: `OT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          userId: adminId,
          userName: req.admin?.name || 'Unknown',
          userRole: 'admin',
          actionType: 'APPROVE',
          entityType: 'OVERTIME_REQUEST',
          entityId: id.toString(),
          entityName: `Overtime Request - ${request.employee.firstName} ${request.employee.lastName}`,
          description: `Approved overtime request for ${request.employee.firstName} ${request.employee.lastName}`
        }
      });

      return {
        success: true,
        message: 'Overtime request approved successfully',
        data: updatedRequest
      };
    } catch (error) {
      console.error('Error approving overtime request:', error);
      return {
        success: false,
        message: 'Failed to approve overtime request'
      };
    }
  }

  // Reject overtime request
  static async rejectOvertimeRequest(
    req: AuthenticatedRequest,
    id: number,
    data: ReviewOvertimeRequestInput
  ): Promise<ApiResponse> {
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      const request = await prisma.overtimeRequest.findUnique({
        where: { id },
        include: {
          employee: true
        }
      });

      if (!request) {
        return {
          success: false,
          message: 'Overtime request not found'
        };
      }

      if (request.status !== 'PENDING') {
        return {
          success: false,
          message: 'Only pending requests can be rejected'
        };
      }

      // Update request status
      const updatedRequest = await prisma.overtimeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
          reviewNote: data.reviewNote
        },
        include: {
          employee: true
        }
      });

      // Create notification to the requester (admin who requested the overtime)
      await prisma.notifications.create({
        data: {
          recipient_type: 'admin',
          recipient_id: request.requestedByAdminId,
          type: 'OVERTIME_REQUEST',
          title: 'Overtime Request Rejected',
          message: `Overtime request for ${request.employee.firstName} ${request.employee.lastName} on ${request.requestDate.toDateString()} has been rejected`,
          link: `/dashboard/notifications?overtimeRequestId=${id}`
        }
      });

      // Emit WebSocket event for real-time notification update to requester
      if (global.io) {
        emitNotificationUpdate(global.io, {
          recipientType: 'admin',
          recipientId: request.requestedByAdminId,
          action: 'create',
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          id: `OT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          userId: adminId,
          userName: req.admin?.name || 'Unknown',
          userRole: 'admin',
          actionType: 'REJECT',
          entityType: 'OVERTIME_REQUEST',
          entityId: id.toString(),
          entityName: `Overtime Request - ${request.employee.firstName} ${request.employee.lastName}`,
          description: `Rejected overtime request for ${request.employee.firstName} ${request.employee.lastName}`,
          detailsAfter: {
            reviewNote: data.reviewNote
          }
        }
      });

      return {
        success: true,
        message: 'Overtime request rejected successfully',
        data: updatedRequest
      };
    } catch (error) {
      console.error('Error rejecting overtime request:', error);
      return {
        success: false,
        message: 'Failed to reject overtime request'
      };
    }
  }

  // Helper method to convert time string to minutes
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
