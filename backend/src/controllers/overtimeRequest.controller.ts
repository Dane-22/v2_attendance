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

      // Validate employee exists by employeeId or name
      let employee: any = null;

      if (data.employeeId) {
        employee = await prisma.employee.findUnique({
          where: { id: Number(data.employeeId) }
        });
      }

      if (!employee && data.employeeCode) {
        employee = await prisma.employee.findUnique({
          where: { employeeCode: data.employeeCode }
        });
      }

      if (!employee && data.employeeName) {
        const nameParts = data.employeeName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        console.log('[OvertimeRequest] Looking for employee by name:', { firstName, lastName, fullName: data.employeeName });

        employee = await prisma.employee.findFirst({
          where: {
            firstName: firstName,
            lastName: lastName
          }
        });

        if (!employee) {
          console.log('[OvertimeRequest] Employee not found with exact match. Trying first name only...');
          employee = await prisma.employee.findFirst({
            where: {
              firstName: firstName
            }
          });
        }
      }

      if (!employee) {
        console.log('[OvertimeRequest] Employee not found:', { employeeId: data.employeeId, employeeName: data.employeeName });
        return {
          success: false,
          message: data.employeeName 
            ? `Employee not found with the provided name: "${data.employeeName}". Please select an employee from the list.`
            : 'Employee not found. Please select a valid employee.'
        };
      }

      console.log('[OvertimeRequest] Found employee:', employee.id, employee.firstName, employee.lastName);

      // Check attendance status on request date if record exists
      const admin = await prisma.admins.findUnique({
        where: { id: adminId },
        select: { employeeId: true }
      });

      const isSelfRequest = admin?.employeeId === employee.id;

      if (!isSelfRequest) {
        console.log('[OvertimeRequest] Checking attendance for employeeId:', employee.id, 'on date:', data.requestDate);
        const reqDateObj = new Date(data.requestDate);
        const startOfDay = new Date(reqDateObj.getFullYear(), reqDateObj.getMonth(), reqDateObj.getDate(), 0, 0, 0);
        const endOfDay = new Date(reqDateObj.getFullYear(), reqDateObj.getMonth(), reqDateObj.getDate(), 23, 59, 59, 999);

        const attendance = await prisma.attendance.findFirst({
          where: {
            employeeId: employee.id,
            date: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        console.log('[OvertimeRequest] Attendance record:', attendance);
        // If attendance status exists and is absent, reject the overtime request
        if (attendance && attendance.status === attendance_status.absent) {
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

      // Create notification for all admins (including requester for feed visibility)
      const admins = await prisma.admins.findMany({
        where: {
          role: {
            in: ['admin', 'super_admin']
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
            message: `Overtime request submitted for ${employee.firstName} ${employee.lastName} on ${data.requestDate}.\nHours: ${requestedHours}\nReason: ${data.reason}`,
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
        where: { id }
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
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid overtime request ID provided'
        };
      }

      const adminId = req.admin?.id;
      if (!adminId) {
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      const request = await prisma.overtimeRequest.findUnique({
        where: { id }
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
          reviewedAt: new Date(),
          reviewNote: data.reviewNote
        }
      });

      // Delete old pending notifications for this request
      await prisma.notifications.deleteMany({
        where: {
          link: {
            contains: `overtimeRequestId=${id}`
          },
          title: 'New Overtime Request'
        }
      });

      // Create notification to the requester (admin who requested the overtime)
      await prisma.notifications.create({
        data: {
          recipient_type: 'admin',
          recipient_id: request.requestedByAdminId,
          type: 'OVERTIME_REQUEST',
          title: 'Overtime Request Approved',
          message: `Overtime request for employee ID ${request.employeeId} on ${request.requestDate.toDateString()} has been approved`,
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
          entityName: `Overtime Request - Employee ID ${request.employeeId}`,
          description: `Approved overtime request for employee ID ${request.employeeId}`
        }
      });

      return {
        success: true,
        message: 'Overtime request approved successfully',
        data: updatedRequest
      };
    } catch (error: any) {
      require('fs').writeFileSync('backend-error.txt', String(error) + '\n' + error.stack);
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
      if (!id || isNaN(id)) {
        return {
          success: false,
          message: 'Invalid overtime request ID provided'
        };
      }

      const adminId = req.admin?.id;
      if (!adminId) {
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      const request = await prisma.overtimeRequest.findUnique({
        where: { id }
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
        }
      });

      // Delete old pending notifications for this request
      await prisma.notifications.deleteMany({
        where: {
          link: {
            contains: `overtimeRequestId=${id}`
          },
          title: 'New Overtime Request'
        }
      });

      // Create notification to the requester (admin who requested the overtime)
      await prisma.notifications.create({
        data: {
          recipient_type: 'admin',
          recipient_id: request.requestedByAdminId,
          type: 'OVERTIME_REQUEST',
          title: 'Overtime Request Rejected',
          message: `Overtime request for employee ID ${request.employeeId} on ${request.requestDate.toDateString()} has been rejected`,
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
          entityName: `Overtime Request - Employee ID ${request.employeeId}`,
          description: `Rejected overtime request for employee ID ${request.employeeId}`,
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

  // Batch Create Overtime Requests for multiple employees
  static async createBatchOvertimeRequests(
    req: AuthenticatedRequest,
    data: any
  ): Promise<ApiResponse> {
    console.log('[OvertimeRequest] Batch create request received:', data);
    try {
      const adminId = req.admin?.id;
      if (!adminId) {
        return {
          success: false,
          message: 'Admin authentication required'
        };
      }

      const employeeIds: number[] = Array.isArray(data.employeeIds) ? data.employeeIds.map(Number) : [];
      const employeeCodes: string[] = Array.isArray(data.employeeCodes) ? data.employeeCodes : [];
      
      let targetEmployees: any[] = [];
      if (employeeIds.length > 0) {
        targetEmployees = await prisma.employee.findMany({
          where: { id: { in: employeeIds } }
        });
      } else if (employeeCodes.length > 0) {
        targetEmployees = await prisma.employee.findMany({
          where: { employeeCode: { in: employeeCodes } }
        });
      }

      if (targetEmployees.length === 0) {
        return {
          success: false,
          message: 'No valid employees selected for overtime request'
        };
      }

      let requestedHours = data.requestedHours;
      if (!requestedHours || Number(requestedHours) <= 0) {
        const startMins = this.timeToMinutes(data.startTime || '17:00');
        const endMins = this.timeToMinutes(data.endTime || '19:00');
        requestedHours = Math.max(0.5, (endMins - startMins) / 60);
      }

      const reqDateObj = new Date(data.requestDate);

      const existingRequests = await prisma.overtimeRequest.findMany({
        where: {
          employeeId: { in: targetEmployees.map(e => e.id) },
          requestDate: reqDateObj,
          status: {
            in: ['PENDING', 'APPROVED', 'APPLIED_TO_PAYROLL']
          }
        }
      });

      if (existingRequests.length > 0) {
        const existingEmpIds = existingRequests.map(r => r.employeeId);
        targetEmployees = targetEmployees.filter(e => !existingEmpIds.includes(e.id));
        
        if (targetEmployees.length === 0) {
          return {
            success: false,
            message: 'Overtime requests already exist for all selected employees on this date'
          };
        }
      }

      const createdRequests = await prisma.$transaction(
        targetEmployees.map((emp) =>
          prisma.overtimeRequest.create({
            data: {
              employeeId: emp.id,
              requestedByAdminId: adminId,
              requestDate: reqDateObj,
              startTime: data.startTime || '17:00',
              endTime: data.endTime || '19:00',
              requestedHours: Number(requestedHours),
              reason: data.reason || 'Branch Overtime Request',
              status: 'PENDING'
            }
          })
        )
      );

      // Create admin notification
      const admins = await prisma.admins.findMany({
        where: { role: { in: ['admin', 'super_admin'] } }
      });

      const notificationPromises = admins.map(admin =>
        prisma.notifications.create({
          data: {
            recipient_type: 'admin',
            recipient_id: admin.id,
            type: 'OVERTIME_REQUEST',
            title: 'Batch Overtime Request Submitted',
            message: `Submitted batch overtime request for ${createdRequests.length} employee(s) on ${reqDateObj.toDateString()}.\nHours: ${requestedHours}\nReason: ${data.reason || 'Branch Overtime Request'}`,
            link: `/dashboard/overtime-approval`
          }
        })
      );
      await Promise.all(notificationPromises);

      // Emit WebSocket event if available
      if (global.io) {
        admins.forEach(admin => {
          emitNotificationUpdate(global.io, {
            recipientType: 'admin',
            recipientId: admin.id,
            action: 'create'
          });
        });
      }

      return {
        success: true,
        message: `Successfully submitted overtime request for ${createdRequests.length} employee(s)`,
        data: createdRequests
      };
    } catch (error: any) {
      console.error('Error creating batch overtime requests:', error);
      return {
        success: false,
        message: error?.message || 'Failed to submit batch overtime request'
      };
    }
  }

  // Helper method to convert time string to minutes
  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
