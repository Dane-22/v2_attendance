-- Fix attendance table column name to match Prisma schema
-- Check if column exists as employeeId (camelCase) and rename to employee_id (snake_case)

-- First check if the column exists with camelCase
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'attendance' 
  AND COLUMN_NAME = 'employeeId'
);

-- If camelCase exists, rename to snake_case
SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE attendance CHANGE COLUMN employeeId employee_id INT NOT NULL',
  'SELECT "Column employeeId does not exist, checking if employee_id already exists..."'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'attendance' 
AND COLUMN_NAME IN ('employee_id', 'employeeId');
