import { Employee, Attendance, PayrollRecord } from '@prisma/client';
import { Request } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface LoginRequest {
    employeeCode: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    employee: EmployeeWithoutSensitive;
}
export type EmployeeWithoutSensitive = Employee;
export interface CreateEmployeeRequest {
    employeeCode: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    department?: string;
    position?: string;
    branchName?: string;
    branchCode?: string;
    dailyRate?: number;
    performanceAllowance?: number;
    hasDeductions?: boolean;
    hasDeduction?: boolean;
}
export interface UpdateEmployeeRequest {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    department?: string;
    position?: string;
    branchName?: string;
    branchCode?: string;
    status?: string;
    dailyRate?: number;
    performanceAllowance?: number;
    hasDeductions?: boolean;
    hasDeduction?: boolean;
}
export interface ClockInRequest {
    qrCodeData: string;
    notes?: string;
}
export interface ClockOutRequest {
    qrCodeData: string;
    notes?: string;
}
export interface AttendanceResponse extends Attendance {
    employee?: Employee;
}
export interface PayrollCalculationRequest {
    employeeId: number;
    weekStart: string;
    weekEnd: string;
}
export interface PayrollResponse extends PayrollRecord {
    employee?: Employee;
}
export interface QRCodeData {
    version: 'V1' | 'V2';
    employeeCode: string;
    employeeId?: number;
    employeeName?: string;
    timestamp?: string;
    hash?: string;
}
export interface AttendanceStats {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHoursPerDay: number;
}
export interface PayrollSummary {
    period: string;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalTax: number;
    employeeCount: number;
}
export interface MonthlyReport {
    month: string;
    year: number;
    attendanceStats: AttendanceStats;
    payrollSummary: PayrollSummary;
}
export interface JWTPayload {
    employeeId: number;
    employeeCode: string;
    role: string;
    iat: number;
    exp: number;
}
export interface AuthenticatedRequest extends Request {
    employee?: EmployeeWithoutSensitive;
    token?: string;
}
//# sourceMappingURL=api.types.d.ts.map