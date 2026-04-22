# Dashboard/Logs System Documentation

## Overview

The Dashboard/Logs system is a comprehensive activity tracking solution that captures and displays all user actions, system events, and operational activities within the attendance management system. This system provides administrators with full visibility into system usage, security events, and audit trails.

## Current Architecture

### Database Schema (Prisma)

The system uses the `ActivityLog` model with the following structure:

```prisma
model ActivityLog {
  id            String    @id @db.VarChar(50)
  timestamp     DateTime  @default(now()) @db.Timestamp(0)
  userId        Int       @map("user_id")
  userName      String    @map("user_name") @db.VarChar(100)
  userRole      String    @map("user_role") @db.VarChar(50)
  actionType    String    @map("action_type") @db.VarChar(20)
  entityType    String    @map("entity_type") @db.VarChar(20)
  entityId      String?   @map("entity_id") @db.VarChar(50)
  entityName    String?   @map("entity_name") @db.VarChar(200)
  description   String    @db.Text
  detailsBefore Json?     @map("details_before")
  detailsAfter  Json?     @map("details_after")
  changes       Json?
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  userAgent     String?   @map("user_agent") @db.Text
  status        String    @default("SUCCESS") @db.VarChar(20)
  metadata      Json?
  branchId      Int?      @map("branch_id")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamp(0)
}
```

### Backend API Structure

**Routes:** `/api/logs`
- `GET /` - Retrieve logs with filtering and pagination
- `POST /` - Create a new log entry
- `DELETE /:id` - Delete a specific log entry

**Controller Functions:**
- `getLogs()` - Fetches logs with advanced filtering options
- `createLog()` - Creates new log entries
- `deleteLog()` - Removes specific log entries

### Filtering Capabilities

The system supports comprehensive filtering:

- **Date Range:** today, yesterday, last7days, last30days, custom
- **Action Types:** CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, SCAN, APPROVE, REJECT, VIEW
- **Entity Types:** EMPLOYEE, ATTENDANCE, PAYROLL, SETTINGS, USER, BRANCH, DOCUMENT
- **User Filter:** Filter by specific user ID
- **Status Filter:** SUCCESS, FAILED, PENDING
- **Search Query:** Full-text search across userName, actionType, entityType, entityName, description, status

### Frontend Structure

Located at: `frontend/src/app/dashboard/logs/`

**Components:**
- `page.tsx` - Main logs dashboard page
- `data.ts` - Mock data for development
- `types.ts` - TypeScript type definitions
- `components/` - Reusable UI components

## Log Entry Structure

Each log entry contains:

### Core Fields
- **id:** Unique identifier (format: `log-{timestamp}-{random}`)
- **timestamp:** When the action occurred
- **userId:** ID of the user who performed the action
- **userName:** Name of the user
- **userRole:** Role of the user (admin, branch_user, etc.)

### Action Details
- **actionType:** Type of action performed (CREATE, UPDATE, DELETE, etc.)
- **entityType:** Type of entity affected (EMPLOYEE, ATTENDANCE, etc.)
- **entityId:** ID of the affected entity (optional)
- **entityName:** Human-readable name of the entity (optional)
- **description:** Human-readable description of the action

### Change Tracking
- **detailsBefore:** JSON snapshot of entity state before change (optional)
- **detailsAfter:** JSON snapshot of entity state after change (optional)
- **changes:** JSON diff showing specific changes (optional)

### Context Information
- **ipAddress:** IP address of the user (optional)
- **userAgent:** Browser/device information (optional)
- **status:** Status of the action (SUCCESS, FAILED, PENDING)
- **metadata:** Additional contextual information (optional)
- **branchId:** Branch ID for multi-branch contexts (optional)

## Use Cases

### 1. Security Auditing
- Track login/logout attempts
- Monitor failed authentication attempts
- Detect suspicious activity patterns

### 2. Compliance & Accountability
- Maintain audit trail of all data modifications
- Track who changed what and when
- Support regulatory compliance requirements

### 3. Operational Monitoring
- Monitor system usage patterns
- Identify frequently used features
- Track performance metrics

### 4. Troubleshooting
- Debug issues by tracing action sequences
- Identify error patterns and root causes
- Support incident investigation

### 5. Analytics
- Generate usage reports
- Analyze user behavior
- Track feature adoption

## Indexes for Performance

The database includes optimized indexes:
- `idx_logs_timestamp` - For time-based queries
- `idx_logs_user_id` - For user-specific queries
- `idx_logs_action_type` - For action type filtering
- `idx_logs_entity_type` - For entity type filtering
- `idx_logs_status` - For status filtering
- `idx_logs_entity_id` - For entity-specific queries
- `idx_logs_branch_id` - For branch-specific queries
- `idx_logs_timestamp_action` - Composite index for timestamp + action queries

## Data Retention Considerations

Given the high volume of logs expected, consider implementing:
- Automatic log archival (e.g., move logs older than 90 days to cold storage)
- Log rotation policies
- Data purging strategies based on compliance requirements
- Summary/aggregation tables for long-term analytics

## Rate Limiting Strategy

Due to the bulk nature of log data, rate limiting is essential:

### Implementation Approaches
1. **In-Memory Buffering:** Collect logs in memory and batch write to database
2. **Queue-Based Processing:** Use message queue (Redis, Bull) for async processing
3. **Throttling:** Limit log creation rate per user/IP
4. **Sampling:** For high-frequency events, sample logs instead of capturing all

### Recommended Rate Limits
- Per user: 100 logs/minute
- Per IP: 500 logs/minute
- Global: 10,000 logs/minute

## Security Considerations

- Log entries should not contain sensitive data (passwords, tokens)
- Implement access control - only admins should view logs
- Encrypt logs containing sensitive information
- Regular security audits of log access patterns
- Implement log tamper detection (digital signatures)

## Future Enhancements

1. **Real-time Monitoring:** WebSocket-based live log streaming
2. **Alert System:** Automated alerts for suspicious patterns
3. **Export Functionality:** CSV/PDF export of filtered logs
4. **Advanced Analytics:** Dashboards with charts and visualizations
5. **Log Correlation:** Link related log entries together
6. **Machine Learning:** Anomaly detection for security threats
