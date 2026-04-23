# Codebase Review: Dashboard/Attendance Issue

## Issue Summary
The `dashboard/attendance` page was working yesterday but now returns "No employees found" when selecting "Testing Branch" (branch code 'H'). The database confirms employees exist with `branch_code = 'H'` and `status = 'Active'`, but the API returns an empty array.

**Review Date:** April 23, 2026  
**Issue:** Employees not loading for branch 'H' despite existing in database  
**Status:** Investigation in progress

---

## Review Scope

### Files Reviewed

#### Backend
- `backend/src/controllers/branch.controller.ts` - Branch and employee fetching logic
- `backend/src/routes/branch.routes.ts` - API route definitions
- `backend/src/controllers/attendance.controller.ts` - Attendance operations
- `backend/prisma/schema.prisma` - Database schema definitions
- `backend/.env.production` - Production database configuration

#### Frontend
- `frontend/src/app/dashboard/attendance/page.tsx` - Attendance dashboard component
- `frontend/src/lib/api.ts` - API client configuration
- `frontend/src/hooks/useWebSocket.ts` - WebSocket integration

---

## Findings

### 1. Backend Branch Controller Analysis

**File:** `backend/src/controllers/branch.controller.ts`

**getBranchEmployees Function (lines 72-213):**

```typescript
const employees = await prisma.employee.findMany({
  where: {
    branchCode: branchCode,  // Line 90
    status: 'Active'         // Line 91
  },
  select: {
    id: true,
    employeeCode: true,
    firstName: true,
    lastName: true,
    department: true,
    position: true,
    branchName: true,
    branchCode: true,
  }
});
```

**Observations:**
- Uses Prisma's camelCase `branchCode` field (maps to `branch_code` in database)
- Filters by `status = 'Active'`
- Has extensive console logging for debugging
- Date calculation uses UTC midnight for attendance filtering (line 84-85)

**Potential Issues:**
- ⚠️ **Date/timezone issue:** Line 84-85 uses UTC midnight which might not match Philippines timezone
- ⚠️ **Case sensitivity:** String comparison might be case-sensitive in MySQL

---

### 2. Database Schema Analysis

**File:** `backend/prisma/schema.prisma`

**Employee Model (lines 10-35):**

```prisma
model Employee {
  id                   Int       @id @default(autoincrement())
  employeeCode         String?   @unique @map("employee_code") @db.VarChar(50)
  firstName            String?   @map("first_name") @db.VarChar(100)
  lastName             String?   @map("last_name") @db.VarChar(100)
  branchName           String?   @map("branch_name") @db.VarChar(100)
  status               String?   @default("Active") @db.VarChar(20)
  branchCode           String?   @map("branch_code") @db.VarChar(10)
  
  @@index([branchCode], map: "idx_employee_branch_code")
  @@map("employees")
}
```

**Observations:**
- `branchCode` correctly maps to `branch_code` column
- `status` has default value "Active"
- Index on `branchCode` for query optimization
- All fields are nullable except `id`

**Potential Issues:**
- ⚠️ **Nullable fields:** `branchCode` and `status` can be NULL
- ⚠️ **Index might not be used:** If query doesn't use the exact column name

---

### 3. Frontend Data Fetching Analysis

**File:** `frontend/src/app/dashboard/attendance/page.tsx`

**Employee Query (lines 91-103):**

```typescript
const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees, error: employeesError } = useQuery({
  queryKey: ['branch-employees', selectedBranch],
  queryFn: async () => {
    if (!selectedBranch) return [];
    console.log('[Attendance] Fetching employees for branch:', selectedBranch);
    const response = await branchApi.getEmployees(selectedBranch);
    console.log('[Attendance] API response:', response.data);
    const employees = response.data?.data || [];
    console.log('[Attendance] Parsed employees:', employees.length, 'items');
    return employees;
  },
  enabled: !!selectedBranch
});
```

**Observations:**
- Correctly calls `branchApi.getEmployees(selectedBranch)`
- Has custom logging added for debugging
- Extracts `response.data?.data` correctly
- Only enabled when branch is selected

**API Client (frontend/src/lib/api.ts, lines 264-269):**

```typescript
export const branchApi = {
  getAll: () =>
    api.get<ApiResponse<Branch[]>>('/branches'),
  getEmployees: (branchCode: string) =>
    api.get<ApiResponse<BranchEmployee[]>>(`/branches/${branchCode}/employees`),
};
```

**Observations:**
- Correctly constructs API endpoint URL
- Uses proper TypeScript types
- No issues identified

---

### 4. Database Configuration Analysis

**File:** `backend/.env.production`

```env
DATABASE_URL="mysql://root:JaJr12390786@@localhost:3306/attendance-system"
```

**Observations:**
- Points to `localhost:3306`
- Database name: `attendance-system`
- User: `root`

**Potential Issues:**
- ⚠️ **Localhost reference:** Production server might need remote database connection
- ⚠️ **Database name mismatch:** User showed queries on `attendance-system` but might have different database

---

### 5. Key Discrepancies Identified

### Discrepancy 1: Database Connection
**Issue:** Backend `.env.production` points to `localhost` but the production server is at `72.62.254.60`

**Impact:** The backend might be connecting to a different database instance than the one the user is querying directly.

**Evidence:**
- Production server: `72.62.254.60` (from SSH session)
- Backend DATABASE_URL: `localhost:3306`

**Recommendation:** Update backend `.env.production` to use the correct database host.

---

### Discrepancy 2: Prisma Client Sync
**Issue:** Prisma client might not be synchronized with the database schema

**Impact:** Prisma might be using old schema mappings, causing query failures.

**Evidence:**
- User recently updated employee statuses
- Backend code hasn't been regenerated after schema changes

**Recommendation:** Run `npx prisma generate` on the production server.

---

### Discrepancy 3: Case Sensitivity
**Issue:** String comparison in MySQL might be case-sensitive

**Impact:** Query for `branchCode = 'H'` might not match `branch_code = 'h'` (lowercase).

**Evidence:**
- MySQL default collation might be case-sensitive
- Frontend sends uppercase 'H', but database might have lowercase

**Recommendation:** Verify actual values in database and ensure consistent casing.

---

### Discrepancy 4: Date/Timezone Issue
**Issue:** Backend uses UTC midnight for date comparison

**Impact:** Attendance records might not match due to timezone offset.

**Evidence:**
- Line 84-85 in branch.controller.ts:
```typescript
const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
```

**Recommendation:** Use Philippines timezone for date comparison, similar to attendance controller.

---

### Discrepancy 5: Frontend Code Not Reloaded
**Issue:** Custom logs added to frontend weren't showing in console

**Impact:** Debugging information not available, making it harder to diagnose.

**Evidence:**
- Console showed old log format `Fetched employees: []`
- New logs `[Attendance] API response:` not appearing

**Recommendation:** Ensure frontend dev server is restarted and page is hard-refreshed.

---

## Comparison: Working vs Current State

### What Was Working Yesterday
- Employees appeared when selecting branch
- Attendance data loaded correctly
- WebSocket updates worked

### What's Not Working Now
- API returns empty array for branch 'H'
- Console shows `Fetched employees: []`
- Database has correct data but API doesn't return it

### Potential Causes
1. **Database connection changed** - Backend connecting to wrong database
2. **Prisma client out of sync** - Schema changes not reflected
3. **Code not deployed** - Production server running old code
4. **Environment variables changed** - Different configuration
5. **Database schema changed** - Column names or types modified

---

## Recommended Actions

### Immediate Actions (Priority: High)

1. **Verify Database Connection**
   ```bash
   # On production server, check backend environment
   cat /var/www/version2_attendance/backend/.env.production
   
   # Update DATABASE_URL to correct host if needed
   # Example: mysql://root:password@72.62.254.60:3306/attendance-system
   ```

2. **Regenerate Prisma Client**
   ```bash
   cd /var/www/version2_attendance/backend
   npx prisma generate
   npx prisma db pull
   ```

3. **Restart Backend Server**
   ```bash
   # Stop and restart backend service
   pm2 restart attendance-backend
   # or
   systemctl restart attendance-backend
   ```

4. **Check Backend Logs**
   ```bash
   # Look for "GET BRANCH EMPLOYEES" logs
   tail -f /var/www/version2_attendance/backend/logs/app.log
   ```

### Verification Actions (Priority: Medium)

5. **Direct Database Query Test**
   ```sql
   -- Run on the same database backend connects to
   SELECT COUNT(*) as count
   FROM employees
   WHERE branch_code = 'H' AND status = 'Active';
   ```

6. **Test API Endpoint Directly**
   ```bash
   # Test the API endpoint with curl
   curl -X GET "http://72.62.254.60:5002/api/branches/H/employees" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

7. **Verify Branch Code Case**
   ```sql
   SELECT branch_code, status, COUNT(*)
   FROM employees
   GROUP BY branch_code, status;
   ```

### Long-term Actions (Priority: Low)

8. **Add Environment-Specific Config**
   - Separate development and production environment files
   - Use environment variables for all configuration

9. **Add Database Health Check**
   - Create endpoint to verify database connection
   - Log database connection status on startup

10. **Improve Error Logging**
    - Add more detailed error messages in API responses
    - Log query parameters and results for debugging

---

## Code Quality Observations

### Strengths
- ✅ Good separation of concerns (controllers, routes, services)
- ✅ TypeScript for type safety
- ✅ Proper error handling middleware
- ✅ WebSocket integration for real-time updates
- ✅ Console logging for debugging

### Areas for Improvement
- ⚠️ Hardcoded branch mapping in controller (lines 11-19)
- ⚠️ UTC timezone usage instead of local timezone
- ⚠️ Nullable fields in schema without validation
- ⚠️ No database connection health check
- ⚠️ Environment variables in production file

---

## Testing Recommendations

### Unit Tests Needed
1. Test `getBranchEmployees` with various branch codes
2. Test employee query with different status values
3. Test date calculation for different timezones

### Integration Tests Needed
1. Test full API flow from frontend to database
2. Test WebSocket connection and events
3. Test authentication with different user roles

### End-to-End Tests Needed
1. Test branch selection and employee loading
2. Test manual clock-in/clock-out operations
3. Test real-time updates across multiple users

---

## Monitoring Recommendations

### Add Metrics
- API response times for employee fetching
- Database query execution time
- WebSocket connection count
- Error rates by endpoint

### Add Alerts
- Database connection failures
- API response time > 5 seconds
- Error rate > 5%
- WebSocket disconnection rate > 10%

---

## Conclusion

The issue is most likely caused by **database connection mismatch** or **Prisma client being out of sync**. The code structure is correct, but the runtime environment has changed since yesterday.

**Most Likely Root Cause:** The backend is connecting to a different database instance than the one the user is querying directly via MySQL client.

**Recommended Fix:** Update the backend `.env.production` file to use the correct database host and regenerate the Prisma client.

---

## Next Steps

1. Update backend `.env.production` with correct DATABASE_URL
2. Regenerate Prisma client on production server
3. Restart backend service
4. Test API endpoint directly
5. Verify employees load in frontend
6. Add monitoring to prevent future issues

---

## Appendix

### Relevant Database Queries

```sql
-- Check employee distribution by branch
SELECT branch_code, status, COUNT(*) as count
FROM employees
GROUP BY branch_code, status;

-- Check specific branch employees
SELECT id, employee_code, first_name, last_name, branch_code, status
FROM employees
WHERE branch_code = 'H'
LIMIT 10;

-- Check attendance for today
SELECT a.id, a.employee_id, a.date, a.check_in, a.check_out, a.status
FROM attendance a
WHERE a.date = CURDATE()
LIMIT 10;
```

### API Endpoint Details

**GET /api/branches/:branchCode/employees**

**Request:**
- Headers: `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "avatar": "JD",
      "employeeCode": "E0001",
      "department": "Engineering",
      "position": "Developer",
      "branchName": "Testing Branch",
      "timeIn": "08:30",
      "timeOut": "17:00",
      "totalHours": "8.30",
      "status": "present",
      "attendanceId": 123
    }
  ]
}
```

### Backend Log Patterns to Monitor

```
=== GET BRANCH EMPLOYEES ===
Branch code: H
Today date: 2026-04-23T00:00:00.000Z
Found employees: X
Employee IDs: [1, 2, 3, ...]
Found attendance records: Y
Attendance data: [...]
```

---

**Review Completed By:** Cascade AI  
**Review Date:** April 23, 2026  
**Status:** Findings documented, awaiting implementation of recommended fixes
