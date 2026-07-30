# Login Connection Issue

## Problem Description
Unable to login on localhost. Console tab shows error:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

## Error Details
- **Error Type**: net::ERR_CONNECTION_REFUSED
- **Location**: Console tab
- **Context**: Login attempt on localhost

## Potential Causes
1. Backend server not running
2. Incorrect API endpoint configuration
3. Port mismatch between frontend and backend
4. Firewall or network blocking the connection
5. Environment variables not properly configured

## Investigation Checklist
- [ ] Verify backend server is running
- [ ] Check backend server port (default: 3000 or configured port)
- [ ] Verify frontend API endpoint configuration
- [ ] Check .env files for correct API URLs
- [ ] Verify firewall is not blocking the connection
- [ ] Check if backend is listening on correct interface (localhost vs 0.0.0.0)

## Root Cause Identified

**Port Mismatch Issue:**
- Frontend is trying to connect to: `http://localhost:5002/api/auth/login`
- Backend server.ts default port: `5000` (line 29: `const PORT = process.env.PORT || 5000;`)
- Backend .env.example shows: `PORT=5002` (production)
- LOCAL_DEVELOPMENT.md confirms:
  - Development: Backend Port 5000
  - Production: Backend Port 5002

**The Problem:**
Frontend's api.ts has fallback: `http://localhost:5002/api` (production port), but backend is running on port 5000 (development default). Since `NEXT_PUBLIC_API_URL` is likely not set in frontend/.env.local, it defaults to the production port (5002) which is not running in development.

## Recommended Fix

Create/update `frontend/.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

This will:
- ✅ Fix localhost connection (use port 5000 for development)
- ✅ Not affect production (.env.local is gitignored)
- ✅ Align with LOCAL_DEVELOPMENT.md configuration

## Next Steps
Wait for user go signal before implementing fixes.
