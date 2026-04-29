# Branch QR Scanner Sync and Table Insertion Plan

**Target page:** `frontend/src/app/branch/qr-scanner/page.tsx`  
**Related frontend:** `frontend/src/app/dashboard/attendance/page.tsx`  
**Related backend:** `backend/src/controllers/attendance.controller.ts`  
**Date:** 2026-04-29

## Objective

Ensure every QR scan is:
1. processed exactly once,
2. synced to UI and downstream pages quickly,
3. inserted/updated in the correct database table/fields,
4. traceable for audit and debugging.

## Current Flow (Observed)

1. Branch scanner calls `attendanceApi.clock({ qrCodeData })` -> `POST /attendance/clock`.
2. Backend `clock` endpoint:
   - decodes employee code,
   - finds employee,
   - checks active shift for PH date range,
   - either updates existing row (clock-out) or inserts new row (clock-in),
   - emits websocket attendance update,
   - logs activity.
3. Frontend shows toast + emits `scan:success`.

## Cross-Page Sync Target (Branch Scanner <-> Dashboard Attendance)

Goal: when a scan succeeds in `branch/qr-scanner`, `dashboard/attendance` should reflect it in near real time without manual reload.

Required sync behavior:
1. Backend persists attendance row update/insert first.
2. Backend emits canonical websocket event (`attendance:update`) with employee/branch/action/record id.
3. `dashboard/attendance` receives event and invalidates/refetches:
   - `['branch-employees', selectedBranch]`
   - `['today-attendance-all']`
4. Branch scanner also refetches current-present list for the same branch.
5. Fallback polling runs when socket is disconnected.

## Table-Level Data Mapping (Expected)

### 1) `attendance` table
- **Clock-in path** inserts:
  - `employee_id`
  - `date` (PH date)
  - `check_in`
  - `status` (`present`/`late`)
  - `branch_code`
  - `notes`
- **Clock-out path** updates:
  - `check_out`
  - `updated_at`

### 2) `employees` table
- Read-only in branch QR `/clock` flow (lookup by `employee_code`).
- No transfer logic in this page flow.

### 3) `activity_logs` table
- `logScan` / `logUpdate` entries should include:
  - action metadata (`qr_scan`)
  - entity type `ATTENDANCE`
  - branch and employee references for traceability.

## High-Risk Issues Found

## P0-A: Branch code fallback can write wrong value

In `clock` insert path, branch fallback is:
- `adminBranchCode || employee.branchName || null`

Risk:
- `attendance.branch_code` expects code (`A`, `B`, etc.), but fallback may write `branchName` text.
- This causes data mismatch in branch filters, reporting, and realtime rooms.

Fix:
- Always resolve branch code in this order:
  1. authenticated branch user/admin `branch_code`
  2. `employee.branchCode`
  3. lookup via `employee.branchId -> branches.branch_code`
  4. reject request if still missing (do not insert ambiguous branch).

## P0-B: Present list in branch scanner is not synced to backend

`presentEmployees` state is shown in UI but has no fetch/subscription update path.

Impact:
- Branch scanner can show stale/empty "View Present" while scans succeed.

Fix:
- Add query to fetch present employees for current branch.
- Refetch after successful scan and on websocket attendance updates.
- Optional polling every 15-30s as fallback if socket disconnects.

## P0-C: No idempotency guard for duplicate scan submissions

Frontend cooldown + `lastScan` reduces duplicates, but does not guarantee server-side idempotency.

Impact:
- Rapid duplicate submissions can create unintended extra records in race conditions.

Fix:
- Add backend dedupe window (e.g., 2-3 seconds) per `employee_id + action`.
- Or enforce transaction-level lock on active record check + insert/update sequence.

## P0-D: Mixed date handling patterns across endpoints

Controller uses both raw SQL date string insertion and Prisma date objects in other paths.

Impact:
- Increased chance of date drift bugs and inconsistent daily grouping.

Fix:
- Standardize one PH-timezone-safe date strategy for all attendance writes.
- Reuse a single date utility for all create/update/find operations.

## P0-E: Event contract mismatch risk between pages

`branch/qr-scanner` emits `scan:success` client event, while `dashboard/attendance` listens for `attendance:update` from backend socket channel.

Impact:
- If backend event payloads are incomplete/inconsistent, dashboard cards/tables can lag or misrender.
- Scanner and dashboard may appear out-of-sync even when DB insert succeeded.

Fix:
- Define one canonical websocket payload contract from backend, e.g.:
  - `event`: `attendance:update`
  - `attendanceId`
  - `employeeId`
  - `employeeCode`
  - `employeeName`
  - `branchCode`
  - `action` (`clock_in` | `clock_out` | `mark_absent`)
  - `status`
  - `timestamp`
- Use backend event as single source-of-truth for both pages.
- Keep `scan:success` optional for local scanner UX only.

## P0-F: No guaranteed fallback sync when websocket drops

Dashboard currently relies heavily on socket events + manual refetch in mutations.

Impact:
- If branch device scanner submits successfully while dashboard socket is disconnected, dashboard data can stay stale.

Fix:
- Add conditional polling in `dashboard/attendance`:
  - poll `branch-employees` and `today-attendance-all` every 15-30s when disconnected,
  - pause polling when socket reconnects.
- Show connection/sync badge so operator can trust screen state.

## P1 Improvements

1. **Persist scan events for reconciliation**
   - Add `scan_events` table (or equivalent) with raw payload, parse result, request id, status.
   - Helps reconcile "scan accepted but attendance row missing" incidents.

2. **Return stronger API payload**
   - Include `attendance.id`, `branch_code`, `date`, `action`, and server timestamp in response.
   - Frontend can immediately verify successful insertion target.

3. **Frontend sync status**
   - Add "Syncing / Synced / Failed" indicator on branch scanner.
   - Retry button for failed submissions.

4. **Server-side validation**
   - Verify scanned employee belongs to authorized branch policy (if required by rules).
   - Return explicit conflict errors with machine-readable code.

## P2 Hardening

1. Add database-level index coverage:
   - `(employee_id, date, check_out)` for active shift lookup.
   - `(branch_code, date)` for branch-day reporting.

2. Add structured logs for clock pipeline:
   - request id
   - employee id/code
   - branch code
   - action decided
   - insert/update row id

3. Add integration tests for branch QR workflow.

## Recommended Implementation Steps

1. Fix `branch_code` fallback to always use code, never name.
2. Add branch-present query + realtime refetch in branch scanner UI.
3. Add backend idempotency/race protection for duplicate scans.
4. Unify date/timezone handling across all attendance write paths.
5. Standardize websocket event payload and dashboard/scanner sync contract.
6. Add socket-disconnect polling fallback for dashboard + scanner present-list view.
7. Add integration tests and run end-to-end validation.

## QA Validation Checklist

1. Scan valid employee at branch B -> `attendance.branch_code = 'B'` (not branch name).
2. Double-scan within 2 seconds -> no unintended duplicate active row.
3. Clock-in then clock-out -> same attendance row updated with `check_out`.
4. "View Present" list updates within expected SLA after each scan.
5. `dashboard/attendance` updates worker status within SLA after scanner scan success.
6. Disconnect dashboard socket, scan from branch device, reconnect -> data converges correctly.
7. Attendance audit page reflects new records after sync cycle/manual refresh.
8. Activity logs contain scan trace with employee + branch + attendance id.

## Suggested SQL Verification Snippets

```sql
-- Latest attendance rows for today
SELECT id, employee_id, branch_code, date, check_in, check_out, status, created_at, updated_at
FROM attendance
WHERE date = CURDATE()
ORDER BY id DESC
LIMIT 50;
```

```sql
-- Detect possible bad branch values (name accidentally saved to branch_code)
SELECT DISTINCT branch_code
FROM attendance
WHERE branch_code IS NOT NULL
  AND branch_code NOT IN ('A','B','C','D','E','F','H');
```

```sql
-- Check duplicate open shifts per employee for today
SELECT employee_id, COUNT(*) AS open_shifts
FROM attendance
WHERE date = CURDATE()
  AND check_in IS NOT NULL
  AND check_out IS NULL
GROUP BY employee_id
HAVING COUNT(*) > 1;
```
