# Attendance Audit Page Polish Plan

**Target Page:** `frontend/src/app/dashboard/attendance-audit/page.tsx`  
**Date:** 2026-04-29  
**Focus:** Functional polish with priority on syncing reliability and clarity

## Current Review Snapshot

The page already has strong UI structure (calendar, status tabs, detail modals), but several parts are currently placeholder-only or not wired to backend behavior. The biggest operational gap is **sync confidence**: users cannot clearly tell when data is fresh, stale, or still loading.

## Key Findings

1. **No explicit sync controls/status**
   - There is no manual refresh button, last-updated timestamp, or auto-refresh indicator.
   - Users cannot verify whether new attendance changes are already reflected.

2. **Branch list is static**
   - Branch dropdown uses hardcoded `branches` constants instead of live `branchApi.getAll()`.
   - Risk: mismatch when branch codes/names change in backend.

3. **Action buttons are mostly non-functional**
   - `Search`, `This Week`, `This Month`, top-level `Today`, `Generate Report`, `Export Excel`, `Individual Report` are currently UI-only.
   - This creates expectation gaps and sync confusion ("clicked action but data did not change").

4. **Mixed mock and live data in modals**
   - `EmployeeAttendanceModal`, `BranchAttendanceModal`, `ScheduleModal` generate synthetic records.
   - Main table is API-backed, but modal drill-down is not source-of-truth.

5. **Date/timezone consistency risk**
   - Several areas use local `Date` parsing while other helpers use `Asia/Manila`.
   - Can cause off-by-one day behavior in monthly aggregation and day details.

6. **Query coupling and possible stale displays**
   - Main query includes `activeFilter` in request params, then client-side filtering is applied again.
   - Without clear sync semantics, users may interpret filtered zero-states as missing data.

## Syncing Functionality Polish (Priority)

## P0 (Must-Have)

1. **Add explicit refresh action**
   - Add `Refresh` button near header/actions.
   - On click: `queryClient.invalidateQueries` for:
     - `['attendance-audit', formattedDate, selectedBranchFilter]`
     - `['attendance-monthly', startDate, endDate, selectedBranchFilter]`
   - Show spinner while fetching.

2. **Show last successful sync**
   - Track and display:
     - `Last synced: HH:MM:SS` (Asia/Manila)
     - `Syncing...` state while query is in-flight
     - `Sync failed` state when request errors
   - Use React Query timestamps (`dataUpdatedAt`) + error state.

3. **Auto-refresh interval for audit context**
   - Enable polling for active operational view, e.g. every 30-60 seconds.
   - Use `refetchInterval` and pause polling when tab is not visible (`refetchIntervalInBackground: false`).

4. **Unify query freshness settings**
   - Set intentional `staleTime` and `gcTime`.
   - Example:
     - Audit records: short stale window (10-20s)
     - Monthly totals: longer stale window (60-120s)

## P1 (Should-Have)

5. **Add optimistic freshness hints**
   - On mutation in related attendance flows, emit invalidation event or shared refresh trigger.
   - If WebSocket exists in app, subscribe to attendance updates and invalidate this page queries on event.

6. **Sync confidence UI pattern**
   - Add status chip with states:
     - `Live`
     - `Refreshing`
     - `Out of date`
   - Out-of-date can trigger when elapsed time since `dataUpdatedAt` exceeds threshold.

7. **Graceful retry path**
   - Add `Retry sync` CTA in error banner.
   - Preserve previous data while retrying (`keepPreviousData` behavior).

## P2 (Nice-to-Have)

8. **Sync telemetry for QA**
   - Add lightweight logs for fetch start/success/error with query key + duration.
   - Helps identify API slowness vs UI-state issues.

## Functional Polish Backlog (Non-Sync)

1. **Wire branch filter to backend branch source**
   - Replace hardcoded branch constants with `branchApi.getAll()` plus derived option labels.

2. **Implement currently inert controls**
   - Connect `This Week` and `This Month` to real date-range/date selection logic.
   - Wire `Today` action button to same handler as calendar `Today`.

3. **Replace mock modal data with API-backed detail queries**
   - Employee modal: fetch selected employee attendance history for selected month/year.
   - Branch modal: fetch branch/day attendance details from backend, not random generation.
   - Schedule modal: either bind to real schedule source or relabel as "sample view".

4. **Export/report implementation**
   - CSV/XLS export should use filtered + selected date context.
   - Individual report should require selected employee and call backend endpoint.

5. **Timezone normalization**
   - Use a single utility path for all date comparisons and daily grouping (Asia/Manila).
   - Avoid direct `new Date(record.date)` comparisons without timezone handling.

## Recommended Implementation Order

1. P0 sync controls + status + auto-refresh
2. Branch source and inert action wiring
3. Modal data source replacement
4. Export/report implementation
5. Timezone hardening and cleanup

## QA Acceptance Criteria (Sync-Focused)

1. Manual refresh updates table and calendar counts without page reload.
2. Last sync timestamp updates only on successful fetch.
3. Sync state visibly changes: idle -> syncing -> success/error.
4. Auto-refresh triggers within configured interval while tab is active.
5. Simulated network failure surfaces retry UI and does not blank previously loaded data.
6. Data updated in attendance module appears in audit page within SLA (manual or auto sync path).

## Suggested File Touch Points

- `frontend/src/app/dashboard/attendance-audit/page.tsx`
- `frontend/src/lib/api.ts` (only if additional audit/detail endpoints are needed)
- Optional shared utility for timezone-safe date parsing/formatting
