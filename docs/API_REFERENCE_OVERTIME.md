# Overtime Request API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
All API endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Overtime Requests

#### Create Overtime Request
```http
POST /overtime-requests
```

**Request Body:**
```json
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

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "employeeId": 123,
    "requestedByAdminId": 1,
    "requestDate": "2024-12-15T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "22:00",
    "requestedHours": 4,
    "reason": "Additional work for project deadline",
    "status": "PENDING",
    "reviewNote": null,
    "reviewedByAdminId": null,
    "reviewedAt": null,
    "payrollRecordId": null,
    "appliedToPayrollAt": null,
    "createdAt": "2024-12-15T10:30:00.000Z",
    "updatedAt": "2024-12-15T10:30:00.000Z",
    "employee": {
      "id": 123,
      "name": "John Doe",
      "position": "Engineer",
      "branchName": "Main Office",
      "branchCode": "MAIN"
    }
  }
}
```

#### Get All Overtime Requests
```http
GET /overtime-requests
```

**Query Parameters:**
- `status` (optional): Filter by status (`PENDING`, `APPROVED`, `REJECTED`, `APPLIED_TO_PAYROLL`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Example:**
```http
GET /overtime-requests?status=PENDING&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 456,
        "employeeId": 123,
        "requestDate": "2024-12-15T00:00:00.000Z",
        "startTime": "18:00",
        "endTime": "22:00",
        "requestedHours": 4,
        "reason": "Additional work for project deadline",
        "status": "PENDING",
        "createdAt": "2024-12-15T10:30:00.000Z",
        "employee": {
          "id": 123,
          "name": "John Doe",
          "position": "Engineer",
          "branchName": "Main Office"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Get Specific Overtime Request
```http
GET /overtime-requests/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "employeeId": 123,
    "requestedByAdminId": 1,
    "requestDate": "2024-12-15T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "22:00",
    "requestedHours": 4,
    "reason": "Additional work for project deadline",
    "status": "PENDING",
    "reviewNote": null,
    "reviewedByAdminId": null,
    "reviewedAt": null,
    "payrollRecordId": null,
    "appliedToPayrollAt": null,
    "createdAt": "2024-12-15T10:30:00.000Z",
    "updatedAt": "2024-12-15T10:30:00.000Z",
    "employee": {
      "id": 123,
      "name": "John Doe",
      "position": "Engineer",
      "branchName": "Main Office",
      "branchCode": "MAIN"
    }
  }
}
```

#### Approve Overtime Request
```http
PATCH /overtime-requests/:id/approve
```

**Request Body:**
```json
{
  "reviewNote": "Approved for project completion"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "status": "APPROVED",
    "reviewNote": "Approved for project completion",
    "reviewedByAdminId": 1,
    "reviewedAt": "2024-12-15T14:30:00.000Z",
    "updatedAt": "2024-12-15T14:30:00.000Z"
  }
}
```

#### Reject Overtime Request
```http
PATCH /overtime-requests/:id/reject
```

**Request Body:**
```json
{
  "reviewNote": "Insufficient justification provided"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "status": "REJECTED",
    "reviewNote": "Insufficient justification provided",
    "reviewedByAdminId": 1,
    "reviewedAt": "2024-12-15T14:30:00.000Z",
    "updatedAt": "2024-12-15T14:30:00.000Z"
  }
}
```

## Data Types

### OvertimeRequest
```typescript
interface OvertimeRequest {
  id: number;
  employeeId: number;
  employee?: {
    id: number;
    name: string;
    position: string;
    branchName: string;
    branchCode: string;
  };
  requestedByAdminId: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  requestedHours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED_TO_PAYROLL';
  reviewNote?: string;
  reviewedByAdminId?: number;
  reviewedAt?: string;
  payrollRecordId?: number;
  appliedToPayrollAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CreateOvertimeRequestInput
```typescript
interface CreateOvertimeRequestInput {
  employeeId: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  requestedHours: number;
  reason: string;
}
```

### ReviewOvertimeRequestInput
```typescript
interface ReviewOvertimeRequestInput {
  reviewNote?: string;
}
```

### OvertimeRequestFilter
```typescript
interface OvertimeRequestFilter {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED_TO_PAYROLL';
  page?: number;
  limit?: number;
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid time range: End time must be after start time"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Overtime request not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Overtime request has already been processed"
}
```

## Status Flow

```
PENDING → APPROVED → APPLIED_TO_PAYROLL
    ↓
  REJECTED
```

- **PENDING**: Initial state after submission
- **APPROVED**: Request approved by manager
- **REJECTED**: Request rejected by manager
- **APPLIED_TO_PAYROLL**: Request consumed by payroll system

## Validation Rules

### Request Validation
- `requestDate`: Must be a valid date
- `startTime`: Must be in HH:MM format (24-hour)
- `endTime`: Must be in HH:MM format and after `startTime`
- `requestedHours`: Must be positive number (max 24)
- `reason`: Required, max 1000 characters
- `employeeId`: Must exist in employees table

### Approval/Rejection Validation
- Request must be in `PENDING` status
- `reviewNote`: Required for rejection, optional for approval
- User must have admin/supervisor permissions

## Rate Limiting

- **Create requests**: 5 per minute per user
- **Approve/Reject**: 20 per minute per admin
- **Get requests**: 100 per minute per user

## Integration Points

### Notifications
- Creates notification of type `OVERTIME_REQUEST` on submission
- Updates notification status on approval/rejection

### Payroll System
- Approved requests automatically consumed during payroll calculation
- Requests marked as `APPLIED_TO_PAYROLL` to prevent double-counting

### Activity Logs
- All actions logged with user ID and timestamp
- Supports audit trail requirements

## Frontend Integration

### React Query Keys
```typescript
// Get all requests
['overtimeRequests', { status, page, limit }]

// Get specific request
['overtimeRequest', id]

// Get user requests
['userOvertimeRequests', employeeId]
```

### API Client Usage
```typescript
import { overtimeRequestApi } from '@/lib/api';

// Create request
await overtimeRequestApi.create({
  employeeId: 123,
  requestDate: '2024-12-15',
  startTime: '18:00',
  endTime: '22:00',
  requestedHours: 4,
  reason: 'Additional work'
});

// Get requests
const response = await overtimeRequestApi.getAll({
  status: 'PENDING',
  page: 1,
  limit: 20
});

// Approve request
await overtimeRequestApi.approve(456, {
  reviewNote: 'Approved'
});
```

## Testing

### Example Test Cases
```typescript
// Create request
test('should create overtime request', async () => {
  const response = await request(app)
    .post('/api/overtime-requests')
    .set('Authorization', `Bearer ${token}`)
    .send({
      employeeId: 123,
      requestDate: '2024-12-15',
      startTime: '18:00',
      endTime: '22:00',
      requestedHours: 4,
      reason: 'Test request'
    })
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.data.status).toBe('PENDING');
});

// Approve request
test('should approve overtime request', async () => {
  const response = await request(app)
    .patch('/api/overtime-requests/456/approve')
    .set('Authorization', `Bearer ${token}`)
    .send({ reviewNote: 'Approved' })
    .expect(200);

  expect(response.body.data.status).toBe('APPROVED');
});
```

## Troubleshooting

### Common Issues

#### Time Format Errors
- **Problem**: Invalid time format
- **Solution**: Use 24-hour HH:MM format (e.g., "18:00")

#### Status Conflicts
- **Problem**: Trying to approve already processed request
- **Solution**: Check current status before action

#### Permission Errors
- **Problem**: 403 Forbidden response
- **Solution**: Verify user has admin/supervisor role

#### Database Errors
- **Problem**: Employee not found
- **Solution**: Verify employeeId exists in database

### Debug Mode
Set environment variable to enable debug logging:
```bash
DEBUG=overtime:* npm run dev
```

## Changelog

### v1.0.0 (Current)
- Initial implementation
- CRUD operations
- Approval workflow
- Payroll integration
- Notifications support

### Future Versions
- Bulk operations
- Advanced filtering
- Calendar integration
- Mobile API optimization
