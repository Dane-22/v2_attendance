# Branch Transfer Behavior in select_employee.php

## Scenario
- **Selected Project:** Sto. Rosario
- **Employee Current Assignment:** BCDA - CCA
- **Action:** Clock in at Sto. Rosario

## Question
**Is the employee automatically transferred to Sto. Rosario when clocking in?**

## Answer: **YES** ✅

The system automatically transfers the employee to the selected project/branch when they clock in.

---

## How It Works

### 1. Auto-Transfer Logic (`clock_functions.php` lines 79-128)

When `performClockIn()` is called, the system performs the following:

```php
// 1. Validate the selected branch
$targetBranchId = null;
$targetBranchName = null;
$branchResolveStmt = mysqli_prepare($db, "SELECT id, branch_name FROM branches WHERE branch_name = ? AND is_active = 1 LIMIT 1");
```

### 2. Check Current Assignment (lines 99-112)

```php
// Get employee's current branch assignment
$currentAssignedBranchId = null;
$currentAssignedBranchName = null;
$assignedStmt = mysqli_prepare($db, "SELECT e.branch_id, b.branch_name FROM employees e LEFT JOIN branches b ON b.id = e.branch_id WHERE e.id = ? LIMIT 1");
```

### 3. Auto-Transfer If Different (lines 114-128)

```php
$didAutoTransfer = false;
if ($currentAssignedBranchId === null || (int)$currentAssignedBranchId !== (int)$targetBranchId) {
    $hasUpdatedAt = employeesHasColumn($db, 'updated_at');
    $updateEmpSql = $hasUpdatedAt
        ? "UPDATE employees SET branch_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? LIMIT 1"
        : "UPDATE employees SET branch_id = ? WHERE id = ? LIMIT 1";
    $updateEmpStmt = mysqli_prepare($db, $updateEmpSql);
    if ($updateEmpStmt) {
        mysqli_stmt_bind_param($updateEmpStmt, 'ii', $targetBranchId, $employeeId);
        if (mysqli_stmt_execute($updateEmpStmt)) {
            $didAutoTransfer = (mysqli_stmt_affected_rows($updateEmpStmt) > 0);
        }
        mysqli_stmt_close($updateEmpStmt);
    }
}
```

---

## What Happens in Your Scenario

| Step | Action | Result |
|------|--------|--------|
| 1 | User selects "Sto. Rosario" as deployment project | Branch is set in UI |
| 2 | User searches for employee assigned to "BCDA - CCA" | Employee appears in list (search ignores current branch) |
| 3 | User clicks "Time In" for the employee | `performClockIn()` is called with `branchName = 'Sto. Rosario'` |
| 4 | System checks employee's current branch | Finds `branch_id` pointing to "BCDA - CCA" |
| 5 | System compares branches | Sto. Rosario ≠ BCDA - CCA → **Transfer needed** |
| 6 | System executes UPDATE | `UPDATE employees SET branch_id = [Sto. Rosario ID] WHERE id = [Employee ID]` |
| 7 | Transfer complete | Employee is now permanently assigned to Sto. Rosario |

---

## Important Notes

### Search Behavior
- When searching for employees, the system **ignores** the current branch filter
- You can search and find employees from ANY branch
- This is intentional - allows deployment to different projects

### Transfer is Permanent
- The auto-transfer updates the `employees.branch_id` field in the database
- This is a **permanent** assignment change, not just for today's attendance
- The employee remains assigned to the new branch until manually changed again

### Clock-Out Behavior
- When clocking out, the system does **NOT** transfer the employee back
- The employee stays at the new branch (Sto. Rosario in this case)

### Return Data
The `performClockIn()` function returns transfer information:
```php
return [
    'success' => true,
    'message' => 'Clocked in successfully',
    'time_in' => $timeIn,
    'shift_id' => $existingId,
    'auto_transferred' => $didAutoTransfer,  // true if transfer occurred
    'from_branch' => $currentAssignedBranchName,  // "BCDA - CCA"
    'to_branch' => $targetBranchName             // "Sto. Rosario"
];
```

---

## Summary

**YES** - When you select Sto. Rosario, search for an employee assigned to BCDA - CCA, and clock them in at Sto. Rosario:

1. ✅ The employee is **automatically transferred** to Sto. Rosario
2. ✅ The transfer is **permanent** (updates their branch assignment in the database)
3. ✅ The employee will appear under Sto. Rosario in future attendance views
4. ✅ This enables flexible deployment of workers across different projects
