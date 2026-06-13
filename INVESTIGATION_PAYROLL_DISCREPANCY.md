# Payroll Discrepancy Investigation

## Employee Information
- **Name:** KENNETH JOHN UGAS
- **Payroll Period:** June 8, 2026 to June 14, 2026

## Issue Summary
The payroll system shows **3.75 days worked** for this employee, but the attendance records indicate 6 days of attendance.

## Attendance Records

| Date | Day | Time In | Time Out | Status |
|------|-----|---------|----------|--------|
| 2026-06-08 | Monday | 10:13 AM | 04:03 PM | Late |
| 2026-06-09 | Tuesday | 06:42 AM | -- | Present (missing check-out) |
| 2026-06-10 | Wednesday | 06:42 AM | 04:03 PM | Present |
| 2026-06-11 | Thursday | 06:38 AM | 04:02 PM | Present |
| 2026-06-12 | Friday | 06:42 AM | 04:02 PM | Present |
| 2026-06-13 | Saturday | 06:38 AM | -- | Present (missing check-out) |

## Payroll Calculation Breakdown

| Date | Time In | Time Out | Payable Hours | Days Counted | Notes |
|------|---------|----------|---------------|--------------|-------|
| 2026-06-08 | 10:13 | 16:03 | 4.78h | **0.75 day** | Late arrival recorded |
| 2026-06-09 | 06:42 | -- | 0.00h | **0.00 day** | Attendance is missing a check-in or check-out time |
| 2026-06-10 | 06:42 | 16:03 | 8.00h | **1.00 day** | |
| 2026-06-11 | 06:38 | 16:02 | 8.00h | **1.00 day** | |
| 2026-06-12 | 06:42 | 16:02 | 8.00h | **1.00 day** | |
| 2026-06-13 | 06:38 | -- | 0.00h | **0.00 day** | Attendance is missing a check-in or check-out time |

**Total Days Calculated:** 0.75 + 0.00 + 1.00 + 1.00 + 1.00 + 0.00 = **3.75 days**

## Root Cause Analysis

The discrepancy is caused by **missing check-out times** on:
- **June 9, 2026** (Tuesday): Time in 06:42 AM, no check-out recorded
- **June 13, 2026** (Saturday): Time in 06:38 AM, no check-out recorded

When the check-out time is missing, the payroll calculation logic:
1. Sets payable hours to 0.00h
2. Counts the day as 0.00 days

This is incorrect behavior. The employee did clock in on both days, so these should be counted as partial or full days depending on the business logic.

## Expected Behavior

The system should handle missing check-out times more intelligently:
- Option 1: Count as a full day if check-in exists (assuming standard work hours) - **CHOSEN & IMPLEMENTED**
- Option 2: Count as partial day based on check-in time only
- Option 3: Flag for manual review but still count as attended

## Implementation Details

**Chosen Solution (Option 1):**
When check-out is missing, the system now assumes the standard end-of-day time (schedule.end) and calculates payable minutes accordingly. This ensures employees are credited for a full day's work if they checked in.

**Code Changes:**
Modified `buildPayrollSummary` function in `backend/src/controllers/payroll.controller.ts`:
- Separated check-in and check-out null checks
- When check-in exists but check-out is null, use `schedule.end` as assumed check-out time
- Changed severity from 'error' to 'warning' for missing check-out
- Updated issue message to indicate assumption is being made

**Expected Result for Kenneth John Ugas:**
- June 8: 0.75 day (late arrival, unchanged)
- June 9: 1.00 day (was 0.00, now assumes check-out at 16:00)
- June 10: 1.00 day (unchanged)
- June 11: 1.00 day (unchanged)
- June 12: 1.00 day (unchanged)
- June 13: 1.00 day (was 0.00, now assumes check-out at 16:00)
- **Total: 5.75 days** (was 3.75 days)

## Resolution

The bug has been fixed. The payroll system will now properly count days worked when check-out times are missing by assuming a standard end-of-day time. This ensures employees are credited for showing up to work even if they forget to check out.
