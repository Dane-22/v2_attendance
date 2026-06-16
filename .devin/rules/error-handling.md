---
name: error-handling
description: Implement consistent error handling across all API routes and UI components. Use structured error responses with HTTP status codes, user-friendly messages, and detailed logs for debugging. Never expose sensitive error details to the client.
---

Instructions:
- Wrap all async operations in try-catch blocks
- Return standardized error format: `{ success: false, error: string, code?: string }`
- Log errors with context (timestamp, user ID, request details) for debugging
- Handle network errors gracefully with retry logic for QR scans and clock-ins
- Provide actionable user feedback for all error states (e.g., "QR code expired, please refresh")
