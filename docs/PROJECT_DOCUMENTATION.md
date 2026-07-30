# JAJR Attendance & Payroll System - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Key Features](#key-features)
9. [Real-time Features](#real-time-features)
10. [Logging & Auditing](#logging--auditing)
11. [Security Measures](#security-measures)
12. [Development Workflow](#development-workflow)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

The JAJR Attendance & Payroll System is a comprehensive workforce management solution designed to streamline employee attendance tracking, payroll processing, and administrative operations across multiple branches. The system supports QR code-based check-in/check-out, real-time monitoring, and automated payroll calculations.

**Project Name**: v2-attendance  
**Version**: 2.0  
**Repository**: https://github.com/Dane-22/v2_attendance  
**Production URL**: https://attendacev2.xandree.com

---

## Architecture

### System Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │         │    Database     │
│   (Next.js)     │◄────────│   (Express)     │◄────────│    (MySQL)      │
│   Port: 3001    │  HTTPS  │   Port: 5002    │  Prisma  │   Port: 3306    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                           │
         │                           │
         │                           │
┌─────────────────┐         ┌─────────────────┐
│   Mobile App   │         │   WebSocket    │
│   (React Native)│        │   (Socket.IO)   │
│   (Expo)       │◄────────│   Port: 5002    │
└─────────────────┘  WS    └─────────────────┘
```

### Component Responsibilities

**Frontend (Next.js)**
- User interface for admin dashboard
- Employee management
- Attendance monitoring
- Payroll processing
- Report generation
- Document management

**Backend (Express)**
- RESTful API endpoints
- Business logic implementation
- Authentication & authorization
- QR code generation/validation
- Payroll calculations
- Activity logging
- WebSocket server for real-time updates

**Mobile App (React Native)**
- QR code scanning
- Employee self-service features
- Attendance history viewing
- Profile management

**Database (MySQL)**
- Data persistence
- Relational data management
- Transaction support

---

## Technology Stack

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **ORM**: Prisma 5.10.0
- **Database**: MySQL 5.7+
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs
- **Real-time**: Socket.IO 4.8.3
- **File Upload**: Multer 1.4.5
- **Image Processing**: Sharp 0.34.5
- **QR Code**: qrcode 1.5.3, jsqr 1.4.0
- **PDF Generation**: pdf-lib 1.17.1
- **Rate Limiting**: express-rate-limit 8.3.2
- **Validation**: express-validator 7.0.1

### Frontend
- **Framework**: Next.js 16.2.4
- **UI Library**: React 19.2.4
- **Styling**: TailwindCSS 4
- **State Management**: Zustand 5.0.12
- **Data Fetching**: TanStack React Query 5.99.2
- **HTTP Client**: Axios 1.15.1
- **Animations**: GSAP 3.15.0
- **QR Scanning**: jsqr 1.4.0
- **Real-time**: Socket.IO Client 4.8.3

### Mobile App
- **Framework**: React Native 0.81.5
- **Runtime**: Expo ~54.0.33
- **Navigation**: React Navigation 7.x
- **State Management**: Redux Toolkit 2.11.2
- **UI Components**: React Native Paper 5.15.1
- **Camera**: expo-camera ~17.0.10
- **QR Scanner**: expo-barcode-scanner 13.0.1
- **Local Storage**: AsyncStorage, Secure Store
- **Biometrics**: expo-local-authentication ~17.0.8

---

## System Components

### Backend Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── admin.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── branch.controller.ts
│   │   ├── branch-user.controller.ts
│   │   ├── document.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── logs.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── payroll.controller.ts
│   │   ├── qr.controller.ts
│   │   └── report.controller.ts
│   ├── routes/              # API route definitions
│   │   ├── admin.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── branch.routes.ts
│   │   ├── branch-user.routes.ts
│   │   ├── document.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── logs.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── payroll.routes.ts
│   │   ├── qr.routes.ts
│   │   ├── report.routes.ts
│   │   └── websocket.routes.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── role.middleware.ts
│   ├── services/            # Business logic services
│   │   ├── activityLogger.service.ts
│   │   ├── fileCompression.service.ts
│   │   ├── logBuffer.service.ts
│   │   ├── logMonitoring.service.ts
│   │   └── qr.service.ts
│   ├── jobs/               # Scheduled tasks
│   │   └── logCleanup.job.ts
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── server.ts           # Application entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Database seeding
├── public/
│   └── uploads/           # Uploaded files
├── .env.example           # Environment variables template
└── package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (landing)/    # Landing page group
│   │   ├── branch/       # Branch-specific pages
│   │   │   ├── layout.tsx
│   │   │   └── qr-scanner/
│   │   ├── dashboard/    # Admin dashboard
│   │   │   ├── attendance/
│   │   │   ├── attendance-audit/
│   │   │   ├── documents/
│   │   │   ├── employees/
│   │   │   ├── finance/
│   │   │   ├── logs/
│   │   │   ├── notifications/
│   │   │   ├── payroll/
│   │   │   ├── procurement/
│   │   │   ├── qr-scanner/
│   │   │   ├── scanner/
│   │   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── login/        # Login page
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable components
│   │   ├── NotificationDropdown.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── Toast.tsx
│   │   └── layout/
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   └── api.ts        # API client configuration
│   ├── providers/        # React context providers
│   ├── store/            # State management
│   └── types/            # TypeScript types
├── public/               # Static assets
├── .env.local           # Environment variables (local)
└── package.json
```

### Mobile App Structure

```
attendance-mobile/
├── src/
│   ├── screens/          # Screen components
│   │   ├── AttendanceHistory.tsx
│   │   ├── EmployeeAttendance.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Profile.tsx
│   │   ├── QRScanner.tsx
│   │   └── Settings.tsx
│   ├── navigation/       # Navigation configuration
│   │   └── AdminTabs.tsx
│   ├── api/             # API integration
│   ├── components/      # Reusable components
│   ├── constants/       # App constants
│   ├── hooks/           # Custom hooks
│   ├── store/           # Redux store
│   │   ├── index.ts
│   │   ├── themeSlice.ts
│   │   └── userSlice.ts
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── App.tsx          # App entry point
├── assets/              # Static assets
├── app.json            # Expo configuration
└── package.json
```

---

## Database Schema

### Core Models

#### Employee
```typescript
{
  id: Int (auto-increment, primary key)
  employeeCode: String (unique) - Employee identification code
  firstName: String
  middleName: String
  lastName: String
  email: String (unique)
  department: String
  position: String
  branchName: String
  status: String (default: "Active")
  dailyRate: Decimal (default: 0.00)
  hasDeductions: Boolean (default: false)
  profileImage: String
  defaultBranchId: Int
  performanceAllowance: Decimal (default: 0.00)
  hasDeduction: Boolean (default: true)
  branchId: Int
  branchCode: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Attendance
```typescript
{
  id: Int (auto-increment, primary key)
  employeeId: Int
  branch_code: String
  date: Date
  check_in: Time
  check_out: Time
  status: attendance_status (default: present)
  notes: Text
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### PayrollRecord
```typescript
{
  id: Int (auto-increment, primary key)
  employeeId: Int
  branch_code: String
  payroll_week_start: Date
  payroll_week_end: Date
  week_number: Int
  days_worked: Int (default: 0)
  daily_rate: Decimal (default: 0.00)
  basic_pay: Decimal (default: 0.00)
  overtimeHours: Decimal (default: 0.00)
  overtime_amount: Decimal (default: 0.00)
  performance_allowance: Decimal (default: 0.00)
  grossPay: Decimal (default: 0.00)
  sss_contribution: Decimal (default: 0.00)
  phic_contribution: Decimal (default: 0.00)
  hdmf_contribution: Decimal (default: 0.00)
  cash_advance: Decimal (default: 0.00)
  total_deductions: Decimal (default: 0.00)
  netPay: Decimal (default: 0.00)
  status: payroll_records_status (default: draft)
  createdAt: DateTime
}
```

#### Admin
```typescript
{
  id: Int (auto-increment, primary key)
  username: String (unique)
  password: String (bcrypt hashed)
  name: String
  email: String (unique)
  role: admins_role (default: admin)
  created_at: DateTime
  updated_at: DateTime
  branch_code: String
  permissions: Json (default: "[]")
  permissions_enabled: Boolean (default: false)
}
```

#### Branch
```typescript
{
  id: Int (auto-increment, primary key)
  branch_code: String (unique)
  branch_name: String
  address: Text
  contact_number: String
  status: String (default: "Active")
  created_at: DateTime
  updated_at: DateTime
}
```

#### BranchUser
```typescript
{
  id: Int (auto-increment, primary key)
  branch_code: String
  username: String
  password: String
  status: String (default: "Active")
  created_at: DateTime
}
```

#### Document
```typescript
{
  id: Int (auto-increment, primary key)
  employeeId: Int
  documentType: document_type
  fileName: String
  originalFileName: String
  filePath: String
  fileSize: Int
  mimeType: String
  fileHash: String
  isCompressed: Boolean (default: false)
  uploadedBy: Int
  uploadedAt: DateTime
  isArchived: Boolean (default: false)
  archivedAt: DateTime
  archivedBy: Int
}
```

#### ActivityLog
```typescript
{
  id: String (primary key)
  timestamp: DateTime
  userId: Int
  userName: String
  userRole: String
  actionType: activity_logs_action_type
  entityType: activity_logs_entity_type
  entityId: String
  entityName: String
  description: Text
  detailsBefore: Json
  detailsAfter: Json
  changes: Json
  ipAddress: String
  userAgent: String
  status: activity_logs_status (default: SUCCESS)
  metadata: Json
  branchId: Int
  createdAt: DateTime
}
```

#### Notification
```typescript
{
  id: Int (auto-increment, primary key)
  recipient_type: notifications_recipient_type (default: admin)
  recipient_id: Int
  type: String
  title: String
  message: Text
  link: String
  is_read: Boolean (default: false)
  created_at: DateTime
  read_at: DateTime
}
```

### Enums

#### attendance_status
- present
- absent
- late
- half_day
- leave

#### payroll_records_status
- draft
- processed

#### admins_role
- super_admin
- admin

#### document_type
- RESUME
- SSS
- TIN
- PHILHEALTH
- BIRTH_CERTIFICATE
- PDS
- COVER_LETTER
- APPLICATION_LETTER
- CLEARANCE

#### activity_logs_action_type
- CREATE
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- EXPORT
- SCAN
- APPROVE
- REJECT
- VIEW

#### activity_logs_entity_type
- EMPLOYEE
- ATTENDANCE
- PAYROLL
- SETTINGS
- USER
- BRANCH
- DOCUMENT

#### activity_logs_status
- SUCCESS
- FAILED
- PENDING

#### notifications_recipient_type
- admin
- employee

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Admin login | No |
| POST | `/api/auth/logout` | Admin logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Employees

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees` | List all employees | Yes |
| GET | `/api/employees/:id` | Get employee by ID | Yes |
| POST | `/api/employees` | Create new employee | Yes |
| PUT | `/api/employees/:id` | Update employee | Yes |
| DELETE | `/api/employees/:id` | Delete employee | Yes |
| POST | `/api/employees/:id/photo` | Upload employee photo | Yes |

### Attendance

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/attendance` | Get attendance records | Yes |
| POST | `/api/attendance` | Record attendance | Yes |
| GET | `/api/attendance/:id` | Get attendance by ID | Yes |
| PUT | `/api/attendance/:id` | Update attendance | Yes |
| DELETE | `/api/attendance/:id` | Delete attendance | Yes |
| POST | `/api/attendance/manual-clock-in` | Manual clock-in | Yes |
| POST | `/api/attendance/manual-clock-out` | Manual clock-out | Yes |
| POST | `/api/attendance/mark-absent/:employeeId` | Mark as absent | Yes |
| GET | `/api/attendance/today` | Get today's attendance | Yes |

### Payroll

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payroll` | Get payroll records | Yes |
| POST | `/api/payroll/generate` | Generate payroll | Yes |
| GET | `/api/payroll/:id` | Get payroll by ID | Yes |
| PUT | `/api/payroll/:id` | Update payroll | Yes |
| DELETE | `/api/payroll/:id` | Delete payroll | Yes |
| GET | `/api/payroll/employee/:employeeId` | Get employee payroll | Yes |

### Branches

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/branches` | List all branches | Yes |
| GET | `/api/branches/:code` | Get branch by code | Yes |
| POST | `/api/branches` | Create branch | Yes |
| PUT | `/api/branches/:code` | Update branch | Yes |
| DELETE | `/api/branches/:code` | Delete branch | Yes |
| GET | `/api/branches/:branchCode/employees` | Get branch employees | Yes |

### Branch Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/branch-users` | List branch users | Yes |
| POST | `/api/branch-users` | Create branch user | Yes |
| PUT | `/api/branch-users/:id` | Update branch user | Yes |
| DELETE | `/api/branch-users/:id` | Delete branch user | Yes |

### QR Codes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/qr/generate` | Generate QR code | Yes |
| POST | `/api/qr/scan` | Scan QR code | Yes |
| GET | `/api/qr/employee/:id` | Get employee QR | Yes |

### Documents

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/documents` | List documents | Yes |
| POST | `/api/documents` | Upload document | Yes |
| GET | `/api/documents/:id` | Get document by ID | Yes |
| PUT | `/api/documents/:id` | Update document | Yes |
| DELETE | `/api/documents/:id` | Delete document | Yes |
| GET | `/api/documents/employee/:employeeId` | Get employee documents | Yes |
| POST | `/api/documents/:id/archive` | Archive document | Yes |

### Reports

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports/daily-attendance` | Daily attendance report | Yes |
| GET | `/api/reports/monthly-summary` | Monthly summary report | Yes |
| GET | `/api/reports/payroll` | Payroll report | Yes |
| GET | `/api/reports/export` | Export report | Yes |

### Logs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/logs` | Get activity logs | Yes |
| GET | `/api/logs/:id` | Get log by ID | Yes |
| POST | `/api/logs/archive` | Archive logs | Yes |
| GET | `/api/logs/stream` | Stream logs (WebSocket) | Yes |

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get notifications | Yes |
| GET | `/api/notifications/:id` | Get notification by ID | Yes |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes |
| POST | `/api/notifications` | Create notification | Yes |

### Admins

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admins` | List admins | Yes |
| POST | `/api/admins` | Create admin | Yes |
| PUT | `/api/admins/:id` | Update admin | Yes |
| DELETE | `/api/admins/:id` | Delete admin | Yes |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | System health check | No |

---

## Authentication & Authorization

### Authentication Flow

1. **Login Request**
   - User submits username and password to `/api/auth/login`
   - Backend validates credentials using bcrypt
   - JWT token generated with 24-hour expiration
   - Token and user data returned to client

2. **Token Storage**
   - Frontend stores JWT in localStorage
   - Token included in Authorization header: `Bearer {token}`

3. **Token Validation**
   - `auth.middleware.ts` validates JWT on protected routes
   - Token verified using JWT_SECRET
   - User fetched from database and attached to request

4. **Token Refresh**
   - Client must re-login after token expiration
   - No automatic refresh mechanism implemented

### Authorization

#### Role-Based Access Control (RBAC)

**Roles:**
- `super_admin`: Full system access
- `admin`: Branch-specific or limited access

**Middleware:**
- `authenticate`: Requires valid JWT token
- `optionalAuth`: Optional JWT token
- Role-based checks in controllers

#### Branch User Authentication

Branch users (kiosk devices) authenticate with:
- Username format: `branch-[a-h]` (e.g., `branch-a`)
- Password: Branch-specific credentials
- Redirected to QR scanner after login

---

## Key Features

### 1. QR Code-Based Attendance

**QR Code Format:**
```
JAJR-EMP:{id}|{employee_code}|{employee_name}
```

**Features:**
- Automatic QR generation on employee creation
- QR code scanning via camera
- Cross-branch attendance tracking
- Time-in/time-out validation
- Duplicate scan prevention

**Implementation:**
- QR generation: `qrcode` npm package
- QR scanning: `jsqr` library
- Validation: Regex pattern matching

### 2. Real-Time Dashboard

**Features:**
- Live attendance updates via WebSocket
- Real-time statistics (present, absent, late)
- Branch-specific monitoring
- Employee status tracking

**WebSocket Events:**
- `join-branch`: Subscribe to branch updates
- `leave-branch`: Unsubscribe from branch
- `attendance:update`: Attendance change notification

### 3. Payroll Processing

**Calculation Components:**
- Basic pay: daily_rate × days_worked
- Overtime: overtime_hours × (daily_rate/8 × 1.5)
- Performance allowance: Fixed amount
- Deductions: SSS, PhilHealth, HDMF, cash advance
- Net pay: gross_pay - total_deductions

**Payroll Periods:**
- Weekly payroll cycles
- Configurable week start/end dates
- Draft → processed workflow

### 4. Document Management

**Features:**
- Employee document uploads
- Document type categorization
- File compression for storage
- Archive functionality
- Secure file access

**Document Types:**
- Resume, SSS, TIN, PhilHealth
- Birth Certificate, PDS
- Cover Letter, Application Letter, Clearance

### 5. Activity Logging

**Logged Actions:**
- CREATE, UPDATE, DELETE operations
- LOGIN, LOGOUT events
- EXPORT operations
- SCAN events (QR code scans)
- APPROVE, REJECT actions
- VIEW operations

**Log Data:**
- User information (ID, name, role)
- Action type and entity type
- Before/after state (JSON)
- IP address and user agent
- Timestamp and status

**Retention Policies:**
- Login logs: 365 days
- Employee logs: 180 days
- Attendance logs: 90 days
- Payroll logs: 365 days
- Default: 90 days

### 6. Notifications System

**Features:**
- Real-time notification delivery
- Admin and employee recipients
- Read/unread status tracking
- Notification history

**Notification Types:**
- System alerts
- Attendance reminders
- Payroll notifications
- Document updates

---

## Real-time Features

### WebSocket Implementation

**Server Setup:**
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});
```

**Authentication:**
- JWT token verification on connection
- User data attached to socket
- Role-based room joining

**Rooms:**
- `user-{userId}`: User-specific notifications
- `role-{role}`: Role-based broadcasts
- `branch-{branchCode}`: Branch-specific updates

**Events:**
- Connection/Disconnection handling
- Branch room management
- Attendance update broadcasts

### Real-time Use Cases

1. **Attendance Updates**
   - QR scan → WebSocket broadcast → Dashboard refresh
   - No manual refresh required
   - Flash animation on status change

2. **Notifications**
   - New notification → Push to user room
   - Instant notification badge update
   - Real-time notification list

3. **Multi-User Collaboration**
   - Multiple admins viewing same dashboard
   - Consistent data across sessions
   - No race conditions

---

## Logging & Auditing

### Activity Logger Service

**Service:** `activityLogger.service.ts`

**Features:**
- Structured log entries
- Automatic before/after state capture
- Change detection
- Buffered logging for performance
- Automatic log archiving

**Log Entry Structure:**
```typescript
{
  id: string (UUID)
  timestamp: DateTime
  userId: number
  userName: string
  userRole: string
  actionType: string
  entityType: string
  entityId: string
  entityName: string
  description: string
  detailsBefore: Json
  detailsAfter: Json
  changes: Json
  ipAddress: string
  userAgent: string
  status: string
  metadata: Json
  branchId: number
  createdAt: DateTime
}
```

### Log Buffer Service

**Purpose:** Batch log writes for performance optimization

**Configuration:**
- Buffer size: 100 logs
- Flush interval: 5 seconds
- Max memory: 100MB

**Behavior:**
- Logs buffered in memory
- Automatic flush on interval or buffer full
- Graceful shutdown flush

### Log Monitoring Service

**Purpose:** Monitor log buffer health and detect issues

**Schedule:** Every 5 minutes

**Checks:**
- Buffer size monitoring
- Memory usage tracking
- Failed log detection
- Automatic recovery

### Log Cleanup Job

**Purpose:** Archive old logs based on retention policy

**Schedule:** Daily at midnight

**Process:**
- Query logs older than retention period
- Export to JSON archive
- Delete from database
- Compress archive files

### Sensitive Data Filtering

**Configurable Filters:**
- Salary information
- Payroll data
- Contact details
- Password fields

**Implementation:**
- Regex-based pattern matching
- Configurable in environment variables
- Applied before log storage

---

## Security Measures

### Authentication Security

1. **Password Hashing**
   - bcrypt with salt rounds
   - Never store plaintext passwords

2. **JWT Tokens**
   - 24-hour expiration
   - Strong secret key
   - Token validation on every request

3. **Session Management**
   - Token storage in localStorage
   - Automatic logout on 401 errors
   - Manual logout functionality

### API Security

1. **Rate Limiting**
   - Per-user limits: 100 requests/minute
   - Per-IP limits: 500 requests/minute
   - Global limits: 10,000 requests/minute
   - Action-specific limits (login: 5, scan: 200, delete: 10)

2. **Input Validation**
   - express-validator for request validation
   - SQL injection prevention via Prisma
   - XSS prevention in frontend

3. **CORS Configuration**
   - Restricted to allowed origins
   - Credentials support
   - Environment-specific settings

### Data Protection

1. **File Upload Security**
   - File type validation
   - Size limits (10MB max)
   - Virus scanning (recommended)
   - Secure file storage

2. **Sensitive Data Filtering**
   - Logs filter salary/payroll data
   - Contact details masked
   - Password fields excluded

3. **HTTPS Enforcement**
   - SSL/TLS in production
   - Secure cookies
   - HSTS headers (recommended)

### Database Security

1. **Connection Security**
   - Environment variable credentials
   - Connection pooling
   - Prepared statements via Prisma

2. **Access Control**
   - Role-based permissions
   - Branch-level data isolation
   - Admin-only sensitive operations

### Recommended Security Enhancements

1. **Helmet.js** for security headers
2. **CSRF protection** for state-changing operations
3. **Password strength requirements**
4. **Account lockout** after failed attempts
5. **Two-factor authentication**
6. **Audit log integrity verification**
7. **Regular security audits**
8. **Dependency vulnerability scanning**

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 20.x
- MySQL 5.7+
- Git

**Backend Setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npx prisma generate
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with API URL
npm install
npm run dev
```

**Mobile App Setup:**
```bash
cd attendance-mobile
npm install
npm start
```

### Database Migrations

**Create Migration:**
```bash
cd backend
npx prisma migrate dev --name migration_name
```

**Apply Migration (Production):**
```bash
npx prisma migrate deploy
```

**Reset Database:**
```bash
npx prisma migrate reset
```

### Code Quality

**TypeScript Compilation:**
```bash
cd backend
npx tsc --noEmit
```

**Linting:**
```bash
cd frontend
npm run lint
```

**Prisma Studio (Database GUI):**
```bash
cd backend
npx prisma studio
```

### Git Workflow

**Branch Naming:**
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/critical-fix`

**Commit Messages:**
- `feat: add new feature`
- `fix: resolve issue`
- `docs: update documentation`
- `refactor: code refactoring`

---

## Deployment

### Production Environment

**Server:** Hostinger VPS  
**OS:** Linux (Ubuntu/Debian)  
**Domain:** attendacev2.xandree.com  
**IP:** 72.62.254.60

### Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 5002 | Express server |
| Frontend | 3001 | Next.js app |
| Database | 3306 | MySQL |
| WebSocket | 5002 | Socket.IO (same as backend) |

### Deployment Process

**1. Server Setup**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

**2. Deploy Backend**
```bash
cd /var/www/version2_attendance/backend
npm install
npx prisma generate
npm run build
pm2 start dist/server.js --name "v2-attendance-api"
pm2 save
```

**3. Deploy Frontend**
```bash
cd /var/www/version2_attendance/frontend
npm install
npm run build
pm2 start "npm start -- -p 3001" --name "v2-attendance-web"
pm2 save
```

**4. Configure Nginx**
```nginx
server {
    listen 80;
    server_name attendacev2.com www.attendacev2.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**5. SSL Configuration**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d attendacev2.com -d www.attendacev2.com
```

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
DATABASE_URL="mysql://root:password@localhost:3306/attendance-system"
PORT=5002
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=24h
QR_VERSION=V2
QR_PREFIX=JAJR-EMP
FRONTEND_URL=https://attendacev2.com
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://attendacev2.com/api
```

### Monitoring

**PM2 Commands:**
```bash
pm2 status              # Check process status
pm2 logs v2-attendance-api  # View backend logs
pm2 logs v2-attendance-web  # View frontend logs
pm2 restart all        # Restart all services
pm2 monit              # Monitor resources
```

**Nginx Commands:**
```bash
systemctl status nginx  # Check Nginx status
nginx -t               # Test configuration
systemctl reload nginx # Reload configuration
```

**Database Backup:**
```bash
mysqldump -u root -p attendance-system > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check MySQL is running: `systemctl status mysql`
- Verify DATABASE_URL in .env
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

**2. Port Already in Use**
```bash
lsof -i :5002
lsof -i :3001
# Kill process if needed
kill -9 <PID>
```

**3. WebSocket Connection Failed**
- Verify Nginx WebSocket configuration
- Check backend is running
- Verify CORS settings
- Test WebSocket endpoint: `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:5002/socket.io/`

**4. Login Fails in Localhost**
- Ensure frontend/.env.local exists
- Verify NEXT_PUBLIC_API_URL is correct
- Restart frontend after creating .env.local
- Check backend is running on correct port

**5. Prisma Client Not Generated**
```bash
cd backend
npx prisma generate
```

**6. Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Check TypeScript errors: `npx tsc --noEmit`

### Debugging Commands

**Backend Health Check:**
```bash
curl http://localhost:5002/health
```

**Database Connection Test:**
```bash
cd backend
npx prisma db pull
```

**View Logs:**
```bash
pm2 logs v2-attendance-api --lines 100
pm2 logs v2-attendance-web --lines 100
```

**Check WebSocket Connection:**
```javascript
// Browser console
const socket = io('http://localhost:5002');
socket.on('connect', () => console.log('Connected'));
```

### Performance Issues

**High Memory Usage:**
- Check log buffer size
- Reduce retention periods
- Archive old logs
- Monitor PM2 memory: `pm2 monit`

**Slow API Responses:**
- Check database indexes
- Optimize queries with Prisma
- Enable query caching
- Monitor database performance

**WebSocket Disconnections:**
- Check server resources
- Verify heartbeat configuration
- Monitor connection limits
- Check Nginx timeout settings

---

## Additional Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local development setup
- [QA_TESTING_GUIDE.md](./QA_TESTING_GUIDE.md) - Testing procedures
- [LOGIN_FLOW.md](./LOGIN_FLOW.md) - Authentication flow details
- [DASHBOARD_ATTENDANCE_GUIDE.md](./DASHBOARD_ATTENDANCE_GUIDE.md) - Dashboard features
- [QR_CODE_FORMAT.md](./QR_CODE_FORMAT.md) - QR code specification
- [SERVER_DEPLOYMENT_GUIDE.md](./SERVER_DEPLOYMENT_GUIDE.md) - Server administration
- [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) - Deployment issues

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Maintained By:** Development Team
