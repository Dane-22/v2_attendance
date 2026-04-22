# Logs Implementation Plan with Rate Limiter

## Objective

Implement comprehensive activity logging across all system actions with a robust rate limiting mechanism to handle bulk data efficiently without overwhelming the database.

**Scale:** ~114 employees across 7 branches, estimated 500-1,000 logs/day
**Infrastructure:** In-memory rate limiting (no Redis), MyISAM engine, WebSocket real-time streaming
**Access Control:** Super Admin only
**Timeline:** 8-week phased approach

## Phase 1: Rate Limiter Infrastructure

### 1.1 Install Dependencies
```bash
npm install express-rate-limit
npm install ws
npm install socket.io
```

### 1.2 Create Rate Limiter Middleware
**File:** `backend/src/middleware/rateLimiter.middleware.ts`

**Features:**
- In-memory rate limiting (no Redis required)
- Multiple tiers: per-user, per-IP, global
- Configurable limits and time windows
- Sliding window algorithm for accurate rate limiting
- Burst allowance for legitimate traffic spikes

**Configuration:**
- Per user: 100 logs/minute
- Per IP: 500 logs/minute
- Global: 10,000 logs/minute
- SCAN action: 200 logs/minute per user (high-frequency)
- DELETE action: 10 logs/minute per user (low-frequency)
- LOGIN action: 5 logs/minute per user (critical)
- Burst: 20% above limit for 5 seconds

### 1.3 Create Log Buffer System
**File:** `backend/src/services/logBuffer.service.ts`

**Features:**
- In-memory buffer for collecting logs
- Batch insertion to database (every 5 seconds or 100 logs)
- Automatic retry for failed batch writes
- Memory pressure handling (flush when memory high)
- Graceful shutdown handling

**Buffer Structure:**
```typescript
interface LogBuffer {
  logs: ActivityLogCreateInput[]
  size: number
  lastFlush: Date
}
```

### 1.4 Note on Queue System
**Decision:** In-memory buffer (Phase 1.3) is sufficient for current scale.

**Current Scale:**
- ~114 employees across 7 branches
- Estimated 500-1,000 logs/day
- Peak concurrent users: ~20-30

**Future Consideration:** Implement Bull Queue if volume exceeds 5,000 logs/day.

## Phase 2: Logging Middleware

### 2.1 Create Activity Logger Service
**File:** `backend/src/services/activityLogger.service.ts`

**Responsibilities:**
- Centralized log entry creation
- Rate limit checking before logging
- Buffer management
- Automatic context extraction (IP, user agent)
- Sensitive data filtering (salary, payroll, contact details)
- Change detection for UPDATE actions (configurable per entity type)
- Support for both admins and branch_users
- Minimal information logging for branch_users

**Key Functions:**
- `logAction()` - Main logging function
- `logCreate()` - Helper for CREATE actions
- `logUpdate()` - Helper for UPDATE actions (with change detection)
- `logDelete()` - Helper for DELETE actions
- `logAuth()` - Helper for authentication events
- `logError()` - Helper for error logging

### 2.2 Create Auto-Logging Middleware
**File:** `backend/src/middleware/autoLog.middleware.ts`

**Features:**
- Automatic request/response logging
- Configurable route patterns to log
- Request body sanitization
- Response time tracking
- Error status detection

**Usage:**
```typescript
app.use('/api/employees', autoLog('EMPLOYEE'));
app.use('/api/attendance', autoLog('ATTENDANCE'));
```

## Phase 3: Integration Points

### 3.1 Authentication Events
**Files to modify:**
- `backend/src/controllers/auth.controller.ts`

**Actions to log:**
- LOGIN (success/failed) - **triggers notification on failed attempts**
- LOGOUT
- PASSWORD_CHANGE
- PASSWORD_RESET_REQUEST
- PASSWORD_RESET_COMPLETE
- TOKEN_REFRESH

**Note:** Failed login attempts trigger in-app notifications for super admins.

**Implementation:**
```typescript
// After successful login
await activityLogger.logAuth({
  userId: user.id,
  userName: user.name,
  userRole: user.role,
  actionType: 'LOGIN',
  status: 'SUCCESS',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### 3.2 Employee Management
**Files to modify:**
- `backend/src/controllers/employee.controller.ts`

**Actions to log:**
- CREATE employee
- UPDATE employee (with change detection)
- DELETE employee
- BULK_IMPORT employees
- EXPORT employees

**Implementation:**
```typescript
// Create employee
await activityLogger.logCreate({
  userId: req.user.id,
  userName: req.user.name,
  userRole: req.user.role,
  entityType: 'EMPLOYEE',
  entityId: employee.id,
  entityName: `${employee.firstName} ${employee.lastName}`,
  description: `Created new employee: ${employee.firstName} ${employee.lastName}`,
  detailsAfter: employee,
  branchId: employee.branchId
});

// Update employee
const changes = detectChanges(oldEmployee, updates);
await activityLogger.logUpdate({
  userId: req.user.id,
  userName: req.user.name,
  userRole: req.user.role,
  entityType: 'EMPLOYEE',
  entityId: employee.id,
  entityName: `${employee.firstName} ${employee.lastName}`,
  description: `Updated employee: ${employee.firstName} ${employee.lastName}`,
  detailsBefore: oldEmployee,
  detailsAfter: updatedEmployee,
  changes: changes,
  branchId: employee.branchId
});
```

### 3.3 Attendance Management
**Files to modify:**
- `backend/src/controllers/attendance.controller.ts`

**Actions to log:**
- CHECK_IN (via QR scan)
- CHECK_OUT (via QR scan)
- MANUAL_CHECK_IN
- MANUAL_CHECK_OUT
- ATTENDANCE_CORRECTION
- BULK_ATTENDANCE_IMPORT
- ATTENDANCE_EXPORT

**Implementation:**
```typescript
// QR Scan check-in
await activityLogger.logCreate({
  userId: req.user.id,
  userName: req.user.name,
  userRole: req.user.role,
  actionType: 'SCAN',
  entityType: 'ATTENDANCE',
  entityId: attendance.id,
  entityName: `Attendance for ${employee.name}`,
  description: `QR Scan check-in: ${employee.name} at ${branch.name}`,
  detailsAfter: attendance,
  metadata: {
    scanMethod: 'QR_CODE',
    location: branch.name,
    deviceInfo: req.body.deviceInfo
  },
  branchId: branch.id
});
```

### 3.4 Payroll Management
**Files to modify:**
- `backend/src/controllers/payroll.controller.ts`

**Actions to log:**
- CREATE_PAYROLL_RECORD
- UPDATE_PAYROLL_RECORD
- APPROVE_PAYROLL
- REJECT_PAYROLL
- PROCESS_PAYROLL
- EXPORT_PAYROLL
- BULK_PAYROLL_PROCESS

### 3.5 Branch Management
**Files to modify:**
- `backend/src/controllers/branch.controller.ts`

**Actions to log:**
- CREATE_BRANCH
- UPDATE_BRANCH
- DELETE_BRANCH
- ACTIVATE_BRANCH
- DEACTIVATE_BRANCH

### 3.6 Document/Report Management
**Files to modify:**
- `backend/src/controllers/report.controller.ts`

**Actions to log:**
- GENERATE_REPORT
- EXPORT_REPORT
- DOWNLOAD_REPORT
- DELETE_REPORT

### 3.7 Settings Management
**Files to modify:**
- Create `backend/src/controllers/settings.controller.ts` (if not exists)

**Actions to log:**
- UPDATE_SYSTEM_SETTINGS
- UPDATE_BRANCH_SETTINGS
- UPDATE_NOTIFICATION_SETTINGS
- UPDATE_RATE_LIMIT_SETTINGS

### 3.8 QR Code Management
**Files to modify:**
- `backend/src/controllers/qr.controller.ts`

**Actions to log:**
- GENERATE_QR_CODE
- REGENERATE_QR_CODE
- INVALIDATE_QR_CODE
- BULK_QR_GENERATION

## Phase 4: Frontend Integration

### 4.1 Create Logging API Client
**File:** `frontend/src/lib/api/logs.ts`

**Functions:**
- `getLogs(filters)` - Fetch logs with filters
- `createLog(logData)` - Create log entry (for client-side actions)
- `deleteLog(id)` - Delete log entry
- `exportLogs(filters, format)` - Export logs

### 4.2 Update Logs Dashboard Page
**File:** `frontend/src/app/dashboard/logs/page.tsx`

**Enhancements:**
- Real-time log streaming (WebSocket)
- Advanced filtering UI
- Log detail modal with before/after comparison
- Export functionality (CSV, PDF)
- Log statistics dashboard
- Activity timeline visualization
- **Access control: Super Admin only**

### 4.3 Note on Frontend Logging
**Decision:** Backend API logging only (no client-side logging)

**Reasoning:**
- Avoids excessive log volume
- More reliable (server-side)
- Easier to implement and maintain
- Backend already captures all meaningful actions

## Phase 5: Change Detection System

### 5.1 Create Change Detection Utility
**File:** `backend/src/utils/changeDetector.ts`

**Features:**
- Deep object comparison
- Field-level change detection
- Array comparison
- Date/time comparison
- JSON field comparison
- Change summarization

**Output Format:**
```typescript
interface ChangeDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}
```

### 5.2 Integration with Update Actions
Apply change detection to all UPDATE operations:
- Employee updates (all fields)
- Attendance corrections (status, time fields)
- Payroll modifications (all numeric fields)
- Settings changes (all settings)
- Branch updates (all fields)

**Configuration:** Change detection depth is configurable per entity type.
- Employee: All fields
- Payroll: All numeric fields (salary, deductions, allowances)
- Attendance: Status and time fields only
- Settings: All settings
- Branch: All fields

## Phase 6: Rate Limiter Configuration

### 6.1 Environment Variables
Add to `.env`:
```env
# Rate Limiter Configuration (In-Memory)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS_USER=100
RATE_LIMIT_MAX_REQUESTS_IP=500
RATE_LIMIT_MAX_REQUESTS_GLOBAL=10000
RATE_LIMIT_BURST_PERCENTAGE=20
RATE_LIMIT_ACTION_SCAN=200
RATE_LIMIT_ACTION_DELETE=10
RATE_LIMIT_ACTION_LOGIN=5

# Log Buffer Configuration
LOG_BUFFER_SIZE=100
LOG_BUFFER_FLUSH_INTERVAL_MS=5000
LOG_BUFFER_MAX_MEMORY_MB=100

# Data Retention (Custom per action type)
LOG_RETENTION_LOGIN_DAYS=365
LOG_RETENTION_EMPLOYEE_DAYS=180
LOG_RETENTION_ATTENDANCE_DAYS=90
LOG_RETENTION_PAYROLL_DAYS=365
LOG_RETENTION_DEFAULT_DAYS=90

# WebSocket Configuration
WS_PORT=3001
WS_PATH=/logs-stream

# Sensitive Data Filtering
LOG_FILTER_SALARY=true
LOG_FILTER_PAYROLL=true
LOG_FILTER_CONTACT_DETAILS=true
```

### 6.2 Rate Limiter Strategy
**Tier 1: Per-User Rate Limit**
- Limit: 100 logs/minute per user
- Prevents individual users from flooding logs
- Applies to both admins and branch_users

**Tier 2: Per-IP Rate Limit**
- Limit: 500 logs/minute per IP
- Prevents IP-based attacks
- Useful for branch devices

**Tier 3: Global Rate Limit**
- Limit: 10,000 logs/minute system-wide
- Prevents system overload
- Triggers alerts when approached

**Tier 4: Action-Specific Limits**
- SCAN: 200 logs/minute per user (QR scanning)
- DELETE: 10 logs/minute per user (destructive actions)
- LOGIN: 5 logs/minute per user (critical security)
- CREATE/UPDATE: 100 logs/minute per user (default)

## Phase 7: Monitoring & Alerts

### 7.1 Create Log Monitoring Service
**File:** `backend/src/services/logMonitor.service.ts`

**Features:**
- Real-time log volume monitoring
- Rate limit breach detection
- Anomaly detection (basic pattern matching)
- Alert generation via in-app notifications
- Integration with existing notifications table

### 7.2 Dashboard Metrics
Add to logs dashboard:
- Logs per minute/hour/day
- Rate limit hit count
- Buffer flush statistics
- Queue depth (if using queue)
- Error rate by action type
- Top users by log volume

### 7.3 Alert Triggers
- Rate limit exceeded (80%, 90%, 100% thresholds)
- Buffer overflow risk
- Error rate > 5%
- **Failed authentication attempts** (multiple failed logins)
- **Suspicious activity patterns** (unusual time/location)
- **Critical errors** (database failures, service errors)

**Alert Delivery:** In-app notifications to super admins only

## Phase 8: Data Retention & Cleanup

### 8.1 Create Log Cleanup Job
**File:** `backend/src/jobs/logCleanup.job.ts`

**Schedule:** Daily at 2:00 AM

**Actions:**
- Archive logs based on action type (custom retention periods)
- LOGIN logs: 365 days
- EMPLOYEE logs: 180 days
- ATTENDANCE logs: 90 days
- PAYROLL logs: 365 days
- Default: 90 days
- Compress archived logs
- Create summary tables for long-term analytics

### 8.2 Archive Storage
- Use separate database table or file storage
- Compress using gzip
- Store by month for easy retrieval
- Maintain indexes on archived data

## Phase 9: Testing Strategy

### 9.1 Unit Tests
- Rate limiter functionality
- Buffer flush logic
- Change detection accuracy
- Log service functions
- Queue processing (if used)

### 9.2 Integration Tests
- End-to-end logging flow
- Rate limit enforcement
- Buffer performance under load
- Database insertion accuracy

### 9.3 Load Tests
- Simulate 10,000 logs/minute
- Test rate limit handling
- Test buffer overflow scenarios
- Test queue performance (if used)

### 9.4 Security Tests
- SQL injection attempts in log data
- XSS in log descriptions
- Rate limit bypass attempts
- Log tampering detection

## Phase 10: Deployment Plan

### 10.1 Deployment Steps
1. Archive existing activity_logs data
2. Install dependencies (express-rate-limit, ws, socket.io)
3. Update environment variables
4. Keep MyISAM engine (no migration needed)
5. Deploy middleware and services
6. Integrate logging into controllers (one by one)
7. Test each integration point
8. Monitor rate limits and buffer performance
9. Deploy WebSocket server
10. Deploy monitoring dashboard with in-app notifications
11. Schedule cleanup job
12. Verify super admin access control

### 10.2 Rollback Plan
- Disable rate limiter via environment variable
- Switch to synchronous logging (disable buffer)
- Revert to previous controller versions
- Restore archived data if needed

### 10.3 Gradual Rollout
- **Week 1:** Infrastructure (rate limiter, buffer, logger service)
- **Week 2:** Authentication logging (with notifications)
- **Week 3:** Employee and branch_users logging
- **Week 4:** Attendance logging (SCAN actions)
- **Week 5:** Payroll logging
- **Week 6:** Remaining modules (settings, QR, reports)
- **Week 7:** Frontend dashboard with WebSocket
- **Week 8:** Monitoring, cleanup, and optimization

## Phase 11: Performance Optimization

### 11.1 Database Optimizations
- Ensure all indexes are in place
- Consider partitioning by date
- Use connection pooling
- Optimize batch insert queries
- Consider read replicas for log queries

### 11.2 Caching Strategy
- Cache frequent filter combinations (in-memory)
- Cache user information for log display
- Cache aggregated statistics
- Use in-memory caching (no Redis required)

### 11.3 Query Optimization
- Limit fields returned in list views
- Use cursor-based pagination for large datasets
- Implement lazy loading for log details
- Optimize full-text search with proper indexes

## Phase 12: Documentation

### 12.1 API Documentation
- Update Swagger/OpenAPI docs
- Document rate limit headers
- Document log data structure
- Provide example requests/responses

### 12.2 Developer Documentation
- How to add logging to new features
- Rate limiter configuration guide
- Change detection usage
- Best practices for log descriptions

### 12.3 User Documentation
- How to use logs dashboard
- Understanding log entries
- Filtering and searching guide
- Export functionality

## Summary Checklist

### Infrastructure
- [ ] Install rate limiter dependencies (express-rate-limit, ws, socket.io)
- [ ] Create rate limiter middleware (in-memory)
- [ ] Create log buffer service
- [ ] Configure environment variables
- [ ] Set up WebSocket server
- [ ] Archive existing activity_logs data

### Services
- [ ] Create activity logger service
- [ ] Create change detection utility
- [ ] Create auto-logging middleware
- [ ] Create log monitoring service
- [ ] Create log cleanup job

### Backend Integration
- [ ] Authentication controller
- [ ] Employee controller
- [ ] Attendance controller
- [ ] Payroll controller
- [ ] Branch controller
- [ ] Report controller
- [ ] Settings controller
- [ ] QR controller

### Frontend Integration
- [ ] Create logs API client
- [ ] Update logs dashboard page (WebSocket, super admin only)
- [ ] Implement in-app notifications for alerts
- [ ] Add export functionality (CSV, PDF)

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load tests
- [ ] Security tests

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Alert configuration

### Documentation
- [ ] API documentation
- [ ] Developer documentation
- [ ] User documentation

## Estimated Timeline (Phased Approach)

- **Week 1:** Phase 1-2 (Infrastructure: rate limiter, buffer, logger service)
- **Week 2:** Phase 3 (Authentication + Employee logging)
- **Week 3:** Phase 3 (Attendance + Branch logging)
- **Week 4:** Phase 3 (Payroll + Settings logging)
- **Week 5:** Phase 5 (Change detection system)
- **Week 6:** Phase 4 (Frontend dashboard + WebSocket)
- **Week 7:** Phase 7-8 (Monitoring, notifications, cleanup)
- **Week 8:** Phase 9-12 (Testing, deployment, documentation)

**Total:** 8 weeks (recommended phased approach)

**Alternative (All at once):** 3-4 weeks with higher risk

## Next Steps

1. Review and approve this updated plan
2. Archive existing activity_logs data
3. Begin Week 1 implementation (infrastructure)
4. Test infrastructure before integration
5. Proceed with phased rollout (8-week timeline)
6. Monitor each phase before moving to next

## Key Decisions Made

**Infrastructure:**
- No Redis (in-memory rate limiting)
- Keep MyISAM engine
- In-memory buffer only (no Bull Queue)
- WebSocket for real-time streaming

**Logging Scope:**
- Both admins and branch_users
- Minimal information for branch_users
- Backend API logging only (no client-side)
- Super admin access only

**Features:**
- Configurable change detection per entity type
- Custom data retention per action type
- Sensitive data filtering (salary, payroll, contact details)
- In-app notifications for alerts
- Notifications for failed auth, critical errors, suspicious activity

**Scale:**
- Current: ~114 employees, 7 branches, ~500-1,000 logs/day
- Rate limits: 100/user, 500/IP, 10,000 global, 200 for SCAN
- Phased 8-week rollout recommended
