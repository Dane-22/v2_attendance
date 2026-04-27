# Cross-Branch Clock-In Behavior

## Overview

This document explains what happens when an employee from one branch is clocked in at a different branch in the attendance system. It details the technical implementation, database changes, API behavior, and the distinction between clock-in and transfer operations.

---

## Scenario

**What happens when an employee from one branch is clocked in at a different branch?**

### Example Scenario:
1. Employee 1 is assigned to the "testing" branch (branch code: "T")
2. Admin selects "Sto. Rosario" branch (branch code: "A") in the dashboard
3. Admin searches for Employee 1
4. Admin clicks "Time In" for Employee 1

---

## Executive Summary

**NO, the employee does NOT transfer to the new branch.**

Clocking in an employee at a different branch only records their attendance at that location. It does **not** change the employee's permanent branch assignment in the database.

- ✅ The attendance record shows the employee worked at Sto. Rosario
- ❌ The employee's permanent assignment remains at "testing" branch
- ❌ The employee will still appear in the "testing" branch employee list

---

## Database Schema

### Employee Table
```prisma
model Employee {
  id                   Int       @id @default(autoincrement())
  employeeCode         String?   @unique @map("employee_code") @db.VarChar(50)
  firstName            String?   @map("first_name") @db.VarChar(100)
  lastName             String?   @map("last_name") @db.VarChar(100)
  branchName           String?   @map("branch_name") @db.VarChar(100)
  branchCode           String?   @map("branch_code") @db.VarChar(10)
  branchId             Int?      @map("branch_id")
  status               String?   @default("Active") @db.VarChar(20)
  // ... other fields
}
```

### Attendance Table
```prisma
model Attendance {
  id          Int                @id @default(autoincrement())
  employeeId  Int                @map("employee_id")
  branch_code String?            @db.VarChar(10)
  date        DateTime           @db.Date
  check_in    DateTime?          @db.Time(0)
  check_out   DateTime?          @db.Time(0)
  status      attendance_status? @default(present)
  notes       String?            @db.Text
  // ... other fields
}
```

### Branches Table
```prisma
model branches {
  id             Int       @id @default(autoincrement())
  branch_code    String    @unique @db.VarChar(10)
  branch_name    String    @db.VarChar(100)
  address        String?   @db.Text
  contact_number String?   @db.VarChar(20)
  status         String?   @default("Active") @db.VarChar(20)
  // ... other fields
}
```

---

## Step-by-Step Flow

### Frontend Flow

**File**: `frontend/src/app/dashboard/attendance/page.tsx`

1. **Branch Selection** (line 54):
   ```typescript
   const [selectedBranch, setSelectedBranch] = useState<string>('');
   ```
   - Admin clicks on "Sto. Rosario" branch card
   - `selectedBranch` is set to "A"

2. **Employee Search** (line 56, 126-135):
   ```typescript
   const [searchQuery, setSearchQuery] = useState('');
   
   const { data: searchResultsData } = useQuery({
     queryKey: ['employee-search', searchQuery],
     queryFn: async () => {
       if (!searchQuery || searchQuery.length < 2) return [];
       const response = await employeeApi.getAll({ search: searchQuery, limit: 50 });
       return response.data.data || [];
     },
     enabled: searchQuery.length >= 2
   });
   ```
   - Admin searches for "Employee 1"
   - Search queries ALL employees across all branches
   - Employee 1 appears in search results even though they're assigned to "testing"

3. **Employee Merging** (line 271-321):
   ```typescript
   const mergedEmployees = useMemo(() => {
     if (searchQuery.length < 2) return employees;
     
     // Create a map of existing employees by ID
     const existingMap = new Map(employees.map(e => [e.id, e]));
     
     // Add search results that aren't already in the list
     const merged = [...employees];
     searchResults.forEach(emp => {
       if (!existingMap.has(emp.id)) {
         // Format the employee to match BranchEmployee structure
         merged.push({
           id: emp.id,
           name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
           branchName: emp.branchName || '',
           branchCode: emp.branchCode || null,
           // ... other fields
         });
       }
     });
     
     return merged;
   }, [employees, searchResults, searchQuery, todayAttendance]);
   ```
   - Search results are merged with the selected branch's employees
   - Employee 1 from "testing" branch is added to the displayed list
   - Their `branchName` and `branchCode` show their original assignment ("testing")

4. **Clock-in Action** (line 148-166, 694-696):
   ```typescript
   const clockInMutation = useMutation({
     mutationFn: ({ employeeId, branchCode }: { employeeId: number; branchCode: string }) =>
       attendanceApi.manualClockIn({ employeeId, branch_code: branchCode }),
     onSuccess: async (data) => {
       setSearchQuery('');
       await queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch], exact: true });
       await queryClient.refetchQueries({ queryKey: ['today-attendance-all'], exact: true });
     },
   });

   // In the button:
   onClick={() => {
     clockInMutation.mutate({ employeeId: employee.id, branchCode: selectedBranch });
   }}
   ```
   - Admin clicks "Time In" for Employee 1
   - The mutation sends: `{ employeeId: 1, branch_code: "A" }`
   - Note: `branchCode` is the SELECTED branch ("A"), NOT the employee's assigned branch

### Backend Flow

**File**: `backend/src/controllers/attendance.controller.ts`

1. **API Endpoint** (line 23 in `attendance.routes.ts`):
   ```
   POST /attendance/manual-clock-in
   ```

2. **manualClockIn Controller** (line 490-558):
   ```typescript
   export const manualClockIn = async (
     req: AuthenticatedRequest,
     res: Response,
     next: NextFunction
   ): Promise<void> => {
     try {
       const { employeeId, notes, branch_code } = req.body;
       
       // Validate employee
       const employee = await prisma.employee.findUnique({
         where: { id: employeeId }
       });
       
       if (!employee) {
         throw new AppError('Employee not found', 404);
       }
       
       if (employee.status !== 'Active') {
         throw new AppError('Employee account is not active', 403);
       }
       
       // Perform clock-in
       const { attendance, message } = await performClockIn(employee, notes, true, branch_code);
       
       // Log the action
       await logCreate({
         userId: req.admin?.id || 0,
         userName: req.admin?.name || 'unknown',
         userRole: req.admin?.role || 'admin',
         entityType: 'ATTENDANCE',
         entityId: attendance.id.toString(),
         entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
         description: `Manual Clock IN: ${employee.firstName} ${employee.lastName} by ${req.admin?.name}`,
         branchId: employee.branchId || undefined,
         metadata: { method: 'manual', employeeId: employee.id, branch_code },
       });
       
       // Emit WebSocket event
       const branchCode = branch_code || employee.branchCode || employee.branchName || 'A';
       if (global.io) {
         emitAttendanceUpdate(global.io, branchCode, {
           type: 'clock_in',
           employeeId: employee.id,
           employeeName: `${employee.firstName} ${employee.lastName}`,
           employeeCode: employee.employeeCode || '',
           branchCode: branchCode,
           branchName: branchCode,
           timestamp: new Date().toISOString(),
           previousStatus: 'available',
           newStatus: attendance.status || 'present'
         });
       }
       
       res.status(201).json({ success: true, message, data: attendance });
     } catch (error) {
       next(error);
     }
   };
   ```

3. **performClockIn Function** (line 267-365):
   ```typescript
   const performClockIn = async (
     employee: { id: number; branchName: string | null; status: string | null },
     notes: string | undefined,
     isManual: boolean,
     branchCode?: string
   ): Promise<{ attendance: Attendance; message: string }> => {
     const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
     
     // Check for existing attendance record today
     let attendance = await prisma.attendance.findFirst({
       where: {
         employeeId: employee.id,
         date: {
           gte: todayStart,
           lt: todayEnd
         }
       }
     });
     
     // Check for active shift at different branch
     const activeShift = await prisma.attendance.findFirst({
       where: {
         employeeId: employee.id,
         date: {
           gte: todayStart,
           lt: todayEnd
         },
         check_in: { not: null },
         check_out: null
       }
     });
     
     // IMPORTANT: Prevent clock-in at different branch if active shift exists
     if (activeShift && branchCode && activeShift.branch_code !== branchCode) {
       throw new AppError(
         `Cannot clock in at this branch. Employee must clock out from ${activeShift.branch_code} first.`,
         409
       );
     }
     
     // Determine status based on time
     const status = determineAttendanceStatus(checkInTime);
     
     // Create or update attendance record
     if (attendance) {
       // Update existing record
       attendance = await prisma.attendance.update({
         where: { id: attendance.id },
         data: {
           check_in: checkInTime,
           status,
           branch_code: branchCode || employee.branchName || absentRecord.branch_code || undefined,
           notes: notes || absentRecord.notes
         }
       });
     } else {
       // Create new record
       attendance = await prisma.attendance.create({
         data: {
           employeeId: employee.id,
           date: todayStart,
           check_in: checkInTime,
           status,
           branch_code: branchCode || employee.branchName || undefined,
           notes
         }
       });
     }
     
     return { attendance, message: 'Clock-in successful' };
   };
   ```

---

## What Gets Modified

### Database Changes After Clock-In

**Attendance Table:**
```sql
-- New record created
INSERT INTO attendance (
  employee_id,
  branch_code,
  date,
  check_in,
  status,
  notes,
  created_at,
  updated_at
) VALUES (
  1,              -- employeeId
  'A',            -- branch_code (Sto. Rosario)
  '2026-04-27',   -- date
  '08:00:00',     -- check_in
  'present',      -- status
  NULL,           -- notes
  NOW(),          -- created_at
  NOW()           -- updated_at
);
```

**Employee Table:**
```sql
-- NO CHANGES to employee table
-- employee.branchCode remains 'T' (testing)
-- employee.branchName remains 'testing'
-- employee.branchId remains unchanged
```

---

## Key Protection Mechanisms

### 1. Active Shift Check (Line 295-303)
```typescript
if (activeShift && branchCode && activeShift.branch_code !== branchCode) {
  throw new AppError(
    `Cannot clock in at this branch. Employee must clock out from ${activeShift.branch_code} first.`,
    409
  );
}
```

**Purpose**: Prevents an employee from having concurrent shifts at multiple branches.

**Scenario**: If Employee 1 is already clocked in at "testing" branch, they cannot clock in at "Sto. Rosario" until they clock out from "testing" first.

### 2. Transfer Restriction (Line 558-577 in employee.controller.ts)
```typescript
// Check if employee has active clock-in
const activeAttendance = await prisma.attendance.findFirst({
  where: {
    employeeId: id,
    date: { gte: today, lt: tomorrow },
    check_in: { not: null },
    check_out: null
  }
});

if (activeAttendance) {
  throw new AppError('Cannot transfer employee with active clock-in. Please clock out first.', 400);
}
```

**Purpose**: Prevents transferring an employee who is currently working (has an active shift).

---

## Clock-In vs Transfer

### Clock-In Operation

**Purpose**: Record attendance for a specific work session

**API Endpoint**: `POST /attendance/manual-clock-in`

**Frontend API**: `attendanceApi.manualClockIn({ employeeId, branch_code })`

**What it does**:
- Creates/updates an attendance record
- Sets `attendance.branch_code` to the specified branch
- Does NOT modify employee's permanent branch assignment
- Allows temporary work at different branches

**Use cases**:
- Employee temporarily assigned to another project
- Employee helping at another branch
- Emergency coverage at different location

### Transfer Operation

**Purpose**: Permanently change an employee's branch assignment

**API Endpoint**: `PATCH /employees/:id/transfer`

**Frontend API**: `employeeApi.transfer(id, { branchCode, reason })`

**Backend Function**: `transferEmployee` (line 523-611 in employee.controller.ts)

**What it does**:
```typescript
const updatedEmployee = await prisma.employee.update({
  where: { id },
  data: {
    branchCode,
    branchName: destinationBranch.branch_name,
    branchId: destinationBranch.id
  },
  select: {
    id: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    branchName: true,
    branchCode: true,
    branchId: true,
    // ... other fields
  }
});
```

- Updates `employee.branchCode`
- Updates `employee.branchName`
- Updates `employee.branchId`
- Permanently changes the employee's assignment
- Requires no active clock-in

**Use cases**:
- Permanent reassignment to different branch
- Promotion/demotion to different location
- Organizational restructuring

---

## WebSocket Behavior

When a clock-in occurs, a WebSocket event is emitted to update real-time UI:

```typescript
const branchCode = branch_code || employee.branchCode || employee.branchName || 'A';
if (global.io) {
  emitAttendanceUpdate(global.io, branchCode, {
    type: 'clock_in',
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: employee.employeeCode || '',
    branchCode: branchCode,
    branchName: branchCode,
    timestamp: new Date().toISOString(),
    previousStatus: 'available',
    newStatus: attendance.status || 'present'
  });
}
```

**Important**: The WebSocket is emitted to the branch where the clock-in occurred (branch_code parameter), NOT the employee's assigned branch.

---

## Edge Cases and Error Scenarios

### Scenario 1: Employee Already Clocked In at Different Branch
```
Employee: Assigned to "testing" (T)
Active shift: Clocked in at "testing" (T)
Action: Try to clock in at "Sto. Rosario" (A)
Result: ERROR - "Cannot clock in at this branch. Employee must clock out from T first."
HTTP Status: 409 Conflict
```

### Scenario 2: Employee Not Found
```
Employee ID: 999 (doesn't exist)
Action: Try to clock in
Result: ERROR - "Employee not found"
HTTP Status: 404 Not Found
```

### Scenario 3: Inactive Employee
```
Employee status: "Inactive"
Action: Try to clock in
Result: ERROR - "Employee account is not active"
HTTP Status: 403 Forbidden
```

### Scenario 4: Transfer with Active Clock-In
```
Employee: Has active clock-in at "testing"
Action: Try to transfer to "Sto. Rosario"
Result: ERROR - "Cannot transfer employee with active clock-in. Please clock out first."
HTTP Status: 400 Bad Request
```

### Scenario 5: Transfer to Same Branch
```
Employee: Already at "testing"
Action: Try to transfer to "testing"
Result: ERROR - "Employee is already in this branch"
HTTP Status: 400 Bad Request
```

### Scenario 6: Destination Branch Not Found
```
Action: Try to transfer to branch code "Z" (doesn't exist)
Result: ERROR - "Destination branch not found"
HTTP Status: 404 Not Found
```

---

## Testing Scenarios

### Test Case 1: Cross-Branch Clock-In (No Active Shift)
**Preconditions**:
- Employee 1 assigned to "testing" branch
- No active clock-in for today

**Steps**:
1. Select "Sto. Rosario" branch in dashboard
2. Search for Employee 1
3. Click "Time In"

**Expected Results**:
- Attendance record created with `branch_code = "A"`
- Employee record unchanged (`branchCode = "T"`)
- Employee still appears in "testing" branch employee list
- Attendance shows Sto. Rosario as work location

### Test Case 2: Cross-Branch Clock-In (With Active Shift)
**Preconditions**:
- Employee 1 assigned to "testing" branch
- Active clock-in at "testing" branch

**Steps**:
1. Select "Sto. Rosario" branch in dashboard
2. Search for Employee 1
3. Click "Time In"

**Expected Results**:
- Error message: "Cannot clock in at this branch. Employee must clock out from T first."
- No new attendance record created
- HTTP 409 Conflict

### Test Case 3: Clock-In Then Transfer
**Preconditions**:
- Employee 1 assigned to "testing" branch
- No active clock-in

**Steps**:
1. Clock in at "Sto. Rosario"
2. Clock out
3. Transfer to "Sto. Rosario"

**Expected Results**:
- Step 1: Attendance record with `branch_code = "A"`, employee unchanged
- Step 2: Attendance record updated with check_out time
- Step 3: Employee record updated to `branchCode = "A"`, `branchName = "Sto. Rosario"`

### Test Case 4: Transfer with Active Clock-In
**Preconditions**:
- Employee 1 assigned to "testing" branch
- Active clock-in at "testing"

**Steps**:
1. Try to transfer to "Sto. Rosario"

**Expected Results**:
- Error message: "Cannot transfer employee with active clock-in. Please clock out first."
- Employee record unchanged
- HTTP 400 Bad Request

---

## API Reference

### Manual Clock-In
```
POST /attendance/manual-clock-in
Authentication: Required (admin)
```

**Request Body**:
```json
{
  "employeeId": 1,
  "branch_code": "A",
  "notes": "Optional notes"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Clock-in successful",
  "data": {
    "id": 123,
    "employeeId": 1,
    "branch_code": "A",
    "date": "2026-04-27",
    "check_in": "08:00:00",
    "check_out": null,
    "status": "present",
    "notes": null,
    "createdAt": "2026-04-27T08:00:00.000Z",
    "updatedAt": "2026-04-27T08:00:00.000Z"
  }
}
```

**Response** (Error - Active Shift):
```json
{
  "success": false,
  "message": "Cannot clock in at this branch. Employee must clock out from T first."
}
```

### Transfer Employee
```
PATCH /employees/:id/transfer
Authentication: Required (admin)
```

**Request Body**:
```json
{
  "branchCode": "A",
  "reason": "Project reassignment"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Employee transferred successfully",
  "data": {
    "employee": {
      "id": 1,
      "employeeCode": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "branchCode": "A",
      "branchName": "Sto. Rosario",
      "branchId": 1,
      "status": "Active"
    },
    "previousBranch": "T"
  }
}
```

**Response** (Error - Active Clock-In):
```json
{
  "success": false,
  "message": "Cannot transfer employee with active clock-in. Please clock out first."
}
```

---

## Summary Table

| Action | Modifies Employee Branch? | Modifies Attendance Branch? | Purpose | Temporary/Permanent |
|--------|---------------------------|-----------------------------|---------|---------------------|
| Clock-in at different branch | ❌ No | ✅ Yes | Records work location | Temporary |
| Clock-in at same branch | ❌ No | ✅ Yes | Records work location | Temporary |
| Transfer employee | ✅ Yes | ❌ No | Changes assignment | Permanent |

---

## Best Practices

### For Admins
1. **Use clock-in** when an employee is temporarily working at a different branch
2. **Use transfer** when permanently reassigning an employee to a new branch
3. **Always clock out** before attempting to transfer an employee
4. **Check active shifts** before trying to clock in at a different branch

### For Developers
1. **Never assume** clock-in changes employee branch assignment
2. **Always check** for active shifts before allowing cross-branch operations
3. **Use separate APIs** for clock-in vs transfer operations
4. **Emit WebSocket events** to the correct branch room for real-time updates
5. **Log all cross-branch operations** for audit purposes

---

## Conclusion

**Clock-in is for attendance tracking only. Transfer is for changing an employee's permanent branch assignment.**

When an employee is clocked in at a different branch:
- The attendance record reflects where they worked that day
- Their permanent branch assignment remains unchanged
- They will continue to appear in their original branch's employee list
- To permanently change their branch, use the transfer operation instead

This design allows for flexible workforce management where employees can work at different locations as needed, while maintaining clear records of their permanent assignments.
