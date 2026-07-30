# Dashboard Attendance Page Guide

## Overview
The `dashboard/attendance` page is the main interface for managing employee attendance across different project branches. It allows administrators to select a branch, view employee status, and perform manual clock-in/clock-out operations.

## Location
`frontend/src/app/dashboard/attendance/page.tsx`

## Key Features

### 1. Branch Selection
- Displays project branches as cards in a grid layout
- Shows branch name, code, and description
- Pagination: 6 branches per page
- Click to select a branch and load its employees
- Visual indication (yellow highlight) for selected branch
- X button to deselect branch

### 2. Employee Management
- View all employees assigned to selected branch
- Real-time status tracking:
  - **Available**: Not clocked in yet
  - **Present**: Currently clocked in (active shift)
  - **Completed**: Shift finished (clocked out)
  - **Absent**: Marked as absent
- Manual clock-in/clock-out for employees
- Mark individual employees as absent

### 3. Filtering & Search
- **Filter Tabs**: Available, Summary, Present, Absent
- **Search**: Search employees by name, ID, or employee code
- Cross-branch search: When searching, employees from other branches appear in results
- Pagination for employee list (configurable rows per page)

### 4. Real-time Updates
- WebSocket integration for live attendance updates
- Flash animation when employee status changes
- Automatic data refresh on WebSocket events
- Connection status indicator

### 5. Statistics Dashboard
Shows real-time counts for selected branch:
- Completed shifts
- Present employees (active)
- Available employees
- Absent employees
- Total workers

## Data Flow

### 1. Branch Loading
```
Component Mount → useQuery(['branches']) → branchApi.getAll() → GET /branches
```
- Fetches from `admins` table where `branch_code IS NOT NULL`
- Maps branch codes to human-readable names
- Returns: `Branch[]` with `code`, `name`, `shortName`, `description`

### 2. Employee Loading
```
Branch Selected → useQuery(['branch-employees', selectedBranch]) → branchApi.getEmployees() → GET /branches/:branchCode/employees
```
- Only fetches when `selectedBranch` is set
- Backend query filters by:
  - `branch_code = selectedBranch`
  - `status = 'Active'`
- Joins with today's attendance records
- Returns: `BranchEmployee[]` with attendance status

### 3. Attendance Loading
```
Component Mount → useQuery(['today-attendance-all']) → attendanceApi.getAll() → GET /attendance
```
- Fetches all attendance records for today
- Used for cross-branch employee search
- Helps determine employee status across branches

## Component Structure

### State Variables
```typescript
selectedBranch: string        // Currently selected branch code
activeTab: string            // Current filter tab ('Available', 'Summary', 'Present', 'Absent')
searchQuery: string          // Search query for employees
currentPage: number          // Branch pagination page
employeeCurrentPage: number  // Employee pagination page
employeesPerPage: number     // Rows per page (saved to localStorage)
```

### React Query Hooks
- `branchesData`: Branch list
- `employeesData`: Employees for selected branch
- `searchResultsData`: Search results (cross-branch)
- `todayAttendanceData`: Today's attendance records

### Mutations
- `clockInMutation`: Manual clock-in
- `clockOutMutation`: Manual clock-out
- `markIndividualAbsentMutation`: Mark employee absent

## Filter Logic

### Tab Filters

**Available Tab:**
```typescript
emp.status !== 'absent' && 
((emp.timeIn === null && emp.timeOut === null) || 
 (emp.timeIn !== null && emp.timeOut !== null))
```
- Shows employees who haven't clocked in OR have completed their shift
- Excludes absent employees

**Present Tab:**
```typescript
emp.timeIn !== null && emp.timeOut === null
```
- Shows only employees currently on active shift

**Absent Tab:**
```typescript
emp.status === 'absent'
```
- Shows only employees marked as absent

**Summary Tab:**
```typescript
// Shows all employees, sorted by status
// Order: Completed → Present → Absent/Available
```

### Search Logic
- Searches by: name, employee ID, or employee code
- Minimum 2 characters to trigger search
- Cross-branch: Results include employees from other branches
- Merges with branch employees to allow cross-branch clock-ins

## WebSocket Integration

### Connection
- Auto-connects on component mount
- Uses `useWebSocket` hook
- URL derived from `NEXT_PUBLIC_API_URL`
- Auth via JWT token from localStorage

### Events
- `join-branch`: Joins a branch-specific room for real-time updates
- `leave-branch`: Leaves branch room
- `attendance:update`: Receives attendance change notifications

### Real-time Behavior
```typescript
useEffect(() => {
  if (selectedBranch) {
    joinBranch(selectedBranch);
  }
  return () => {
    if (selectedBranch) {
      leaveBranch(selectedBranch);
    }
  };
}, [selectedBranch, joinBranch, leaveBranch]);
```

### Update Handler
```typescript
on('attendance:update', (data) => {
  setFlashedEmployeeId(data.employeeId);
  setTimeout(() => setFlashedEmployeeId(null), 1000);
  queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch] });
  queryClient.refetchQueries({ queryKey: ['today-attendance-all'] });
});
```

## API Endpoints

### GET /branches
Returns all branches from `admins` table.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string,
      code: string,      // Branch code (A, B, C, etc.)
      name: string,      // Admin name (e.g., "Branch H Device")
      shortName: string, // Mapped name (e.g., "Testing Branch")
      description: string
    }
  ]
}
```

### GET /branches/:branchCode/employees
Returns employees for a specific branch with today's attendance.

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: number,
      name: string,
      avatar: string,
      employeeCode: string | null,
      department: string,
      position: string,
      branchName: string,
      timeIn: string | null,      // "HH:MM" format
      timeOut: string | null,     // "HH:MM" format
      totalHours: string,        // "H.MM" format
      status: string | null,      // 'present', 'absent', etc.
      attendanceId: number | null
    }
  ]
}
```

### POST /attendance/manual-clock-in
Manually clock in an employee.

**Request:**
```typescript
{
  employeeId: number,
  branch_code: string,
  notes?: string
}
```

### POST /attendance/manual-clock-out
Manually clock out an employee.

**Request:**
```typescript
{
  employeeId: number,
  notes?: string
}
```

### POST /attendance/mark-absent/:employeeId
Mark an employee as absent.

## Backend Query Details

### Employee Query (branch.controller.ts)
```typescript
const employees = await prisma.employee.findMany({
  where: {
    branchCode: branchCode,
    status: 'Active'
  },
  select: {
    id: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    department: true,
    position: true,
    branchName: true,
    branchCode: true
  }
});
```

### Attendance Query
```typescript
const todayAttendance = await prisma.attendance.findMany({
  where: {
    employeeId: { in: employeeIds },
    date: today  // UTC midnight
  },
  orderBy: { check_in: 'desc' }
});
```

## Branch Code Mapping

The frontend uses a hardcoded mapping for branch names:

```typescript
const branchNames = {
  'A': 'Sto. Rosario',
  'B': 'BCDA',
  'C': 'Sundara',
  'D': 'Panicsican',
  'E': 'Main Office',
  'F': 'Capitol',
  'H': 'Testing Branch'
};
```

This mapping is used to display human-readable names on branch cards.

## Common Issues

### No Employees Found
**Causes:**
1. No branch selected
2. Branch has no employees with matching `branch_code`
3. Employees don't have `status = 'Active'`
4. API response error

**Debugging:**
- Check browser console for `[Attendance]` logs
- Verify database: `SELECT branch_code, status, COUNT(*) FROM employees GROUP BY branch_code, status`
- Ensure branch codes match between `employees` and `admins` tables

### WebSocket Not Connecting
**Causes:**
1. Invalid API URL
2. Missing or expired JWT token
3. Backend WebSocket server not running

**Debugging:**
- Check console for `[WebSocket]` logs
- Verify `NEXT_PUBLIC_API_URL` in `.env`
- Check backend logs for WebSocket connection errors

### Attendance Not Updating Real-time
**Causes:**
1. Not joined to correct branch room
2. WebSocket event handler not registered
3. Query cache not invalidated

**Debugging:**
- Check console for "Joined branch: X" message
- Verify WebSocket is connected (green indicator)
- Check Network tab for WebSocket frames

## Database Schema Requirements

### employees table
```sql
- id (int, primary key)
- employee_code (varchar(50), unique)
- first_name (varchar(100))
- last_name (varchar(100))
- branch_code (varchar(10))  -- Must match admins.branch_code
- status (varchar(20))       -- Must be 'Active' for query
- department (varchar(50))
- position (varchar(50))
```

### attendance table
```sql
- id (int, primary key)
- employee_id (int)
- branch_code (varchar(10))
- date (date)
- check_in (time)
- check_out (time)
- status (enum: present, absent, late, half_day, leave)
```

### admins table
```sql
- id (int, primary key)
- name (varchar(100))
- branch_code (varchar(10))  -- Must match employees.branch_code
```

## Keyboard Shortcuts
- **Arrow Left/Right**: Navigate employee pagination
- **Page Up/Down**: Navigate employee pagination

## Performance Considerations

### Pagination
- Branches: 6 per page (configurable)
- Employees: 20 per page (configurable, saved to localStorage)

### Query Optimization
- Branch employees query only runs when branch is selected
- Attendance query limited to today's date
- Search queries have minimum 2-character threshold
- React Query caching reduces redundant API calls

### WebSocket Efficiency
- Only joins branch room when branch is selected
- Leaves room on branch change or unmount
- Debounced refetch on attendance updates

## Future Enhancements
- [ ] Bulk clock-in/clock-out for multiple employees
- [ ] Export attendance data to CSV/PDF
- [ ] Employee shift scheduling
- [ ] Overtime calculation display
- [ ] Geolocation verification for clock-in
- [ ] Photo capture on clock-in
