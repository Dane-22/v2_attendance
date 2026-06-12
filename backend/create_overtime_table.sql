-- Create overtime_requests table
CREATE TABLE IF NOT EXISTS `overtime_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `requested_by_admin_id` INT NOT NULL,
  `request_date` DATE NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `requested_hours` DECIMAL(5, 2) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'APPLIED_TO_PAYROLL') DEFAULT 'PENDING',
  `review_note` TEXT,
  `reviewed_by_admin_id` INT,
  `reviewed_at` TIMESTAMP NULL,
  `payroll_record_id` INT,
  `applied_to_payroll_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX `idx_overtime_employee` (`employee_id`),
  INDEX `idx_overtime_status` (`status`),
  INDEX `idx_overtime_date` (`request_date`),
  INDEX `idx_overtime_employee_date_status` (`employee_id`, `request_date`, `status`),
  INDEX `idx_overtime_payroll_record` (`payroll_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Foreign key constraints removed due to MySQL configuration issues.
-- The application will work correctly without them - Prisma handles relationships at the application level.
