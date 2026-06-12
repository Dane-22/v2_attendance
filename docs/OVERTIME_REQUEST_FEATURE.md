# Overtime Request Feature Documentation

## Overview

The Overtime Request feature provides a complete workflow for employees to submit overtime requests, managers to review and approve/reject them, and for the finance team to track and report on overtime hours. This feature integrates seamlessly with the existing attendance and payroll systems.

## Features

### 🚀 Core Functionality
- **Multiple Entry Points**: Workers can submit requests via kebab menu, non-workers via dashboard
- **Approval Workflow**: Managers can approve/reject requests with review notes
- **Payroll Integration**: Approved requests automatically integrate with payroll calculations
- **Finance Reporting**: Comprehensive analytics and export capabilities
- **Real-time Notifications**: Bell dropdown integration for quick access

### 📊 Key Components
1. **Request Submission Modal**: Form for submitting overtime requests
2. **Notifications Page**: Review and manage pending requests
3. **Finance Dashboard**: Analytics and reporting
4. **Bell Dropdown**: Quick access to notifications
5. **Payroll Integration**: Automatic consumption of approved requests

## User Guide

### For Employees

#### Submitting Overtime Requests

**Method 1: Worker Entry Point (Attendance Page)**
1. Navigate to `/dashboard/attendance`
2. Find your employee record in any tab (Available, Present, Summary)
3. Click the kebab menu (three dots) next to your name
4. Select "Request Overtime"
5. The form will be pre-populated with your employee information
6. Fill in the required fields:
   - **Date**: Select the overtime date
   - **Start Time**: When overtime begins (e.g., 18:00)
   - **End Time**: When overtime ends (e.g., 22:00)
   - **Hours**: Total overtime hours (auto-calculated)
   - **Reason**: Detailed justification for overtime
7. Click "Submit Request"

**Method 2: Non-Worker Entry Point (Dashboard)**
1. Navigate to `/dashboard`
2. Find the "Request Overtime" quick action card
3. Click the card to open the request modal
4. Select your name from the employee dropdown
5. Fill in the same fields as above
6. Click "Submit Request"

#### Request Status Tracking
- **Pending**: Your request is awaiting review
- **Approved**: Your request has been approved and will be included in payroll
- **Rejected**: Your request was denied (check notifications for reason)

### For Managers/Supervisors

#### Reviewing Overtime Requests

**Via Notifications Page**
1. Navigate to `/dashboard/notifications`
2. Click the "Overtime" filter to see only overtime requests
3. Review each request showing:
   - Employee name and position
   - Request date and time range
   - Number of hours requested
   - Reason for overtime
4. For each request, you can:
   - **Approve**: Click "Approve" button, optionally add approval note
   - **Reject**: Click "Reject" button, required rejection reason
   - **View**: Click "View" to see more details

**Via Bell Dropdown**
1. Click the bell icon in the top navigation
2. Look for overtime notifications (indicated by Timer icon)
3. Click "View" to go directly to the detailed request

#### Approval Guidelines
- **Approve** when: Overtime is justified, within budget, properly documented
- **Reject** when: Insufficient justification, outside policy, not business-critical
- **Review Notes**: Always provide clear, specific reasons for decisions

### For Finance/HR

#### Overtime Analytics and Reporting

**Accessing Reports**
1. Navigate to `/dashboard/finance/overtime`
2. View comprehensive statistics:
   - Total requests count
   - Pending requests
   - Approved requests
   - Total approved hours
   - Estimated cost (based on ₱150/hour average)

**Filtering and Searching**
- **Search**: By employee name or reason keywords
- **Status Filter**: All, Pending, Approved, Rejected
- **Date Range**: This Month, Last Month, This Quarter, This Year

**Export Functionality**
1. Apply desired filters
2. Click "Export CSV" button
3. File downloads with timestamp: `overtime-report-YYYY-MM-DD.csv`
4. CSV includes: Employee, Date, Hours, Reason, Status, Reviewer, Review Date

#### Payroll Integration
- Approved requests automatically appear in payroll calculations
- Overtime hours calculated at 1.25x regular rate
- Requests marked as "Applied to Payroll" to prevent double-counting
- Full audit trail maintained for compliance

## Technical Documentation

### API Endpoints

#### Create Overtime Request
```http
POST /api/overtime-requests
Content-Type: application/json
Authorization: Bearer <token>

{
  "employeeId": 123,
  "requestedByAdminId": 1,
  "requestDate": "2024-12-15",
  "startTime": "18:00",
  "endTime": "22:00",
  "requestedHours": 4,
  "reason": "Additional work for project deadline"
}
```

#### Get All Overtime Requests
```http
GET /api/overtime-requests?status=PENDING&page=1&limit=50
Authorization: Bearer <token>
```

#### Approve Overtime Request
```http
PATCH /api/overtime-requests/:id/approve
Content-Type: application/json
Authorization: Bearer <token>

{
  "reviewNote": "Approved for project completion"
}
```

#### Reject Overtime Request
```http
PATCH /api/overtime-requests/:id/reject
Content-Type: application/json
Authorization: Bearer <token>

{
  "reviewNote": "Insufficient justification provided"
}
```

### Database Schema

#### Overtime Requests Table
```sql
CREATE TABLE overtime_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  requested_by_admin_id INTEGER NOT NULL,
  request_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  requested_hours DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  review_note TEXT,
  reviewed_by_admin_id INTEGER,
  reviewed_at TIMESTAMP,
  payroll_record_id INTEGER,
  applied_to_payroll_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Frontend Components

#### OvertimeRequestModal
- **Location**: `/src/components/OvertimeRequestModal.tsx`
- **Props**: `isOpen`, `onClose`, `onSubmit`, `initialEmployee`, `isWorkerMode`
- **Features**: Form validation, time calculation, employee selection

#### Finance Overtime Page
- **Location**: `/src/app/dashboard/finance/overtime/page.tsx`
- **Features**: Statistics dashboard, filtering, search, CSV export

#### Notification Dropdown Enhancement
- **Location**: `/src/components/NotificationDropdown.tsx`
- **Features**: Overtime notification display, "View Request" buttons

### Backend Integration

#### Payroll Consumption Logic
- **Location**: `/src/controllers/payroll.controller.ts`
- **Functions**: 
  - `getApprovedOvertimeRequests()`: Fetches approved requests
  - `markOvertimeRequestsAsApplied()`: Marks requests as processed
- **Integration**: Automatically called during payroll calculation

#### Notification System
- **OVERTIME_REQUEST** notification type
- **Timer** icon and blue theme
- **Deep links** to request details

## Configuration

### Worker Positions
Worker positions that see the kebab menu option are defined in:
```typescript
// src/lib/constants.ts
export const WORKER_POSITIONS = [
  'Engineer',
  'Developer', 
  'Technician',
  'Worker',
  'Staff'
  // Add more as needed
];
```

### Overtime Pay Rate
Currently set at 1.25x regular rate. Can be configured in payroll controller:
```typescript
const overtimeAmount = roundCurrency(approvedOvertimeHours * (hourlyRate * 1.25));
```

### Notification Settings
Overtime requests generate notifications for:
- **Admin users**: When new requests are submitted
- **Requesting employee**: When request is approved/rejected

## Security and Permissions

### Access Control
- **Submit Requests**: All authenticated users
- **Review Requests**: Admin and supervisor roles
- **Finance Reports**: Finance and HR roles
- **Payroll Integration**: System-level process

### Data Validation
- **Time Range Validation**: End time must be after start time
- **Required Fields**: All form fields are required
- **Authorization**: JWT token required for all API calls
- **Rate Limiting**: Prevents duplicate submissions

### Audit Trail
- All actions logged with user ID and timestamp
- Review notes preserved for compliance
- Status change history maintained

## Troubleshooting

### Common Issues

#### Request Not Submitting
- Check all required fields are filled
- Verify time range is valid (end > start)
- Ensure user is authenticated
- Check network connection

#### Approval Not Working
- Verify user has admin/supervisor role
- Check if request is already processed
- Ensure review note is provided for rejections
- Refresh notifications page

#### Payroll Integration Issues
- Verify request status is "APPROVED"
- Check if request is already "APPLIED_TO_PAYROLL"
- Ensure payroll calculation runs after approval
- Check payroll calculation logs

#### Finance Report Problems
- Verify date range includes requests
- Check filter settings
- Ensure user has finance role permissions
- Refresh page if data seems stale

### Error Messages

#### Frontend Errors
- "Failed to submit overtime request": Check API connection
- "Request already processed": Check current status
- "Invalid time range": Verify start/end times

#### Backend Errors
- "Employee not found": Verify employee ID exists
- "Unauthorized access": Check user permissions
- "Database error": Check database connection

## Performance Considerations

### Database Optimization
- Indexed columns: `employee_id`, `request_date`, `status`
- Pagination for large datasets
- Efficient queries with proper joins

### Frontend Optimization
- Lazy loading for large datasets
- Debounced search functionality
- Efficient state management with React Query

### Caching Strategy
- API responses cached for 5 minutes
- Static assets cached long-term
- User session data cached locally

## Future Enhancements

### Planned Features
- **Bulk Approval**: Approve multiple requests at once
- **Mobile App**: Native mobile application
- **Advanced Analytics**: More sophisticated reporting
- **Integration Calendar**: Sync with external calendars
- **Automated Reminders**: Follow-up notifications

### Scalability Considerations
- **Database Sharding**: For large employee bases
- **Load Balancing**: For high-traffic periods
- **Microservices**: Separate service for overtime processing

## Support and Maintenance

### Monitoring
- API response times
- Error rates and types
- Database performance metrics
- User activity patterns

### Backup and Recovery
- Daily database backups
- Point-in-time recovery capability
- Disaster recovery procedures

### Regular Maintenance
- Monthly performance reviews
- Quarterly security audits
- Annual feature assessments

## Training Materials

### User Training
- **Employee Guide**: How to submit requests
- **Manager Guide**: How to review requests
- **Finance Guide**: How to use reporting

### Administrator Training
- **System Configuration**: Setting up worker positions
- **User Management**: Role assignments
- **Troubleshooting**: Common issues and solutions

## Compliance and Legal

### Labor Law Compliance
- Overtime rate calculations follow local regulations
- Maximum weekly hour limits enforced
- Proper documentation maintained

### Data Privacy
- Employee data protected per privacy policy
- Access logs maintained for audit purposes
- Data retention policies enforced

## Conclusion

The Overtime Request feature provides a comprehensive, user-friendly solution for managing overtime requests within the attendance system. It integrates seamlessly with existing workflows while providing robust tracking, reporting, and compliance capabilities.

For additional support or questions, please refer to the troubleshooting section or contact the system administrator.
