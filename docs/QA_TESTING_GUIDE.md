# QA and Testing Guide

This guide provides comprehensive testing procedures for the JAJR Attendance & Payroll System to ensure quality, reliability, and security before deployment or release.

---

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Functional Testing](#functional-testing)
4. [API Testing](#api-testing)
5. [Integration Testing](#integration-testing)
6. [Security Testing](#security-testing)
7. [Performance Testing](#performance-testing)
8. [User Acceptance Testing (UAT)](#user-acceptance-testing-uat)
9. [Regression Testing](#regression-testing)
10. [Bug Reporting](#bug-reporting)
11. [Pre-Deployment Checklist](#pre-deployment-checklist)
12. [Post-Deployment Verification](#post-deployment-verification)

---

## Testing Strategy Overview

### Testing Levels

| Level | Focus | Responsibility |
|-------|-------|----------------|
| **Unit Testing** | Individual functions/components | Developer |
| **Integration Testing** | Component interactions | QA / Developer |
| **System Testing** | End-to-end workflows | QA |
| **UAT** | Business requirements | End Users |

### Key Features to Test

- **Authentication**: Login, logout, session management
- **Employee Management**: CRUD operations, QR code generation
- **Attendance Tracking**: QR scanning, time-in/time-out, real-time updates
- **Payroll System**: Salary calculations, deductions, reports
- **Dashboard**: Analytics, charts, data visualization
- **Real-time Features**: WebSocket connections, live attendance updates
- **Audit Logs**: Activity tracking, log archiving

---

## Test Environment Setup

### Option 1: Local Test Environment

```bash
# Clone repository
git clone https://github.com/Dane-22/v2_attendance.git
cd v2_attendance

# Backend setup
cd backend
cp .env.example .env
# Edit .env with test database credentials
npm install
npx prisma generate
npm run dev

# Frontend setup (new terminal)
cd frontend
cp .env.example .env.local
# Edit .env.local with test API URL
npm install
npm run dev
```

### Option 2: Staging Environment

Use the production VPS with a separate staging database:

```env
# backend/.env (staging)
DATABASE_URL="mysql://root:password@localhost:3306/attendance-system-staging"
NODE_ENV=staging
PORT=5003
```

### Test Data Preparation

Create a test dataset with:
- 5+ test branches
- 20+ test employees (various roles)
- 3+ admin accounts (different permission levels)
- 30+ days of sample attendance records
- Sample payroll data for 2+ months

```sql
-- Create test database
cREATE DATABASE attendance-system-test;

-- Import base schema
mysql -u root -p attendance-system-test < attendance_db.sql

-- Seed with test data (if seed script available)
cd backend
npx prisma db seed
```

---

## Functional Testing

### 1. Authentication & Authorization

#### Test Case: Admin Login
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form displays |
| 2 | Enter valid credentials | Redirect to dashboard |
| 3 | Check session persistence | User stays logged in on refresh |
| 4 | Click logout | Redirect to login, session cleared |

#### Test Case: Invalid Login Attempts
| Test | Input | Expected Result |
|------|-------|-----------------|
| Wrong password | Valid user, wrong pass | Error message, no redirect |
| Invalid user | Non-existent username | Error message, no redirect |
| Empty fields | Blank username/password | Validation errors |
| SQL injection | `' OR '1'='1` | Sanitized input, login fails |
| XSS attempt | `<script>alert('xss')</script>` | Sanitized, login fails |

#### Test Case: Session Management
- Token expiration after 24 hours
- Concurrent session handling
- JWT token refresh mechanism

### 2. Employee Management

#### Test Case: Add New Employee
```
Steps:
1. Navigate to Dashboard > Employees
2. Click "Add Employee"
3. Fill form with valid data:
   - Employee ID: EMP-TEST-001
   - First Name: John
   - Last Name: Doe
   - Branch: Main Office
   - Position: Software Developer
4. Upload profile photo (valid image < 5MB)
5. Click Save

Expected: Employee created, QR code generated, success message displayed
```

#### Test Case: QR Code Generation
| Scenario | Expected Result |
|----------|-----------------|
| New employee created | QR code auto-generated with format `JAJR-EMP-{ID}` |
| QR code download | PNG file downloads correctly |
| QR code scan | Contains valid employee ID data |
| Print QR code | Renders clearly at 300 DPI |

#### Test Case: Employee Edit/Delete
| Action | Test Data | Expected Result |
|--------|-----------|-----------------|
| Edit details | Change name, position | Updates reflected immediately |
| Change branch | Transfer employee | Branch updated, history preserved |
| Delete employee | Soft delete | Employee marked inactive, records retained |
| Reassign ID | Duplicate ID attempt | Validation error, operation blocked |

### 3. Attendance Tracking

#### Test Case: QR Code Scanning - Time In
```
Scenario: Employee arrives and scans QR code

Test Data:
- Employee: John Doe (EMP-001)
- Time: 8:30 AM (on time)
- Device: Mobile phone camera

Steps:
1. Open attendance scanner page
2. Allow camera permissions
3. Scan valid employee QR code
4. Verify scan success feedback
5. Check database for attendance record

Expected Results:
- Success message: "Time In recorded: 8:30 AM"
- Real-time dashboard update
- Attendance log entry created
- WebSocket broadcast to connected clients
```

#### Test Case: QR Code Scanning - Time Out
```
Scenario: Employee leaves and scans QR code

Test Data:
- Employee: John Doe (already timed in)
- Time: 5:30 PM

Expected Results:
- Success message: "Time Out recorded: 5:30 AM"
- Duration calculated (9 hours)
- Late/undertime flags if applicable
```

#### Test Case: Edge Cases - Attendance
| Scenario | Input | Expected Result |
|----------|-------|-----------------|
| Double time-in | Scan twice in morning | Error: "Already timed in" |
| Time out without time-in | Scan without prior record | Error: "No time-in found" |
| Invalid QR code | Damaged/unreadable QR | Error: "Invalid QR code" |
| Expired QR code | Old employee QR | Error: "Employee not found" |
| Weekend scan | Saturday/Sunday | Warning: "Non-working day" |
| Holiday scan | Configured holiday | Warning: "Holiday detected" |

### 4. Payroll System

#### Test Case: Salary Calculation
```
Test Data:
- Employee: Jane Smith
- Base Salary: $5,000/month
- Working Days: 22 days
- Days Present: 20
- Days Absent: 2
- Overtime: 5 hours @ 1.5x rate
- Deductions: Tax, SSS, PhilHealth

Expected Calculation:
- Daily Rate: $5,000 / 22 = $227.27
- Basic Pay: 20 days × $227.27 = $4,545.40
- Overtime: 5 hrs × ($227.27/8 × 1.5) = $212.44
- Gross Pay: $4,757.84
- Deductions: ~$800 (estimated)
- Net Pay: ~$3,957.84
```

#### Test Case: Payroll Period Processing
| Step | Action | Verification |
|------|--------|--------------|
| 1 | Generate payroll for period | All employees included |
| 2 | Review individual calculations | Math accuracy check |
| 3 | Apply deductions | Correct rates applied |
| 4 | Generate payslips | PDF format, all data correct |
| 5 | Mark as paid | Status updates, audit log created |

### 5. Dashboard & Reports

#### Test Case: Attendance Analytics
| Widget | Test Criteria |
|--------|---------------|
| Present Today | Count matches actual scans |
| Absent Today | Employees without time-in |
| Late Employees | Time-in after 9:00 AM threshold |
| On Time % | Calculation: (on-time / total) × 100 |
| Attendance Trend | 7-day/30-day chart accuracy |

#### Test Case: Export Reports
| Report Type | Format | Data Integrity |
|-------------|--------|----------------|
| Daily Attendance | CSV/Excel | All fields present |
| Monthly Summary | PDF | Formatting correct |
| Payroll Report | CSV | Calculations accurate |
| Employee List | Excel | All columns included |

---

## API Testing

### Backend API Endpoints

Use Postman, Insomnia, or curl to test all API endpoints.

#### Authentication Endpoints

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: 200 OK with JWT token
# Verify: Token structure, expiration time
```

#### Employee Endpoints

| Method | Endpoint | Test Cases |
|--------|----------|------------|
| GET | `/api/employees` | List all, pagination, filtering |
| GET | `/api/employees/:id` | Valid ID, invalid ID, deleted employee |
| POST | `/api/employees` | Create valid, validation errors, duplicates |
| PUT | `/api/employees/:id` | Update fields, partial updates |
| DELETE | `/api/employees/:id` | Soft delete, cascade effects |

#### Attendance Endpoints

```bash
# Record attendance (time-in/out)
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"employeeId":"EMP-001","type":"time-in"}'

# Get attendance records
curl http://localhost:5000/api/attendance?date=2024-01-15 \
  -H "Authorization: Bearer {token}"
```

#### Response Validation Checklist

- [ ] HTTP status codes correct (200, 201, 400, 401, 404, 500)
- [ ] JSON response structure matches schema
- [ ] Error messages are descriptive but not exposing sensitive data
- [ ] Pagination metadata present for list endpoints
- [ ] Rate limiting applied (429 status when exceeded)

### API Security Testing

#### SQL Injection Tests
```bash
# Attempt injection in various parameters
curl "http://localhost:5000/api/employees?id=1' OR '1'='1"
curl "http://localhost:5000/api/employees?id=1; DROP TABLE employees--"
curl -X POST http://localhost:5000/api/auth/login \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Expected: All should fail safely without database errors
```

#### Authentication Bypass Tests
```bash
# Missing token
curl http://localhost:5000/api/employees

# Invalid token format
curl -H "Authorization: invalid_token" http://localhost:5000/api/employees

# Expired token
curl -H "Authorization: Bearer {expired_token}" http://localhost:5000/api/employees

# Expected: 401 Unauthorized for all cases
```

---

## Integration Testing

### WebSocket Real-time Features

#### Test Case: Live Attendance Updates
```
Setup:
1. Open dashboard in Browser A (Admin view)
2. Open scanner in Browser B (Kiosk/Security)
3. Monitor WebSocket connection status

Test:
1. Scan employee QR code in Browser B
2. Verify real-time update in Browser A
3. Check "Present Today" count increments
4. Verify no page refresh required

Metrics:
- Latency: < 2 seconds from scan to dashboard update
- Connection stability: No drops during 1-hour test
```

#### Test Case: Multiple Concurrent Connections
```
Scenario: 10 admin users viewing dashboard simultaneously

Steps:
1. Open dashboard in 10 different browsers/sessions
2. Perform 50 attendance scans rapidly
3. Monitor all dashboards for consistency

Expected:
- All dashboards show identical data
- No race conditions or data corruption
- WebSocket server handles load without errors
```

### Database Integration Tests

#### Transaction Integrity
| Operation | Rollback Test |
|-----------|---------------|
| Create employee + generate QR | Both succeed or both fail |
| Record attendance + update stats | Atomic operation |
| Payroll calculation + save | No partial saves allowed |

#### Concurrency Tests
```
Test: Two admins editing same employee simultaneously

Steps:
1. Admin A opens employee edit page
2. Admin B opens same employee edit page
3. Admin A saves changes
4. Admin B saves different changes

Expected: Last write wins OR optimistic locking prevents overwrite
```

---

## Security Testing

### Authentication Security

| Test | Method | Expected Result |
|------|--------|-----------------|
| Brute force protection | 10 failed login attempts | Account lockout or rate limit |
| Password strength | Weak password: "123456" | Rejected with policy message |
| Password hashing | Check database storage | bcrypt hashed, not plaintext |
| JWT security | Decode token | No sensitive data in payload |
| Token expiration | Wait 24 hours | Token invalid, requires re-login |

### Authorization Testing

#### Role-Based Access Control (RBAC)
```
Test Users:
- Super Admin: Full access
- Branch Manager: Branch-only access
- HR Staff: Employee management only
- Viewer: Read-only access

Test Matrix:
- Each role attempts CRUD operations on all resources
- Verify 403 Forbidden for unauthorized actions
- Verify successful operations for authorized actions
```

### Data Protection

| Check | Verification |
|-------|--------------|
| HTTPS enforcement | All traffic encrypted (no HTTP) |
| Secure cookies | HttpOnly, Secure, SameSite flags |
| CORS policy | Only allowed origins accepted |
| File upload security | Image type validation, size limits |
| SQL injection prevention | Parameterized queries throughout |
| XSS prevention | Output encoding in frontend |

### Penetration Testing Checklist

- [ ] Directory traversal attacks (`../../../etc/passwd`)
- [ ] File upload vulnerabilities (upload PHP/JS files)
- [ ] CSRF token validation on state-changing operations
- [ ] Session fixation attacks
- [ ] Clickjacking protection (X-Frame-Options header)
- [ ] Information disclosure (error messages, stack traces)

---

## Performance Testing

### Load Testing Scenarios

#### Scenario 1: Morning Rush Hour
```
Simulate: 100 employees arriving within 15 minutes

Test Setup:
- 100 concurrent virtual users
- Each user scans QR code once
- Ramp-up: 15 minutes
- Duration: 30 minutes

Metrics to Monitor:
- Response time: < 3 seconds per scan
- Error rate: < 1%
- Database CPU: < 80%
- WebSocket connections: Stable
```

#### Scenario 2: Dashboard Concurrent Users
```
Simulate: 20 admin users viewing real-time dashboard

Test:
- 20 WebSocket connections open
- 1000 attendance records created
- Monitor dashboard update latency

Expected:
- Dashboard updates within 2 seconds
- No browser crashes or disconnections
- Server memory usage stable
```

### API Performance Benchmarks

| Endpoint | Target Response Time | Max Acceptable |
|----------|---------------------|----------------|
| `POST /api/auth/login` | < 500ms | 2 seconds |
| `GET /api/employees` | < 300ms | 1 second |
| `POST /api/attendance` | < 500ms | 2 seconds |
| `GET /api/dashboard/stats` | < 500ms | 1 second |
| `GET /api/reports/monthly` | < 2 seconds | 5 seconds |

### Database Performance

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM attendance WHERE date = '2024-01-15';
EXPLAIN ANALYZE SELECT COUNT(*) FROM employees WHERE branch_id = 1;
EXPLAIN ANALYZE SELECT * FROM attendance WHERE employee_id = 'EMP-001' AND date BETWEEN '2024-01-01' AND '2024-01-31';

-- All queries should use indexes, avoid full table scans
```

### Frontend Performance

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Bundle size | < 500KB | webpack-bundle-analyzer |
| API call caching | Proper use of React Query | DevTools Network |

---

## User Acceptance Testing (UAT)

### UAT Environment

- Production-like data (anonymized)
- Actual hardware devices (scanners, cameras)
- Realistic network conditions
- End users from each role

### UAT Test Scenarios

#### Scenario 1: Daily Attendance Flow
```
Participants: 5 employees, 1 security guard, 1 admin

Steps:
1. Employee arrives, shows QR code to guard
2. Guard scans QR using mobile device
3. Employee verifies time-in on screen
4. Admin monitors dashboard from office
5. Employee leaves, scans QR for time-out
6. Admin generates end-of-day report

Acceptance Criteria:
- All QR scans successful on first try
- Dashboard updates visible within 3 seconds
- Report data matches actual attendance
- No manual intervention required
```

#### Scenario 2: New Employee Onboarding
```
Participants: HR staff, new employee, IT admin

Steps:
1. HR creates employee record in system
2. HR prints generated QR code
3. IT laminates and provides ID card
4. Employee uses QR for first attendance
5. HR verifies attendance appears correctly

Acceptance Criteria:
- Employee creation takes < 5 minutes
- QR code prints clearly
- First scan works immediately
- Employee appears in all relevant reports
```

### UAT Sign-off Checklist

| Feature | Tested By | Status | Date |
|---------|-----------|--------|------|
| Login/Logout | | | |
| Employee Management | | | |
| QR Scanning | | | |
| Attendance Reports | | | |
| Payroll Processing | | | |
| Dashboard Widgets | | | |
| Mobile Responsiveness | | | |

---

## Regression Testing

### When to Run Regression Tests

- Before each release
- After bug fixes
- After dependency updates
- After database migrations

### Regression Test Suite

#### Critical Path Tests (Must Pass)
```
1. Login → Dashboard → View Employees
2. Create Employee → Generate QR → Print QR
3. Scan QR (Time In) → Verify Dashboard Update → Scan QR (Time Out)
4. Generate Payroll → Review Calculations → Export Report
5. View Audit Logs → Filter by Date → Export Logs
```

#### Cross-Browser Testing Matrix

| Browser | Version | OS | Status |
|---------|---------|-----|--------|
| Chrome | Latest | Windows 11 | |
| Firefox | Latest | Windows 11 | |
| Edge | Latest | Windows 11 | |
| Safari | Latest | macOS | |
| Chrome Mobile | Latest | Android | |
| Safari Mobile | Latest | iOS | |

#### Device Testing for QR Scanner

| Device | Camera Quality | Scan Performance |
|--------|---------------|-------------------|
| iPhone 13+ | High | < 2 seconds |
| Samsung Galaxy S21+ | High | < 2 seconds |
| Mid-range Android | Medium | < 3 seconds |
| Budget Android | Low | < 5 seconds |
| Tablet (iPad) | High | < 2 seconds |

---

## Bug Reporting

### Bug Report Template

```markdown
## Bug ID: BUG-001
**Severity:** High/Medium/Low
**Priority:** Critical/Major/Minor
**Environment:** Staging/Production/Local
**Browser/Device:** Chrome 120 / Windows 11

### Summary
Brief description of the issue

### Steps to Reproduce
1. Navigate to...
2. Click on...
3. Enter...
4. Observe...

### Expected Result
What should happen

### Actual Result
What actually happens

### Screenshots/Video
[Attach media]

### Console Errors
```
Paste any JavaScript errors here
```

### Network Logs
```
Paste relevant API responses
```

### Database State (if applicable)
```sql
-- Relevant query results
```
```

### Severity Guidelines

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | System unusable, data loss, security breach | Database corruption, unauthorized access |
| **High** | Major feature broken, no workaround | Cannot record attendance, payroll miscalculation |
| **Medium** | Feature impaired, has workaround | Slow report generation, UI glitch |
| **Low** | Minor issue, cosmetic | Typos, alignment issues |

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All unit tests passing
- [ ] No ESLint/TypeScript errors
- [ ] Code review completed
- [ ] No `console.log` statements in production code
- [ ] Environment variables configured correctly

### Database
- [ ] Migration scripts tested
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Indexes optimized for queries

### Security
- [ ] JWT secrets rotated
- [ ] CORS origins restricted to production domain
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet.js)

### Testing Complete
- [ ] All functional tests passed
- [ ] API tests passed
- [ ] Security tests passed
- [ ] Performance benchmarks met
- [ ] UAT sign-off received

### Documentation
- [ ] Release notes prepared
- [ ] User guide updated (if features changed)
- [ ] API documentation updated
- [ ] Deployment guide reviewed

---

## Post-Deployment Verification

### Immediate Checks (Within 1 Hour)

```bash
# 1. Health check
curl https://attendacev2.com/api/health
# Expected: {"status":"ok"}

# 2. Login test
curl -X POST https://attendacev2.com/api/auth/login \
  -d '{"username":"admin","password":"actual_password"}'
# Expected: 200 OK with valid token

# 3. Database connectivity
# Run a few queries via Prisma Studio
```

### Functional Verification

| Test | Method | Expected |
|------|--------|----------|
| Website loads | Browser visit | No 500 errors |
| Login works | Manual test | Successful authentication |
| QR scan works | Physical test | Attendance recorded |
| Dashboard updates | Manual test | Real-time data visible |
| Reports generate | Manual test | PDF/CSV downloads |

### 24-Hour Monitoring

- Application error logs (PM2 logs)
- Server resource usage (CPU, memory, disk)
- Database performance metrics
- WebSocket connection stability
- SSL certificate validity

### Rollback Procedure (If Needed)

```bash
# 1. Stop new version
pm2 stop v2-attendance-api
pm2 stop v2-attendance-web

# 2. Restore database (if migration occurred)
mysql -u root -p attendance-system < backup_pre_deploy.sql

# 3. Start previous version
cd /var/www/version2_attendance
git checkout previous-stable-tag
# Rebuild and restart services

# 4. Verify rollback
# Run post-deployment verification tests again
```

---

## Testing Tools Reference

### Recommended Tools

| Purpose | Tool | Usage |
|---------|------|-------|
| API Testing | Postman / Insomnia | Manual API testing |
| API Automation | Newman (Postman CLI) | CI/CD integration |
| Load Testing | k6 / Artillery | Performance testing |
| E2E Testing | Playwright / Cypress | Automated UI testing |
| Security Scan | OWASP ZAP | Vulnerability scanning |
| SQL Testing | MySQL Workbench | Query optimization |
| Mobile Testing | BrowserStack | Device compatibility |
| Monitoring | PM2 / Nginx logs | Production monitoring |

### Quick Test Commands

```bash
# Backend health check
curl http://localhost:5000/health

# Database connection test
cd backend && npx prisma db pull

# Frontend build test
cd frontend && npm run build

# Lint check
cd frontend && npm run lint
cd backend && npx tsc --noEmit

# Full test suite (when implemented)
npm test
```

---

## Appendix: Sample Test Cases Document

### Template for Manual Test Cases

```
Test Case ID: TC-001
Title: Employee QR Code Scanning - Time In
Priority: High
Preconditions: 
  - Employee exists in system
  - QR code printed and valid
  - Scanner camera functional

Test Steps:
1. Navigate to attendance scanner page
2. Grant camera permissions if prompted
3. Hold QR code 10-15cm from camera
4. Wait for beep/visual confirmation
5. Verify time displayed on screen

Expected Results:
- Scan completes within 2 seconds
- Success sound plays
- Time In displayed: HH:MM format
- Database record created with timestamp
- Dashboard updates for admin users

Test Data:
- Employee: EMP-TEST-001 (John Doe)
- Expected time: Morning (before 9 AM = on time, after = late)

Postconditions:
- Attendance record exists for today
- Employee marked as "Present"
```

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Maintained By:** QA Team / Development Team
