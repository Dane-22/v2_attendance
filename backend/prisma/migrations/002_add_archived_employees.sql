-- Migration 002: Create archived_employees table for archiving system
-- Run this migration after 001_add_profile_images.sql

-- Create archived_employees table with same structure as employees
CREATE TABLE IF NOT EXISTS archived_employees (
  id INT PRIMARY KEY,
  employeeCode VARCHAR(50) UNIQUE,
  firstName VARCHAR(100),
  middleName VARCHAR(100),
  lastName VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  department VARCHAR(100),
  position VARCHAR(100),
  branchName VARCHAR(100),
  branchCode VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Inactive',
  dailyRate DECIMAL(10, 2),
  performanceAllowance DECIMAL(10, 2),
  hasDeductions BOOLEAN DEFAULT FALSE,
  hasDeduction BOOLEAN DEFAULT FALSE,
  branchId INT,
  defaultBranchId INT,
  profileImage VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  archivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archivedBy VARCHAR(100),
  archiveReason TEXT,
  INDEX idx_archived_employee_code (employeeCode),
  INDEX idx_archived_email (email),
  INDEX idx_archived_branch (branchCode),
  INDEX idx_archived_status (status),
  INDEX idx_archived_date (archivedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
