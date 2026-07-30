# QR Scanner Troubleshooting Guide

## Problem: System Keeps Clocking In Instead of Toggling Clock In/Out

### Current Behavior
When scanning a QR code multiple times, the system always performs **Clock In** instead of:
1. First scan → Clock In
2. Second scan → Clock Out
3. Third scan → Clock In again

### Root Cause: Date/Timezone Mismatch

The issue is a **date mismatch** between when attendance records are stored vs when they are queried.

## How QR Scanner Works

### Step 1: QR Code Scanning (Frontend)
```
User scans QR code → Raw data: "E0002"
```

### Step 2: Employee Lookup (Frontend → Backend)
```javascript
// Frontend: branch/qr-scanner/page.tsx
const empResponse = await fetch('/api/employees?search=E0002');
// Returns: Employee ID 12
```

### Step 3: Check Today's Attendance (Frontend → Backend)
```javascript
const todayResponse = await fetch('/api/attendance/today?employeeId=12');
```

### Step 4: Decision Logic (Frontend)
```javascript
if (todayData.data && todayData.data.check_in && !todayData.data.check_out) {
  // Employee has active clock-in → Perform CLOCK OUT
  clockOutMutation.mutate({ qrCodeData: qrData });
} else {
  // No active clock-in → Perform CLOCK IN
  clockInMutation.mutate({ qrCodeData: qrData });
}
```

## The Bug: Date Mismatch

### What Happens During Clock In (Backend)
```typescript
// backend/src/controllers/attendance.controller.ts
const performClockIn = async (employee, notes, isManual, branchCode) => {
  // OLD CODE (UTC):
  const dateNow = new Date();
  const today = new Date(Date.UTC(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate()));
  
  // Stores date in database (e.g., "2026-04-20T00:00:00.000Z")
  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: today,  // UTC midnight
      check_in: new Date(),
      ...
    }
  });
};
```

### What Happens During Query (Backend)
```typescript
// backend/src/controllers/attendance.controller.ts
const getTodayAttendance = async (req, res, next) => {
  // OLD CODE (UTC):
  const dateNow = new Date();
  const today = new Date(Date.UTC(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate()));
  
  // Queries database
  const attendance = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: today  // Looking for UTC midnight
    }
  });
};
```

### The Problem
The server is in a different timezone than the Philippines (UTC+8). When:
- **Clock In happens**: Server creates UTC date (e.g., 2026-04-20 in UTC)
- **Query happens**: Server queries with different UTC date (e.g., 2026-04-21 in UTC because it's already next day in UTC but still same day in Philippines)

**Result**: Query returns "No attendance record for today"

## Console Log Analysis

```
[CLOCK DEBUG] Checking employee: E0002
[CLOCK DEBUG] Employee search result: {success: true, data: Array(1)}
[CLOCK DEBUG] Found employee ID: 12

[CLOCK DEBUG] Today attendance: {success: true, message: 'No attendance record for today', data: null}
[CLOCK DEBUG] Has active clock in? null           ← BUG: Should be TRUE
[CLOCK DEBUG] check_in: undefined                 ← BUG: Should have value
[CLOCK DEBUG] check_out: undefined                ← BUG: Should be null
[CLOCK DEBUG] -> Performing CLOCK IN              ← WRONG: Should be CLOCK OUT
```

## Solution: Use Philippines Timezone (Asia/Manila)

### Fixed Code (Backend)
```typescript
// Helper function to get Philippines date
const getPhilippinesDate = (): Date => {
  const now = new Date();
  // Convert to Philippines time (UTC+8)
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  // Return date at midnight Philippines time
  return new Date(phTime.getFullYear(), phTime.getMonth(), phTime.getDate());
};

// Use in performClockIn
const performClockIn = async (...) => {
  const today = getPhilippinesDate();  // Now uses Philippines timezone
  ...
};

// Use in getTodayAttendance
const getTodayAttendance = async (...) => {
  const today = getPhilippinesDate();  // Same timezone as clock-in
  ...
};

// Use in performClockOut
const performClockOut = async (...) => {
  const today = getPhilippinesDate();  // Same timezone
  ...
};
```

## Verification Steps

After deploying the fix, check server logs:

```
[CLOCK-IN DEBUG] Server time: 2026-04-21T10:30:00.000Z
[CLOCK-IN DEBUG] Philippines date: 2026-04-21T00:00:00.000Z  ← Same date

[TODAY DEBUG] Server time: 2026-04-21T10:35:00.000Z
[TODAY DEBUG] Philippines date: 2026-04-21T00:00:00.000Z  ← MATCHES!
[TODAY DEBUG] Found attendance record: { id: 123, date: 2026-04-21T00:00:00.000Z, ... }
```

## Test Procedure

1. **Clock In**: Scan QR code → Should show "Clock In: E0002"
2. **Verify in Database**: Check attendance table has record with today's Philippines date
3. **Clock Out**: Scan same QR code again → Should show "Clock Out: E0002"
4. **Check Console Logs**: `[CLOCK DEBUG] Has active clock in? true`

## Related Files

- **Frontend**: `frontend/src/app/branch/qr-scanner/page.tsx`
  - `checkAndPerformClockAction()` function
  - Lines 292-339

- **Backend**: `backend/src/controllers/attendance.controller.ts`
  - `performClockIn()` - Lines 24-85
  - `performClockOut()` - Lines 87-125
  - `getTodayAttendance()` - Lines 493-530
  - `getPhilippinesDate()` helper - Lines 24-31

## Additional Issue: Multi-Branch Clock-In

If an employee clocks in at Branch A, they should:
1. Clock out from Branch A first
2. Then clock in at Branch B

The backend already has this check in `performClockIn()`:
```typescript
const activeShift = await prisma.attendance.findFirst({
  where: {
    employeeId: employee.id,
    date: today,
    check_in: { not: null },
    check_out: null
  }
});

if (activeShift && branchCode && activeShift.branch_code !== branchCode) {
  throw new AppError(
    `Cannot clock in at this branch. Employee must clock out from ${activeShift.branch_code} first.`,
    409
  );
}
```

This works correctly once the date/timezone issue is fixed.

## Status

- [x] QR code parsing fixed (legacy format support)
- [x] Admin passwords restored
- [x] Employees imported from v1
- [ ] Date/timezone bug being fixed
- [ ] Clock in/out toggle verification pending
