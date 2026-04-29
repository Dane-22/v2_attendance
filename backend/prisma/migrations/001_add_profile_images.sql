-- Migration 001: Add profile image support to all user types
-- Run this migration first

-- Add profileImage column to admins table
ALTER TABLE admins ADD COLUMN profileImage VARCHAR(255) DEFAULT NULL;

-- Add profileImage column to branch_users table
ALTER TABLE branch_users ADD COLUMN profileImage VARCHAR(255) DEFAULT NULL;

-- Ensure all user tables have proper indexes for profileImage
CREATE INDEX idx_employee_profile_image ON employees(profileImage);
CREATE INDEX idx_admin_profile_image ON admins(profileImage);
CREATE INDEX idx_branch_user_profile_image ON branch_users(profileImage);

-- Add comment to describe the profileImage field
ALTER TABLE employees MODIFY COLUMN profileImage VARCHAR(255) COMMENT 'Path to profile image file in assets/profile-images/employees/';
ALTER TABLE admins MODIFY COLUMN profileImage VARCHAR(255) COMMENT 'Path to profile image file in assets/profile-images/admins/';
ALTER TABLE branch_users MODIFY COLUMN profileImage VARCHAR(255) COMMENT 'Path to profile image file in assets/profile-images/branch_users/';
