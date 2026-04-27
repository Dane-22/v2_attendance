# PIN Hash and PIN Salt Usage Analysis

## Summary

The `pin_hash` and `pin_salt` fields are **defined in the database schema but NOT actively used** in the application code. They appear to be legacy or planned-but-never-implemented fields for employee PIN-based authentication.

---

## 1. Database Schema Definition

### Migration File
**File:** `backend/prisma/migrations/add_pin_columns_to_employees.sql`

```sql
-- Migration: Add pin_hash and pin_salt columns to employees table
-- Run this manually against your database

ALTER TABLE `employees` 
ADD COLUMN `pin_hash` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `pin_salt` VARCHAR(255) DEFAULT NULL;
```

**Status:** This migration adds the columns to the MySQL database, but they are not populated with data.

---

## 2. Prisma Schema (Commented Out)

**File:** `backend/prisma/schema.prisma` (lines 31-32)

```prisma
model Employee {
  id                   Int       @id @default(autoincrement())
  employeeCode         String?   @unique(map: "employee_code") @map("employee_code") @db.VarChar(50)
  firstName            String?   @map("first_name") @db.VarChar(100)
  middleName           String?   @map("middle_name") @db.VarChar(100)
  lastName             String?   @map("last_name") @db.VarChar(100)
  email                String?   @unique(map: "email") @db.VarChar(100)
  department           String?   @db.VarChar(50)
  position             String?   @db.VarChar(50)
  branchName           String?   @map("branch_name") @db.VarChar(100)
  status               String?   @default("Active") @db.VarChar(20)
  dailyRate            Decimal?  @default(0.00) @map("daily_rate") @db.Decimal(10, 2)
  hasDeductions        Boolean?  @default(false) @map("has_deductions")
  profileImage         String?   @map("profile_image") @db.VarChar(255)
  createdAt            DateTime? @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt            DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamp(0)
  defaultBranchId      Int?      @map("default_branch_id")
  performanceAllowance Decimal?  @default(0.00) @map("performance_allowance") @db.Decimal(10, 2)
  hasDeduction         Boolean?  @default(true) @map("has_deduction")
  branchId             Int?      @map("branch_id")
  branchCode           String?   @map("branch_code") @db.VarChar(10)
  // pinHash              String?   @map("pin_hash") @db.VarChar(255)  <-- COMMENTED OUT
  // pinSalt              String?   @map("pin_salt") @db.VarChar(255)  <-- COMMENTED OUT

  @@index([branchName], map: "idx_employee_branch")
  @@index([branchCode], map: "idx_employee_branch_code")
  @@map("employees")
}
```

**Key Point:** The fields are commented out in the Prisma schema, meaning the Prisma Client does not expose these fields, even though they exist in the database.

---

## 3. Where Are These Fields NOT Used?

### Authentication Controllers
**File:** `backend/src/controllers/auth.controller.ts`
- No PIN authentication for employees
- Only admin login with `username`/`password` using bcrypt
- No reference to `pin_hash` or `pin_salt`

### Employee Controllers
**File:** `backend/src/controllers/employee.controller.ts`
- Employee CRUD operations do not include PIN fields
- Employee selection excludes sensitive fields but PIN is not among them (not present in Prisma client)

### Attendance Controllers
**File:** `backend/src/controllers/attendance.controller.ts`
- QR code-based clock in/out - no PIN verification
- Manual clock in/out by admin - no PIN verification

### Mobile App
**File:** `attendance-mobile/src/screens/Login.tsx`
**File:** `attendance-mobile/src/api/authApi.ts`
- Admin login only with username/password
- No employee PIN login functionality

---

## 4. Current Authentication Methods

| User Type | Authentication Method | Location |
|-----------|---------------------|----------|
| Admin | Username + Password (bcrypt) | `backend/src/controllers/auth.controller.ts` |
| Employee | QR Code Scan | `backend/src/controllers/attendance.controller.ts` |
| Branch Users | Username + Password | `backend/src/controllers/` (implied by `branch_users` table) |

---

## 5. Related Files (No PIN Usage)

| File | Purpose | PIN Usage |
|------|---------|-----------|
| `backend/src/controllers/auth.controller.ts` | Admin authentication | No |
| `backend/src/controllers/employee.controller.ts` | Employee CRUD | No |
| `backend/src/controllers/attendance.controller.ts` | Clock in/out | No (uses QR) |
| `backend/src/controllers/qr.controller.ts` | QR code handling | No |
| `attendance-mobile/src/screens/Login.tsx` | Mobile login | No (admin only) |
| `attendance-mobile/src/api/authApi.ts` | Auth API client | No |

---

## 6. Migration History

**Migrations Directory:** `backend/prisma/migrations/`

1. `add_pin_columns_to_employees.sql` - Adds `pin_hash` and `pin_salt` columns
2. `add_employee_branch_code.sql` - Adds branch code support
3. `create_documents_and_logs_tables.sql` - Creates documents and activity logs tables

---

## 7. Conclusion

- **Database:** Columns `pin_hash` and `pin_salt` exist in the `employees` table
- **Prisma Schema:** Fields are commented out, not available in Prisma Client
- **Application Code:** No logic uses these fields
- **Current Auth:** QR codes for employees, username/password for admins

### Recommendation

If PIN-based employee authentication is not planned, consider:
1. Removing the unused columns via a migration
2. Or, if PIN auth is planned, uncomment and implement the fields properly

---

*Generated: April 27, 2026*
