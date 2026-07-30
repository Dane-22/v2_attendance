# Full Project QA Test Report

**Project:** `v2-attendance`  
**Date:** 2026-04-29  
**Tester:** AI QA sweep (automated + API smoke checks)  
**Environment:** Windows 10, PowerShell, local workspace

## 1) Scope Covered

- `backend` (Node.js + TypeScript + Prisma API)
- `frontend` (Next.js 16 app)
- `attendance-mobile` (Expo React Native app)
- `api` (PHP composer project directory)
- Repository-level test artifacts discovery (unit/integration/e2e test files)

## 2) Test Strategy Used

- Build/lint/static checks per directory where scripts/tools exist
- Runtime API smoke testing against `http://localhost:5000`
- Route availability and auth-guard behavior checks
- Negative testing with invalid/missing payloads
- Test suite discovery scan for existing automated tests

## 3) Execution Summary

## 3.1 Backend (`backend`)

### Commands run

- `npm run build` ✅ Pass
- `node dist/server.js` ⚠️ Startup conflict on this process (`EADDRINUSE :5000`)

### Notes

- Build compiles successfully.
- Port `5000` is already occupied by another running backend instance, which allowed live endpoint smoke testing to continue against that active service.
- Database connectivity appears healthy on attempted startup (service logged successful DB connect before port bind error).

## 3.2 Frontend (`frontend`)

### Commands run

- `npm run build` ✅ Pass
- `npm run lint` ❌ Fail

### Lint result

- Total: **148 problems**
- **59 errors**, **89 warnings**
- Dominant error categories:
  - `@typescript-eslint/no-explicit-any`
  - `react-hooks/set-state-in-effect`
  - `react-hooks/purity`
  - `react-hooks/rules-of-hooks`
  - `react/no-unescaped-entities`

### Impact

- Production build currently succeeds.
- Lint quality gate fails, so CI pipelines that require clean lint will fail.
- Several hook/purity errors indicate potential runtime behavior risks, not only style issues.

## 3.3 Mobile (`attendance-mobile`)

### Command run

- `npx expo-doctor` ❌ Fail (3 checks)

### Findings

1. Missing required peer dependency: `expo-font` (required by `@expo/vector-icons`)
2. Duplicate `expo-font` versions detected:
   - `55.0.6`
   - `14.0.11`
3. Expo SDK patch mismatches:
   - `expo` expected `~54.0.34`, found `54.0.33`
   - `expo-notifications` expected `~0.32.17`, found `0.32.16`

### Impact

- Elevated risk of native build/runtime issues outside Expo Go.

## 3.4 PHP API Directory (`api`)

### Commands run

- `php --version` ✅ Pass (`PHP 8.0.30`)
- `vendor\bin\phpunit` ❌ Fail (command/module path not runnable; no `vendor` present)

### Filesystem finding

- `api` currently contains only `composer.json` (no source, no tests, no `vendor`, no `phpunit.xml`).

### Impact

- PHP API automated tests are not executable in current workspace state.

## 4) Backend API Smoke Results

## 4.1 Health and auth behavior

- `GET /health` → `200` ✅
- `GET /api/auth/login` → `404` ✅ (expected; login is POST)
- `POST /api/auth/login` with `{}` → `400` ✅ validation works

## 4.2 Protected route guard checks

Routes below returned `401` without token (expected auth protection):

- `/api/employees`
- `/api/attendance`
- `/api/payroll`
- `/api/reports/summary`
- `/api/logs`
- `/api/branches`
- `/api/notifications`
- `/api/documents/stats`
- `/api/admins`
- `/api/branch-users`

## 4.3 Input validation checks (public endpoints)

- `POST /api/qr/verify` with `{}` → `400` ✅ (`QR data is required`)
- `POST /api/face-recognition/verify` with `{}` → `400` ✅ (`Employee ID is required`)

## 4.4 Defect candidate observed

- `GET /api/face-recognition/status/1` returned `500` with message:
  - `Failed to get face registration status: Employee not found`

### QA assessment

- If employee ID not found is a normal condition, this likely should be `404` (or `200` with `registered: false`) rather than `500`.
- Marking as **Potential API error handling defect**.

## 5) Automated Test Coverage Discovery

Search results in repo:

- `*.test.*` / `*.spec.*`: none found
- `phpunit.xml*`: none found
- BDD `.feature` files: none found

### Interpretation

- There is currently little/no formal automated test suite checked in for full-stack verification.

## 6) Risk Summary

## High

- Frontend lint has many errors including hook-rule/purity violations.
- Potential incorrect HTTP status handling in face recognition status endpoint.

## Medium

- Mobile dependency/version drift may break native builds.
- Port conflict (`5000`) can cause unstable local QA startup procedures.

## Low

- Missing explicit root test scripts (`npm test` at repository root does not run real tests).

## 7) Recommended Next Actions

1. **Frontend:** prioritize fixing hook/purity errors first, then `no-explicit-any`.
2. **Backend:** change face-recognition status not-found path from `500` to domain-appropriate status.
3. **Mobile:** run `npx expo install expo-font` and `npx expo install --check`, then re-run `expo-doctor`.
4. **API (PHP):** either populate source/tests or remove stale `api` package if unused.
5. **Testing foundation:** add baseline automated suites:
   - Backend integration tests for auth + critical endpoints
   - Frontend component/page tests for attendance and employee flows
   - Mobile smoke tests for navigation/login/session

## 8) Credential-Based Authenticated Testing (Updated)

Provided credentials tested:

- Super Admin: `admin / admin123`
- Branch User: `branch-b / admin123`

Login results:

- `POST /api/auth/login` with `admin` credentials -> `200` with token, role `super_admin`, userType `admin`
- `POST /api/auth/login` with `branch-b` credentials -> `200` with token, role `branch`, userType `branch`

Authenticated endpoint matrix (GET):

- **Super Admin token**
  - `/api/employees` -> `200`
  - `/api/attendance/today` -> `400`
  - `/api/payroll` -> `200`
  - `/api/reports/summary` -> `200`
  - `/api/logs` -> `200`
  - `/api/branches` -> `200`
  - `/api/notifications` -> `200`
  - `/api/documents/stats` -> `200`
  - `/api/admins` -> `200`
  - `/api/branch-users` -> `200`

- **Branch token**
  - `/api/employees` -> `200`
  - `/api/attendance/today` -> `400`
  - `/api/payroll` -> `200`
  - `/api/reports/summary` -> `200`
  - `/api/logs` -> `200`
  - `/api/branches` -> `200`
  - `/api/notifications` -> `200`
  - `/api/documents/stats` -> `403` (role-restricted)
  - `/api/admins` -> `200`
  - `/api/branch-users` -> `200`

Additional observation:

- Branch user can access `/api/admins` and receives full admin list with branch/user data.
- This is likely an authorization boundary issue unless explicitly intended by product rules.

## 9) What Was Not Fully Tested (Still Needed)

The following still require seeded data, agreed expected behavior, or UI/device execution:

- Why `/api/attendance/today` returns `400` for both valid roles (missing query params vs backend defect)
- Full CRUD flows with assertions (create/update/delete employees, attendance, payroll, docs)
- File upload endpoints (profile/document uploads, MIME/size edge cases)
- WebSocket event and room subscription behavior under real client sessions
- End-to-end UI scenario testing across all dashboard modules
- Mobile runtime testing on emulator/device (login, scanner, notifications, offline/resume)

To complete deep end-to-end QA closure, please provide:

- Expected behavior/required params for `/api/attendance/today`
- Known-safe test records (branch code, employee IDs, payroll period IDs)
- Permission matrix (what branch role should/should not access, especially `/api/admins`)
- Any required `.env` values or external service test keys

