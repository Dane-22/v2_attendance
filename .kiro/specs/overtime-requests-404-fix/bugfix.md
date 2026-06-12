# Bugfix Requirements Document

## Introduction

The web application is producing 404 errors across two categories of routes. First, the Next.js development rewrite configuration in `next.config.ts` proxies all `/api/*` requests to a hardcoded local IP address (`192.168.1.25:5000`) instead of using the environment variable `NEXT_PUBLIC_API_URL`. This causes `/api/overtime-requests` (and any other API call routed through the Next.js proxy) to fail with 404 when the backend is not reachable at that specific IP. Second, the `task-deligation` and `tasks` page routes return 404 with `_rsc` query parameters, which indicates Next.js React Server Component prefetch requests are failing — most likely because the same misconfigured proxy intercepts RSC navigation requests and forwards them to the wrong host, or the dev server is not running correctly against the expected origin.

The overtime request feature is completely broken as a result: submitting a request from the dashboard triggers `POST /api/overtime-requests` which hits the proxy and returns 404 instead of reaching the Express backend.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user navigates to `/dashboard/task-deligation` THEN the system returns a 404 Not Found response for the RSC prefetch request (`task-deligation?_rsc=...`)

1.2 WHEN a user navigates to `/dashboard/tasks` THEN the system returns a 404 Not Found response for the RSC prefetch request (`tasks?_rsc=...`)

1.3 WHEN the frontend makes a request to `/api/overtime-requests` in development mode THEN the system proxies the request to the hardcoded IP `192.168.1.25:5000` instead of the configured backend URL, resulting in a 404 Not Found error

1.4 WHEN the `OvertimeRequestModal` form is submitted THEN the system throws `AxiosError: Request failed with status code 404` and the overtime request is not created

1.5 WHEN any API call is made through the Next.js rewrite proxy in development THEN the system routes to `http://192.168.1.25:5000/api/:path*` regardless of the `NEXT_PUBLIC_API_URL` environment variable value

### Expected Behavior (Correct)

2.1 WHEN a user navigates to `/dashboard/task-deligation` THEN the system SHALL serve the page and resolve RSC prefetch requests successfully with a 200 response

2.2 WHEN a user navigates to `/dashboard/tasks` THEN the system SHALL serve the page and resolve RSC prefetch requests successfully with a 200 response

2.3 WHEN the frontend makes a request to `/api/overtime-requests` in development mode THEN the system SHALL proxy the request to the backend URL derived from `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5000/api/overtime-requests`) and return the correct response

2.4 WHEN the `OvertimeRequestModal` form is submitted with valid data THEN the system SHALL successfully create the overtime request and return a success response without a 404 error

2.5 WHEN the Next.js rewrite proxy is active in development THEN the system SHALL route `/api/:path*` to the host and port defined by the environment configuration, not a hardcoded IP address

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application is running in production mode THEN the system SHALL CONTINUE TO skip all Next.js rewrites (the existing `NODE_ENV === 'development'` guard must remain intact)

3.2 WHEN a user submits a valid overtime request form THEN the system SHALL CONTINUE TO validate all required fields (employee name, date, start time, end time, reason) before sending the request

3.3 WHEN a user navigates to any other dashboard route (e.g., `/dashboard/attendance`, `/dashboard/employees`) THEN the system SHALL CONTINUE TO serve those pages correctly without 404 errors

3.4 WHEN the backend returns a 401 Unauthorized response THEN the system SHALL CONTINUE TO clear the token and redirect to `/login` via the existing Axios interceptor

3.5 WHEN the overtime request API endpoint is called with valid authentication THEN the system SHALL CONTINUE TO require a valid JWT token via the `authenticate` middleware on the backend route

---

## Bug Condition Pseudocode

**Bug Condition Function** — identifies the misconfigured proxy destination:

```pascal
FUNCTION isBugCondition(config)
  INPUT: config of type NextConfig (next.config.ts rewrite rule)
  OUTPUT: boolean

  // Returns true when the rewrite destination is a hardcoded IP
  RETURN config.rewrites.development.destination CONTAINS hardcoded_ip_address
         AND NOT config.rewrites.development.destination USES env_variable
END FUNCTION
```

**Property: Fix Checking**

```pascal
// Property: Fix Checking - Rewrite destination uses env variable
FOR ALL requests WHERE isBugCondition(next.config) DO
  response ← fetch('/api/overtime-requests')
  ASSERT response.status ≠ 404
  ASSERT proxy_destination = resolve(NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
END FOR
```

**Property: Preservation Checking**

```pascal
// Property: Preservation Checking
FOR ALL requests WHERE NOT isBugCondition(next.config) DO
  // Production mode: no rewrites applied
  ASSERT NODE_ENV = 'production' IMPLIES no_rewrite_applied
  // Auth interceptor still works
  ASSERT response.status = 401 IMPLIES redirect_to_login
END FOR
```
