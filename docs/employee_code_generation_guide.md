# Employee Code Auto-Generation Guide

This document explains how the employee code is automatically generated when adding a new employee in the system.

## Overview

The `employee_code` is a unique identifier for every employee. While it can be manually entered, the system provides an auto-generation feature based on the selected **Position** to maintain consistency and organization.

## How it Works

When a Super Admin adds a new employee through the **Employees** module:
1. The admin selects a **Position** (Worker, Admin, Engineer, or Developer).
2. The system sends a request to the backend API (`api/get_next_employee_code.php`).
3. The backend scans the database for the highest existing code for that specific position category.
4. It increments the number by 1 and returns the new code to the form automatically.

## Employee Code Formats by Position

The system uses specific prefixes and formats depending on the position:

| Position | Format | Example | Description |
| :--- | :--- | :--- | :--- |
| **Worker** | `E####` | `E0001`, `E0123` | Starts with 'E' followed by a 4-digit sequence. |
| **Admin** | `ADMIN-YYYY-####` | `ADMIN-2026-0001` | Prefix 'ADMIN', current year, and a 4-digit sequence. |
| **Engineer** | `ENG-YYYY-####` | `ENG-2026-0005` | Prefix 'ENG', current year, and a 4-digit sequence. |
| **Developer** | `DEV-YYYY-####` | `DEV-2026-0002` | Prefix 'DEV', current year, and a 4-digit sequence. |

### Technical Details

- **Yearly Reset (for Admin/Engineer/Developer):** The sequence number for these positions is tracked per year. For example, the first Admin added in 2027 will start again at `ADMIN-2027-0001`.
- **Worker Codes:** These are continuous and do not include the year in the prefix.
- **Manual Override:** If a position is selected that doesn't support auto-generation (like "Super Admin"), the field remains empty for manual input. Even for auto-generated codes, the admin can still manually edit the code if necessary before saving.

## Implementation Files
- **Frontend Logic:** `@/c:/wamp64/www/main/employee/employees.php` (Javascript at the bottom of the file handles the auto-fill).
- **Backend API:** `@/c:/wamp64/www/main/employee/api/get_next_employee_code.php` (Contains the SQL logic for finding the next number).
