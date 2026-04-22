# /dashboard/attendance Page Specification

## Overview
The attendance dashboard page allows administrators to view and manage employee attendance by branch. When a branch is selected, all employees assigned to that branch are displayed in a table with their current attendance status.

## Current State
The page exists at `frontend/src/app/dashboard/attendance/page.tsx` and has:
- Branch selection cards (paginated, 6 per page)
- Filter tabs: Available, Summary, Present, Absent
- Employee table with Time In/Time Out actions
- Stats cards showing counts
- Search functionality
- Manual clock-in/clock-out mutations

## Required Functionality Changes

### 1. Branch Selection
- **Current**: Branch cards are displayed, clicking selects a branch
- **Behavior**: When a branch is selected, fetch all employees where `employee.branch_code` **exactly matches** the selected branch code
- **Data Source**: `GET /api/branches/:branchCode/employees` (from `branch.controller.ts:getBranchEmployees`)
- **Schema Change**: Add `employees.branch_code` column (VARCHAR(10), nullable). This becomes the **source of truth** for filtering. `employees.branch_name` is kept as display/legacy only.
- **Backfill**: Match `employees.branch_name` to `branches.branch_name` to derive `branch_code`. Fallback to manual mapping dictionary for mismatches.

### 2. Employee Data Display
When a branch is selected, the table should show:
- Employee name, avatar (initials), department
- Time In (if clocked in today)
- Time Out (if clocked out today)
- Total Hours (calculated from check_in/check_out)
- Status badge (Available, Present, Completed, Absent)
- Actions (Time In/Time Out buttons)

### 3. Filter Tabs Logic

#### Available Tab
- **Shows**: Employees who have NOT time in yet today OR employees with completed shifts (both timeIn and timeOut)
- **Logic**: `timeIn === null && timeOut === null` OR `timeIn !== null && timeOut !== null`
- **Note**: Completed employees can re-clock in immediately

#### Summary Tab
- **Shows**: ALL employees in the selected branch
- **Sort Order**: 
  1. Completed (timeIn && timeOut) - highest priority
  2. Present (timeIn && !timeOut)
  3. Absent/Available (!timeIn && !timeOut)

#### Present Tab
- **Shows**: Employees currently clocked in (active shift only, NOT including completed)
- **Logic**: `timeIn !== null && timeOut === null`

#### Absent Tab
- **Shows**: Employees with no attendance record for today (no time in at all)
- **Logic**: `timeIn === null && timeOut === null` AND no attendance record exists for today

### 4. Backend API Endpoints

The following endpoints are already implemented:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/branches` | GET | Get all branches |
| `/api/branches/:branchCode/employees` | GET | Get employees for branch with today's attendance |
| `/api/attendance/manual-clock-in` | POST | Manual clock in employee |
| `/api/attendance/manual-clock-out` | POST | Manual clock out employee |
| `/api/attendance` | GET | Get all attendance records (with filters) |

### 5. Data Flow

```
1. User selects branch
   ↓
2. Frontend calls GET /api/branches/:branchCode/employees
   ↓
3. Backend queries:
   - Employees where branchName contains branchCode (case insensitive)
   - Today's attendance records for those employees
   - Calculates timeIn, timeOut, totalHours
   ↓
4. Frontend displays in table
   ↓
5. User clicks Time In/Out
   ↓
6. Frontend calls manual-clock-in/out endpoints
   ↓
7. Refetch branch employees to update UI
```

### 6. Employee Status Definitions

| Status | Criteria | Badge Color |
|--------|----------|-------------|
| **Completed** | Has timeIn AND timeOut for today (computed, NOT stored in DB) | Blue |
| **Present** | Has timeIn but NO timeOut (active shift) | Green |
| **Available** | No timeIn yet today OR completed shift (ready to clock in) | Yellow |
| **Absent** | No attendance record at all for today | Red |

### 7. Key Files

| File | Purpose |
|------|---------|
| `frontend/src/app/dashboard/attendance/page.tsx` | Main attendance page component |
| `frontend/src/lib/api.ts` | API client functions |
| `backend/src/controllers/branch.controller.ts` | Branch & employee fetching logic |
| `backend/src/controllers/attendance.controller.ts` | Clock in/out logic |

### 8. Types

```typescript
// BranchEmployee from API
interface BranchEmployee {
  id: number;
  name: string;
  avatar: string;  // Initials
  employeeCode: string | null;
  department: string;
  position: string;
  branchName: string;
  timeIn: string | null;  // HH:MM format
  timeOut: string | null; // HH:MM format
  totalHours: string;     // e.g., "8.30"
  status: string | null;  // 'present', 'absent', 'late', 'half_day', 'leave'
  attendanceId: number | null;
}
```

## Implementation Notes

1. **Date Handling**: Backend uses Philippines timezone (Asia/Manila) for date calculations
2. **Attendance Records**: Multiple records per employee per day are allowed (re-clock in after completing shift)
3. **Active Record Logic**: When fetching attendance, the most recent incomplete record (no checkout) takes priority
4. **Search**: Cross-branch employee search is available via `employeeApi.getAll({ search })`
5. **Stats Cards**: Show counts based on currently filtered list (not all branch employees)
6. **Completed Status**: Computed in UI only (`check_in && check_out`), NOT stored in DB

## Auto-Absent Logic

### Trigger
- **Method**: Manual "Mark Absentees" button on the attendance page (per-branch)
- **Enabled**: When current PH time >= 9:00 AM
- **Scope**: Only the currently selected branch
- **Future Upgrade**: Cron job at 9:00 AM PH daily (once stable)

### Behavior
- At 9:00 AM PH, if an employee has **no attendance record at all** for today:
  - Insert `attendance` row with `status='absent'`, `check_in=NULL`, `check_out=NULL`, `branch_code=employee.branch_code`
- If an employee already has any attendance record (even completed), do NOT mark absent

### Late Clock-In After Auto-Absent
- If an employee clocks in after being auto-marked absent:
  - **Update** the existing absent row (do NOT create a new row)
  - Set `check_in` to current time
  - Set `status='late'` (per `determineStatus()` logic)

### Branch Code Schema Change
- Add `employees.branch_code` column (VARCHAR(10), nullable)
- **Source of truth** for all filtering/queries
- `employees.branch_name` kept as display/legacy only
- **Backfill**: Match `employees.branch_name` → `branches.branch_name` → `branches.branch_code`
- **Fallback**: Manual mapping dictionary for name mismatches
- **Employee form**: Branch name dropdown that saves `branch_code` internally
