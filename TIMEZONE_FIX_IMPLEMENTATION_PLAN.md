# Timezone Fix Implementation Plan

## Problem Summary
The branch QR scanner displays "timed in" when it should display "timed out" due to a timezone mismatch in the `getPhilippinesDateRange()` function in `backend/src/controllers/attendance.controller.ts`.

## Root Cause
The function extracts Philippines date components using `Intl.DateTimeFormat` with `Asia/Manila` timezone, but then creates UTC dates using those components. This causes a mismatch when:
- Querying for active records (uses UTC-based date range)
- Inserting records (uses Philippines date string from `getPhilippinesDateString()`)

## Implementation Steps

### Step 1: Backup Current Code
**File**: `backend/src/controllers/attendance.controller.ts`

```bash
# Create backup
cp backend/src/controllers/attendance.controller.ts backend/src/controllers/attendance.controller.ts.backup
```

### Step 2: Implement the Fix
**File**: `backend/src/controllers/attendance.controller.ts`
**Function**: `getPhilippinesDateRange()` (lines 418-435)

**Current Code (Buggy):**
```typescript
const getPhilippinesDateRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const start = new Date(Date.UTC(year, month, day));  // ❌ BUG
  const end = new Date(Date.UTC(year, month, day + 1));  // ❌ BUG
  return { start, end };
};
```

**Fixed Code:**
```typescript
const getPhilippinesDateRange = (): { start: Date; end: Date } => {
  const todayStr = getPhilippinesDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return { start, end };
};
```

**Why This Fix Works:**
- Uses the same `getPhilippinesDateString()` function that's used for insertion
- Ensures query date range matches insertion date format
- Eliminates UTC vs local timezone confusion
- Simpler and more maintainable code

### Step 3: Rebuild Backend
```bash
cd backend
npm run build
```

### Step 4: Restart Backend Server
```bash
# If using PM2
pm2 restart v2_attendance-api

# If using development server
# Stop current server (Ctrl+C)
# Restart with:
npm run dev
```

### Step 5: Configure for Mobile Testing
Follow the `MOBILE_QR_SCANNER_TESTING_GUIDE.md` to:
1. Find PC's local IP address
2. Configure backend to accept external connections (HOST=0.0.0.0)
3. Configure frontend to accept external connections
4. Set frontend API URL to use PC's IP address
5. Configure Windows Firewall if needed

### Step 6: Test Scenarios

#### Test Case 1: Clock In
1. Open QR scanner on phone: `http://YOUR_PC_IP:3000/branch/qr-scanner`
2. Scan employee QR code (employee with no active clock-in today)
3. **Expected Result**: Message shows "timed in"
4. **Verify**: Check database - new attendance record created with check_in time

#### Test Case 2: Clock Out
1. Scan same employee QR code again (after clock-in)
2. **Expected Result**: Message shows "timed out"
3. **Verify**: Check database - existing record updated with check_out time

#### Test Case 3: Clock In After Clock Out
1. Scan same employee QR code again (after clock-out)
2. **Expected Result**: Message shows "timed in" (new shift)
3. **Verify**: Check database - new attendance record created

#### Test Case 4: Cross-Day Boundary
1. Test near midnight (Philippines time)
2. Clock in before midnight, clock out after midnight
3. **Expected Result**: Correct date handling for both records

#### Test Case 5: Transfer Scenario
1. Employee assigned to Branch A
2. Scan at Branch B
3. **Expected Result**: Message shows "timed in & transferred from A to B"
4. **Verify**: Employee branch_code updated in database

### Step 7: Verification Checklist
- [ ] Clock in shows "timed in"
- [ ] Clock out shows "timed out"
- [ ] No "timed in" when should be "timed out"
- [ ] Database records have correct dates
- [ ] Transfer scenarios work correctly
- [ ] Cross-day boundary handling works
- [ ] No console errors in frontend
- [ ] No backend errors in logs

### Step 8: Rollback Plan (If Issues Occur)
```bash
# Restore backup
cp backend/src/controllers/attendance.controller.ts.backup backend/src/controllers/attendance.controller.ts

# Rebuild
cd backend
npm run build

# Restart server
pm2 restart v2_attendance-api
```

## Risk Assessment

### Low Risk Factors
- Change is localized to one function
- No database schema changes
- No API interface changes
- No breaking changes to other code
- Easy to rollback

### Potential Issues
1. **Date parsing error**: If `getPhilippinesDateString()` returns unexpected format
   - **Mitigation**: Function is already used elsewhere, format is stable
   
2. **Timezone edge cases**: Near midnight boundaries
   - **Mitigation**: Test cross-day scenarios

3. **Existing data**: No impact on existing data, only affects new queries

## Success Criteria
- QR scanner displays correct "timed in" / "timed out" messages
- No regression in other attendance functionality
- Clock in/out operations work correctly across timezone boundaries
- Transfer scenarios continue to work as expected

## Post-Implementation Tasks
1. Monitor logs for any date-related errors
2. Verify attendance records are created/updated correctly
3. Test with multiple employees across different branches
4. Update documentation if needed
5. Consider adding automated tests for date range logic

## Estimated Time
- Implementation: 5 minutes
- Testing: 15-30 minutes
- Total: 20-35 minutes

## Notes
- This fix aligns the query logic with the insertion logic
- Both now use the same Philippines date string approach
- The fix is simpler and more maintainable than the current implementation
- No performance impact expected
