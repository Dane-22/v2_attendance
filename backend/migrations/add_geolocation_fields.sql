-- Migration script to add geolocation fields to branches and attendance tables
-- Run this on test database first, then production after approval

-- Add location fields to branches table
ALTER TABLE branches 
ADD COLUMN latitude DECIMAL(10, 8) NULL COMMENT 'Branch GPS latitude coordinate',
ADD COLUMN longitude DECIMAL(11, 8) NULL COMMENT 'Branch GPS longitude coordinate',
ADD COLUMN location_radius_meters INT DEFAULT 500 COMMENT 'Allowed radius in meters for valid scans';

-- Add index for location queries on branches
ALTER TABLE branches ADD INDEX idx_branch_location (latitude, longitude);

-- Add scan location fields to attendance table
ALTER TABLE attendance 
ADD COLUMN scan_latitude DECIMAL(10, 8) NULL COMMENT 'Latitude where scan occurred',
ADD COLUMN scan_longitude DECIMAL(11, 8) NULL COMMENT 'Longitude where scan occurred',
ADD COLUMN scan_accuracy_meters DECIMAL(10, 2) NULL COMMENT 'GPS accuracy in meters',
ADD COLUMN location_status ENUM('valid', 'invalid', 'error', 'denied') NULL COMMENT 'Location validation status',
ADD COLUMN location_error_message VARCHAR(255) NULL COMMENT 'Error message if location failed';

-- Add index for location queries on attendance
ALTER TABLE attendance ADD INDEX idx_attendance_location (scan_latitude, scan_longitude);
