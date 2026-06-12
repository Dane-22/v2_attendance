# Overtime Request System Documentation

## Overview

The Overtime Request System allows employees and administrators to request, approve, and track overtime hours that are automatically integrated into payroll calculations. The system supports different workflows for workers (direct submission) and non-workers (admin-submitted requests).

## Database Schema

### OvertimeRequest Model

```sql
model OvertimeRequest {
  id                 Int                     @id @default(autoincrement())
  employeeId         Int                     @map("employee_id")
  requestedByAdminId Int                     @map("requested_by_admin_id")
  requestDate        DateTime                @map("request_date") @db.Date
  startTime          String                  @map("start_time") @db.VarChar(10)
  endTime            String                  @map("end_time") @db.VarChar(10)
  requestedHours     Decimal                 @map("requested_hours") @db.Decimal(5, 2)
  reason             String                  @db.Text
  status             overtime_request_status @default(PENDING)
  reviewNote         String?                 @map("review_note") @db.Text
  reviewedByAdminId  Int?                    @map("reviewed_by_admin_id")
  reviewedAt         DateTime?               @map("reviewed_at") @db.Timestamp(0)
  payrollRecordId    Int?                    @map("payroll_record_id")
  appliedToPayrollAt DateTime?               @map("applied_to_payroll_at") @db.Timestamp(0)
  createdAt          DateTime                @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt          DateTime                @default(now()) @updatedAt @map("updated_at") @db.Timestamp(0)

  @@index([employeeId], map: "idx_overtime_employee")
  @@index([status], map: "idx_overtime_status")
  @@index([requestDate], map: "idx_overtime_date")
  @@index([employeeId, requestDate, status], map: "idx_overtime_employee_date_status")
  @@index([payrollRecordId], map: "idx_overtime_payroll_record")
  @@map("overtime_requests")
}
```

### Status Enum

```sql
enum overtime_request_status {
  PENDING
  APPROVED
  REJECTED
  APPLIED_TO_PAYROLL
}
```

## Backend API

### Controller Methods

#### Create Overtime Request

**Endpoint:** `POST /overtime-requests`

**Validation Rules:**
- Employee must exist
- For non-self requests: Attendance record must exist for the request date
- Attendance status cannot be "absent"
- No duplicate requests for same employee/date (excluding applied/rejected)
- Hours auto-calculated from start/end time if not provided
- End time must be after start time

**Self-Request Exception:** Admins can submit overtime for themselves without attendance validation.

**Request Body:**
```typescript
{
  employeeId: number;
  requestDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  requestedHours?: number; // Optional, auto-calculated
  reason: string;      // Min 10 characters
}
```

**Response:** Creates notification to all other admins, logs activity, emits WebSocket event.

#### Approve Overtime Request

**Endpoint:** `PATCH /overtime-requests/:id/approve`

**Validation:**
- Request must be in PENDING status
- Admin authentication required

**Actions:**
- Updates status to APPROVED
- Records reviewer and timestamp
- Creates notification to requester
- Logs activity
- Emits WebSocket notification

#### Reject Overtime Request

**Endpoint:** `PATCH /overtime-requests/:id/reject`

**Request Body:**
```typescript
{
  reviewNote?: string; // Optional rejection reason
}
```

**Actions:** Similar to approval but sets status to REJECTED.

#### Get Overtime Requests

**Endpoint:** `GET /overtime-requests`

**Query Parameters:**
- `status`: Filter by status
- `employeeId`: Filter by employee
- `branchCode`: Filter by branch
- `startDate`, `endDate`: Date range
- `page`, `limit`: Pagination

**Response:** Includes employee details (name, position, branch).

### Payroll Integration

#### Overtime Consumption Logic

When calculating payroll for an employee week:

1. **Fetch Approved Requests:**
   ```sql
   SELECT id, requested_hours as requestedHours, request_date as requestDate,
          start_time as startTime, end_time as endTime, reason
   FROM overtime_requests
   WHERE employee_id = $1
     AND status = 'APPROVED'
     AND request_date >= $2 AND request_date <= $3
     AND payroll_record_id IS NULL
   ```

2. **Calculate Overtime Amount:**
   - Hourly rate = daily_rate / 8
   - Overtime rate = hourly_rate × 1.25 (25% premium)
   - Total overtime amount = approved_hours × overtime_rate

3. **Update Payroll Record:**
   - Add overtime_hours and overtime_amount to payroll
   - Mark requests as applied: `payroll_record_id` and `applied_to_payroll_at`

4. **Status Update:** Requests move to `APPLIED_TO_PAYROLL` status

## Frontend Implementation

### User Roles & Access

#### Worker Positions
Defined in `constants.ts`:
```typescript
export const WORKER_POSITIONS = [
  'Worker', 'Laborer', 'Foreman', 'Skilled Worker',
  'Helper', 'Construction Worker', 'Site Worker'
] as const;
```

#### Submission Modes

1. **Worker Mode:** Direct submission via dashboard card
   - Uses user's associated `employeeId`
   - Employee field is read-only
   - Available on main dashboard

2. **Admin Mode:** Submission for others via employee management
   - Dropdown to select any non-worker employee
   - Available in employee management page

### Components

#### OvertimeRequestModal

**Features:**
- Dynamic employee selection (admin mode) vs read-only display (worker mode)
- Auto-calculation of hours from time range
- Manual override of calculated hours
- Form validation with error display
- Date restriction (cannot request future dates)

**Key Validation:**
- Employee required (admin mode)
- Valid date/time ranges
- Reason minimum length (10 characters)
- Attendance warning notice

#### Dashboard Integration

**Worker Dashboard Card:**
- Quick action card for workers to request overtime
- Opens modal in worker mode

**Attendance Page (Kebab Menu):**
- Context menu on attendance records
- "Request Overtime" option for workers

**Employee Management:**
- Admin form includes employeeId field
- Update logic supports employee association

### API Integration

#### Overtime Request API

```typescript
export const overtimeRequestApi = {
  create: (data: CreateOvertimeRequestInput) =>
    api.post<ApiResponse<OvertimeRequest>>('/overtime-requests', data),
  getAll: (params?: OvertimeRequestFilter) =>
    api.get<ApiResponse<OvertimeRequest[]>>('/overtime-requests', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<OvertimeRequest>>(`/overtime-requests/${id}`),
  approve: (id: number, data: ReviewOvertimeRequestInput) =>
    api.patch<ApiResponse<OvertimeRequest>>(`/overtime-requests/${id}/approve`, data),
  reject: (id: number, data: ReviewOvertimeRequestInput) =>
    api.patch<ApiResponse<OvertimeRequest>>(`/overtime-requests/${id}/reject`, data),
};
```

### Notification System

#### Real-time Notifications

**Request Creation:**
- Notification sent to all admins except requester
- Type: `OVERTIME_REQUEST`
- Link: `/dashboard/notifications?overtimeRequestId=${id}`

**Approval/Rejection:**
- Notification sent to original requester
- Includes approval/rejection status

**WebSocket Events:**
- Emitted for real-time UI updates
- Recipient-specific broadcasting

### Finance Reporting

#### Overtime Finance Page

**Features:**
- Comprehensive overtime request reporting
- Filtering by status, date range, employee
- Approval/rejection workflow
- Integration with payroll data

## Workflow Summary

### 1. Request Submission

**Worker Flow:**
1. Worker clicks "Request Overtime" on dashboard
2. Fills overtime request modal
3. System validates attendance exists (unless self-request)
4. Request created with PENDING status
5. Notifications sent to admins

**Admin Flow:**
1. Admin navigates to employee management
2. Selects employee and requests overtime
3. Same validation as worker flow
4. Request created and notifications sent

### 2. Review Process

**Admin Review:**
1. Admin receives notification or checks finance page
2. Reviews request details (employee, date, hours, reason)
3. Can approve or reject with optional note
4. Status updated and notifications sent

### 3. Payroll Integration

**Automatic Processing:**
1. During payroll calculation for the week
2. System fetches approved overtime requests
3. Calculates overtime pay (hours × rate × 1.25)
4. Adds to employee's payroll record
5. Marks requests as applied to payroll

### 4. Status Lifecycle

```
PENDING → APPROVED → APPLIED_TO_PAYROLL
    ↓
REJECTED
```

## Security & Validation

### Attendance Validation
- Requests require valid attendance record for the date
- Absent days cannot have overtime requests
- Self-requests by admins skip attendance check

### Duplicate Prevention
- Only one active request per employee per date
- Active = PENDING, APPROVED, or APPLIED_TO_PAYROLL

### Authorization
- Only authenticated admins can create/approve requests
- Role-based access controls maintained

### Data Integrity
- All changes logged to activity log
- Foreign key constraints on employee and admin IDs
- Transaction safety for status updates

## Testing

### Test Coverage

**E2E Tests (20 test cases):**
- Overtime request creation workflows
- Modal interactions
- Form validation
- Status transitions
- Notification handling

**Backend API Tests (16 test cases):**
- Controller method validation
- Database operations
- Error handling
- Payroll integration

**Integration Tests (6 test cases):**
- End-to-end workflow testing
- Cross-component interactions
- Notification system validation

### Test Execution

Run tests using the provided guide in `tests/run-overtime-tests.md`

## Future Enhancements

- Bulk approval/rejection
- Overtime request templates
- Advanced reporting and analytics
- Mobile app integration
- Email notifications
- Approval workflows with multiple reviewers