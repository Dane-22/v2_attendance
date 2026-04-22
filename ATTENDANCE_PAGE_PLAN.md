# /dashboard/attendance Implementation Plan

## Goal
Make the attendance dashboard fully functional so that when a branch is selected, it displays all employees from that branch in a table with proper filtering by status.

## Confirmed Decisions

| # | Decision | Choice |
|---|----------|-------|
| 1 | Branch matching | Add `employees.branch_code` column, exact match (Option 1) |
| 2 | `branch_code` source of truth | `branch_code` for logic, `branch_name` for display only |
| 3 | Backfill rule | Match `branch_name` → `branches` table, fallback to manual mapping |
| 4 | Available tab | Includes: never clocked in + completed shifts |
| 5 | Present tab | Active clock-in only (timeIn && !timeOut) |
| 6 | Absent tab | No attendance record at all for today |
| 7 | Summary sort | Completed → Present → Absent/Available |
| 8 | Stats cards scope | Based on currently filtered list |
| 9 | Absent cutoff | 9:00 AM PH time |
| 10 | Auto-absent trigger | Manual "Mark Absentees" button (per-branch), later upgrade to cron |
| 11 | Auto-absent behavior | Insert absent row if no record by 9:00 AM |
| 12 | Late clock-in after absent | Update existing absent row, set status='late' |
| 13 | Completed status | Computed in UI only (check_in && check_out), NOT stored in DB |
| 14 | Only mark absent if | No attendance record at all (completed employees are safe) |
| 15 | Employee form branch | Branch name dropdown, saves branch_code internally |

---

## Phase 1: Schema Changes & Backend Data Flow

### Task 1.1: Add `employees.branch_code` Column
- [ ] Add `branch_code` column to `employees` table (VARCHAR(10), nullable)
- [ ] Update Prisma schema to include `branchCode` field on Employee model
- [ ] Run Prisma migration

### Task 1.2: Backfill Existing Employees
- [ ] Write migration script: match `employees.branch_name` → `branches.branch_name` → `branches.branch_code`
- [ ] Fallback: manual mapping dictionary for name mismatches
- [ ] Validate: list employees where `branch_name` is not null but `branch_code` is still null

### Task 1.3: Update Branch Employees Endpoint
- [ ] Change `branch.controller.ts:getBranchEmployees` to use exact `branch_code` match instead of `contains: branchCode` on `branchName`
- [ ] Verify today's attendance is still attached to each employee

### Task 1.4: Review Date Handling
- [ ] Confirm Philippines timezone is being used correctly
- [ ] Verify attendance records match today's date in PH timezone

---

## Phase 2: Auto-Absent Endpoint

### Task 2.1: Create Mark Absentees Endpoint
- [ ] `POST /api/attendance/mark-absent` with body `{ branch_code }`
- [ ] Only runs if current PH time >= 9:00 AM (return error otherwise)
- [ ] Find all Active employees with matching `branch_code`
- [ ] For each employee with NO attendance record today, insert row: `status='absent'`, `check_in=NULL`, `check_out=NULL`, `branch_code=employee.branch_code`
- [ ] Skip employees who already have any attendance record (including completed)
- [ ] Return count of newly marked absentees

### Task 2.2: Update Clock-In Logic for Absent Override
- [ ] In `performClockIn()`, check if employee has an existing absent row for today
- [ ] If yes: **update** that row (set `check_in`, update `status` via `determineStatus()`)
- [ ] If no: create new row as usual

---

## Phase 3: Frontend Filter Tab Logic Fixes

### Task 3.1: Fix "Available" Tab Logic
**Required Logic**:
```typescript
// Available: no time in yet OR completed shift (has both timeIn and timeOut)
return (emp.timeIn === null && emp.timeOut === null) || 
       (emp.timeIn !== null && emp.timeOut !== null);
```
- [ ] Update filter logic in `filteredEmployees`

### Task 3.2: Fix "Summary" Tab Sort Order
**Required**: Completed → Present → Absent/Available
```typescript
const getPriority = (emp) => {
  if (emp.timeIn !== null && emp.timeOut !== null) return 0; // Completed first
  if (emp.timeIn !== null && emp.timeOut === null) return 1; // Present second
  return 2; // Absent/Available last
};
```
- [ ] Update sort priority in Summary tab

### Task 3.3: Fix "Absent" Tab Logic
**Required**: Show employees with NO attendance record for today
```typescript
// Absent: no time in and no time out (no attendance record)
return emp.timeIn === null && emp.timeOut === null;
```
- [ ] Update Absent filter

### Task 3.4: Fix "Present" Tab Logic
**Required**: Only employees with active clock-in (timeIn && !timeOut)
```typescript
// Present: has time in but no time out (active shift only)
return emp.timeIn !== null && emp.timeOut === null;
```
- [ ] Verify Present tab only shows active shifts

---

## Phase 4: UI/UX Improvements

### Task 4.1: Status Badges
- [ ] Completed status shows blue badge
- [ ] Present status shows green badge  
- [ ] Available status shows yellow badge
- [ ] Absent status shows red badge

### Task 4.2: Stats Cards (based on currently filtered list)
- [ ] Available count: filtered employees with no timeIn OR completed
- [ ] Present count: filtered employees with active clock-in
- [ ] Absent count: filtered employees with no attendance record
- [ ] Total Workers: all filtered employees

### Task 4.3: Mark Absentees Button
- [ ] Add button on attendance page (near filter tabs or stats)
- [ ] Enabled only when: branch is selected AND current PH time >= 9:00 AM
- [ ] Calls `POST /api/attendance/mark-absent` with selected branch_code
- [ ] On success: refetch branch employees to update UI
- [ ] Show count of newly marked absentees in success message

### Task 4.4: Employee Table Columns
- [ ] # (index)
- [ ] Employee (name, avatar, department)
- [ ] Time In
- [ ] Time Out
- [ ] Total Hours
- [ ] Remarks (only on Summary tab - shows status badge)
- [ ] Actions (Time In/Time Out buttons)

---

## Phase 5: Actions Verification

### Task 5.1: Time In Button
- [ ] Shows for employees with no active clock-in (Available + Completed)
- [ ] Calls `clockInMutation.mutate({ employeeId, branchCode })`
- [ ] Disabled while mutation is pending
- [ ] Refetches employees after success
- [ ] If employee was auto-marked absent, backend updates that row instead of creating new

### Task 5.2: Time Out Button
- [ ] Shows for employees with active clock-in (timeIn && !timeOut)
- [ ] Calls `clockOutMutation.mutate(employeeId)`
- [ ] Disabled while mutation is pending
- [ ] Refetches employees after success

### Task 5.3: Re-Clock In for Completed
- [ ] Completed employees (timeIn && timeOut) show Time In button
- [ ] Allows multiple shifts per day

---

## Phase 6: Employee Form Update

### Task 6.1: Branch Selection in Employee Form
- [ ] Replace free-text `branch_name` input with dropdown
- [ ] Dropdown populated from `branches` table (or existing branch mapping)
- [ ] Display: branch name (e.g., "Sto. Rosario")
- [ ] Saved value: branch code (e.g., "A")
- [ ] Stores `branch_code` in `employees.branch_code`
- [ ] Optionally auto-fill `branch_name` from code mapping

## Phase 7: Edge Cases

### Task 7.1: Empty States
- [ ] Show "No employees found" when branch has no employees
- [ ] Show "Select a branch" prompt when no branch selected

### Task 7.2: Loading States
- [ ] Show loading spinner while fetching branches
- [ ] Show loading spinner while fetching employees

### Task 7.3: Search
- [ ] Search filters within current tab results
- [ ] Clear search when switching branches

---

## Implementation Order

1. **Phase 1** - Schema changes (add `branch_code`, backfill, update Prisma)
2. **Phase 2** - Auto-absent endpoint + clock-in absent override
3. **Phase 3** - Frontend filter tab logic fixes (most critical for UI)
4. **Phase 5** - Verify actions work correctly
5. **Phase 4** - UI polish (badges, stats, Mark Absentees button)
6. **Phase 6** - Employee form branch dropdown
7. **Phase 7** - Handle edge cases

---

## Testing Checklist

- [ ] Select branch A → see only branch A employees (exact `branch_code` match)
- [ ] Available tab shows employees without timeIn + completed shifts
- [ ] Present tab shows only employees with active clock-in (NO completed)
- [ ] Absent tab shows only employees with no attendance record
- [ ] Summary tab shows all, sorted: Completed → Present → Others
- [ ] Time In button clocks in employee
- [ ] Time Out button clocks out employee
- [ ] After clock-in/out, table refreshes automatically
- [ ] Stats cards update based on filtered list
- [ ] Search filters the displayed employees
- [ ] Mark Absentees button works (only after 9:00 AM, per-branch)
- [ ] Employee clocked in after auto-absent → absent row updated to late
- [ ] Employee form saves branch_code from branch name dropdown
