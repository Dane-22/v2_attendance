# Payroll System Documentation

## Overview

The payroll system is a weekly payroll calculation engine that computes employee compensation based on attendance records. It integrates with the attendance system to automatically calculate payable days, overtime, deductions, and net pay.

## Payroll Cycle

- **Frequency**: Weekly (Monday to Sunday)
- **Schedules**: Role-based work hours with 1-hour lunch break (12:00 PM - 1:00 PM)
  - **Engineers & Workers**: 7:00 AM - 4:00 PM (8 hours = 480 minutes)
  - **Developers, Admins & Super Admins**: 8:00 AM - 5:00 PM (9 hours = 540 minutes)

## Core Computation Logic

### 1. Attendance Processing

The system processes attendance records for each day within the selected payroll week:

```typescript
const SCHEDULE = {
  morningStart: 7 * 60,    // 7:00 AM = 420 minutes
  lunchStart: 12 * 60,     // 12:00 PM = 720 minutes
  lunchEnd: 13 * 60,       // 1:00 PM = 780 minutes
  end: 16 * 60,            // 4:00 PM = 960 minutes
  paidDayMinutes: 8 * 60,  // 480 minutes
};
```

### 2. Payable Time Calculation

For each attendance record, the system calculates payable minutes by:

1. **Morning session**: Time between `check_in` and lunch start (12:00 PM)
2. **Afternoon session**: Time between lunch end (1:00 PM) and `check_out`
3. **Lunch break**: Automatically excluded (not counted as payable time)

```typescript
dayPayableMinutes =
  overlapMinutes(checkIn, checkOut, 420, 720) +   // Morning: 7AM-12PM
  overlapMinutes(checkIn, checkOut, 780, 960);   // Afternoon: 1PM-4PM
```

### 3. Day Fraction Calculation

Payable minutes are converted to day fractions:

| Payable Minutes | Day Fraction |
|-----------------|--------------|
| 0 - 120 minutes | 0.25 day     |
| 121 - 240 minutes | 0.5 day    |
| 241 - 360 minutes | 0.75 day   |
| 361+ minutes    | 1.0 day      |

### 4. Payroll Formula

```
Basic Pay = Payable Days × Daily Rate

Hourly Rate = Daily Rate ÷ 8

Overtime Amount = Approved Overtime Hours × (Hourly Rate × 1.25)

Gross Pay = Basic Pay + Overtime Amount + Performance Allowance

Total Deductions = SSS + PhilHealth + Pag-IBIG + Cash Advance

Net Pay = Gross Pay - Total Deductions
```

## Government Deductions (Prorated Weekly)

Deductions are prorated based on the week of the month:

| Week of Month | SSS Contribution | PhilHealth | Pag-IBIG |
|---------------|------------------|------------|----------|
| Week 1        | ₱250             | ₱100       | ₱50      |
| Week 2        | ₱100             | ₱100       | ₱50      |
| Week 3        | ₱100             | ₱50        | ₱100     |
| Week 4        | ₱0               | ₱0         | ₱0       |

**Note**: Deductions are only applied if the employee has `hasDeductions` or `hasDeduction` flag set to `true`.

## Overtime Calculation

### Overtime Entry
- Overtime is **not automatically detected** by the system
- Admins must manually enter approved overtime hours per employee
- Approved overtime is calculated at **1.25x** the regular hourly rate

### Overtime Approval Workflow
1. Admin reviews employee timesheets and determines overtime hours
2. Admin manually enters approved overtime hours in the payroll record
3. Approved overtime is calculated at **1.25x** the regular hourly rate

## Payroll States

| State      | Description                                         |
|------------|-----------------------------------------------------|
| **Draft**  | Initial state, can be recalculated and modified   |
| **Needs Review** | Has issues that require admin attention       |
| **Processed** | Finalized, locked from further modifications     |

## Issue Detection System

The payroll system automatically flags records with issues:

### Error Issues (Blocking)
- `MISSING_DAILY_RATE` - Employee has no daily rate configured
- `INCOMPLETE_ATTENDANCE` - Missing check-in or check-out time
- `ZERO_PAYABLE_TIME` - Invalid time range for payroll computation

### Warning Issues (Non-blocking)
- `NO_ATTENDANCE` - No attendance records for the payroll week
- `LATE_ATTENDANCE` - Employee was late (informational only)
- `ZERO_PAYABLE_TIME` - Attendance exists but produced no payable time

## Employee Configuration

The following employee fields affect payroll calculation:

| Field                 | Type    | Description                              |
|-----------------------|---------|------------------------------------------|
| `dailyRate`           | Decimal | Base daily rate in PHP                   |
| `performanceAllowance`| Decimal| Additional allowance per pay period     |
| `hasDeductions`       | Boolean | Whether to apply government deductions   |
| `hasDeduction`        | Boolean | Alternative deduction flag               |

## Database Schema

### PayrollRecord Model

```prisma
model PayrollRecord {
  id                    Int       @id @default(autoincrement())
  employeeId            Int
  branch_code           String
  payroll_week_start    DateTime
  payroll_week_end      DateTime
  week_number           Int
  days_worked           Int?      @default(0)
  daily_rate            Decimal?  @default(0.00)
  basic_pay             Decimal?  @default(0.00)
  overtimeHours         Decimal?  @default(0.00)
  overtime_amount       Decimal?  @default(0.00)
  performance_allowance Decimal?  @default(0.00)
  grossPay              Decimal?  @default(0.00)
  sss_contribution      Decimal?  @default(0.00)
  phic_contribution     Decimal?  @default(0.00)
  hdmf_contribution     Decimal?  @default(0.00)
  cash_advance          Decimal?  @default(0.00)
  total_deductions      Decimal?  @default(0.00)
  netPay                Decimal?  @default(0.00)
  status                payroll_records_status? @default(draft)
  createdAt             DateTime? @default(now())
}
```

## API Endpoints

| Method | Endpoint                           | Description                           |
|--------|------------------------------------|---------------------------------------|
| GET    | `/api/payroll`                     | Get all payroll records (paginated)  |
| GET    | `/api/payroll/me?employeeId={id}`  | Get payroll for specific employee    |
| GET    | `/api/payroll/:id`                 | Get single payroll record with breakdown |
| POST   | `/api/payroll/calculate`           | Calculate payroll for single employee  |
| POST   | `/api/payroll/calculate-weekly`    | Batch calculate for all employees    |
| POST   | `/api/payroll/:id/approve-overtime`| Approve overtime hours                 |
| POST   | `/api/payroll/:id/process`         | Process/finalize payroll record       |

## Frontend Payroll Page

The payroll dashboard (`/dashboard/payroll`) provides:

- **Week Selector**: Choose payroll week range
- **Batch Generation**: Generate payroll for all active employees
- **Status Filters**: View by Draft, Needs Review, or Processed
- **Summary Cards**: Gross payroll, Net payroll, Payable days, Review queue
- **Detailed Breakdown**: Daily attendance with day fractions and issues
- **Payslip Generation**: Download PNG payslips
- **Overtime Approval**: Review and approve detected overtime
- **Payroll Processing**: Finalize draft records

## Payslip Format

Generated payslips include:

**Earnings Section:**
- Payable days
- Daily rate
- Basic pay
- Overtime hours (approved / detected)
- Overtime amount
- Performance allowance
- Gross pay

**Deductions Section:**
- SSS contribution
- PhilHealth contribution
- Pag-IBIG (HDMF) contribution
- Cash advance
- Total deductions
- Net pay (Take home pay)

## Workflow Summary

1. **Admin selects a week** and clicks "Generate weekly payroll"
2. **System calculates** payroll for all active employees
3. **Records are created** in "Draft" status with attendance breakdown
4. **Admin reviews** records flagged with issues
5. **Overtime is approved** on a per-employee basis
6. **Clean records are processed** to lock them from further changes
7. **Payslips are generated** as needed

## Files and References

- **Controller**: `backend/src/controllers/payroll.controller.ts`
- **Frontend Page**: `frontend/src/app/dashboard/payroll/page.tsx`
- **API Routes**: `backend/src/routes/payroll.routes.ts`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Tests**: `tests/payroll.spec.ts`
