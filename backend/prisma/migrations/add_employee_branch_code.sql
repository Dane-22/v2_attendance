-- Migration: Add branch_code column to employees table
-- Run this manually against your database

ALTER TABLE `employees` ADD COLUMN `branch_code` VARCHAR(10) DEFAULT NULL;
CREATE INDEX `idx_employee_branch_code` ON `employees`(`branch_code`);

-- Backfill: Derive branch_code from branches table by matching branch_name
UPDATE `employees` e
INNER JOIN `branches` b ON e.branch_name = b.branch_name
SET e.branch_code = b.branch_code
WHERE e.branch_name IS NOT NULL;

-- Fallback: Manual mapping for known branch names that don't match branches table
-- Uncomment and adjust if needed after checking for unmatched records:
-- UPDATE employees SET branch_code = 'A' WHERE branch_name = 'Sto. Rosario' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'B' WHERE branch_name = 'BCDA' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'C' WHERE branch_name = 'Sundara' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'D' WHERE branch_name = 'Panicsican' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'E' WHERE branch_name = 'Main Office' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'F' WHERE branch_name = 'Capitol' AND branch_code IS NULL;
-- UPDATE employees SET branch_code = 'H' WHERE branch_name = 'Testing Branch' AND branch_code IS NULL;

-- Validation: Check employees with branch_name but no branch_code (need manual fix)
-- SELECT id, employee_code, first_name, last_name, branch_name FROM employees WHERE branch_name IS NOT NULL AND branch_code IS NULL;
