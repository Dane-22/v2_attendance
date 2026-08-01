# Final Implementation Plan: Site Allocation Integration

## Goal Description
Integrate the attendance system with the Site Allocation & Planning Grid System using the API contract established by the Site Allocation IDE. 
When a worker scans their QR code, the system will verify their allocation status by calling the new API endpoint before allowing a clock-in.

## Integration Contract Details
Based on the updates from the Site Allocation IDE, the API endpoint will use the following signature:
- **URL**: `GET {SITE_ALLOCATION_API_URL}/api/allocations/verify`
- **Query Params**:
  - `employeeId` (integer, e.g., 43)
  - `branchCode` (string, e.g., "H")
  - `date` (string, e.g., "2026-07-31")
- **Auth**: API Key passed in headers (e.g., `Authorization: Bearer <key>`)

## Proposed Changes

### 1. Configuration (`backend/.env` & `.env.example`)
- Add `SITE_ALLOCATION_API_URL=` (leave blank for now, allows fail-open fallback if not set)
- Add `SITE_ALLOCATION_API_KEY=`

### 2. Services Layer (`backend/src/services/siteAllocation.service.ts`)
- [NEW] Create a new service file for external communication.
- Implement `verifyWorkerAllocation(employeeId: number, branchCode: string, date: string): Promise<boolean>`
- **Logic:**
  1. Check if `SITE_ALLOCATION_API_URL` is configured. If not, log a warning and return `true` (fail-open fallback so production doesn't break).
  2. If configured, make an HTTP request using `axios` or native `fetch`:
     `GET /api/allocations/verify?employeeId=${employeeId}&branchCode=${branchCode}&date=${date}`
  3. Include the API key in the headers.
  4. Return `true` if `response.data.allocated === true`, otherwise `false`.

### 3. Controllers Layer (`backend/src/controllers/attendance.controller.ts`)
- [MODIFY] Inside the `clock` endpoint, locate the logic where we determine if it's a **clock-in** (i.e., `activeRecord` is null).
- Call our new service: 
  `const isAllocated = await siteAllocationService.verifyWorkerAllocation(employee.id, adminBranchCode, getPhilippinesDateString());`
- Note: We use `employee.id` (integer) instead of `employee.employeeCode` based on the new API contract.
- If `!isAllocated`, throw a 403 Forbidden `AppError` with a message like: "Employee is not allocated to this site for today."
- Clock-outs will deliberately bypass this check.

## Verification Plan

### Manual Verification
1. Set the `.env` variables to point to the new Site Allocation endpoint.
2. In the Site Allocation system, ensure Employee 43 is **not** allocated to Branch H for today.
3. Scan Employee 43's QR code at Branch H. Verify it is rejected.
4. Allocate Employee 43 to Branch H in the Grid UI.
5. Scan the QR code again and verify the clock-in succeeds.
