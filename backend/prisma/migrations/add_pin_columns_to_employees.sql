-- Migration: Add pin_hash and pin_salt columns to employees table
-- Run this manually against your database

ALTER TABLE `employees` 
ADD COLUMN `pin_hash` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `pin_salt` VARCHAR(255) DEFAULT NULL;
