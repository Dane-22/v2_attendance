-- Migration: Create documents and activity_logs tables
-- Run this manually against your database

-- Create document_type enum as a table constraint
-- Note: MySQL doesn't support CREATE TYPE, so we use ENUM in the table definition

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER NULL,
    `document_type` ENUM('RESUME', 'SSS', 'TIN', 'PHILHEALTH', 'BIRTH_CERTIFICATE', 'PDS', 'COVER_LETTER', 'APPLICATION_LETTER', 'CLEARANCE') NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `original_file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_hash` VARCHAR(64) NULL,
    `is_compressed` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by` INTEGER NOT NULL,
    `uploaded_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_archived` BOOLEAN NOT NULL DEFAULT false,
    `archived_at` TIMESTAMP(0) NULL,
    `archived_by` INTEGER NULL,

    INDEX `idx_document_employee`(`employee_id`),
    INDEX `idx_document_type`(`document_type`),
    INDEX `idx_document_uploaded_at`(`uploaded_at`),
    INDEX `idx_document_is_archived`(`is_archived`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(50) NOT NULL,
    `timestamp` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_id` INTEGER NOT NULL,
    `user_name` VARCHAR(100) NOT NULL,
    `user_role` VARCHAR(50) NOT NULL,
    `action_type` VARCHAR(20) NOT NULL,
    `entity_type` VARCHAR(20) NOT NULL,
    `entity_id` VARCHAR(50) NULL,
    `entity_name` VARCHAR(200) NULL,
    `description` TEXT NOT NULL,
    `details_before` JSON NULL,
    `details_after` JSON NULL,
    `changes` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    `metadata` JSON NULL,
    `branch_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_logs_timestamp`(`timestamp`),
    INDEX `idx_logs_user_id`(`user_id`),
    INDEX `idx_logs_action_type`(`action_type`),
    INDEX `idx_logs_entity_type`(`entity_type`),
    INDEX `idx_logs_status`(`status`),
    INDEX `idx_logs_entity_id`(`entity_id`),
    INDEX `idx_logs_branch_id`(`branch_id`),
    INDEX `idx_logs_timestamp_action`(`timestamp`, `action_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
