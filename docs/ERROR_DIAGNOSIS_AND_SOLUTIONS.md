# Error Diagnosis and Solutions

## Summary
You have two critical errors affecting your attendance system:

### Error 1: 500 Internal Server Error on `/api/notifications/unread-count`
**Status**: Backend endpoint failing  
**Frequency**: Happens on every page load that uses the Header component  
**Impact**: Dashboard and other pages can't load properly

### Error 2: net::ERR_CONNECTION_REFUSED on localhost:5002 for Profile Images
**Status**: Frontend trying to access non-existent server  
**Frequency**: Every time a profile image is requested  
**Impact**: Profile images fail to load throughout the application

---

## Root Cause Analysis

### Error 1: Notifications Endpoint (500 Error)

**Issue**: The `getUnreadCount` endpoint is throwing a 500 error

**Location**: `backend/src/controllers/notification.controller.ts` at line 95

**Problem Code**:
```typescript
const stats = await getNotificationStats(userId, userRole);
```

**Likely Causes**:
1. Database query in `getNotificationStats()` function is failing
2. Missing or incorrect Prisma schema for the `notifications` table
3. The function may not be handling all notification types or recipient types properly
4. Potential null/undefined values in the database causing type errors

**The Function** (lines 465-509):
- Uses Prisma to query notifications table with groupBy()
- Counts by type for statistics
- May fail if database schema doesn't match expectations

---

### Error 2: Profile Image Connection (Connection Refused)

**Issue**: Frontend is attempting to fetch images from `localhost:5002`, but no server is listening on that port

**Current Configuration**:
- **Backend API URL**: `http://localhost:5000/api` (from `frontend/src/lib/api.ts:3`)
- **Backend Static File Path**: `/uploads` on port 5000 (from `backend/src/server.ts:110`)
- **Frontend Expects**: `localhost:5002` (indicated by error logs)

**Why It's Failing**:
- In development, backend runs on port 5000
- In production (deployment guide), backend runs on port 5002
- Frontend code has hardcoded references to port 5002
- Profile image URLs are being constructed incorrectly

**Example Profile URLs from Errors**:
```
http://localhost:5002/assets/profile-images/employees/118_1777361050474.png  (404)
http://localhost:5002/uploads/employees/69e1f56dc2167_compressed_profile.jpg  (404)
http://localhost:5002/profile_69d6006a66bfe6.32302616.png  (404)
```

**What the Backend Actually Serves**:
```
http://localhost:5000/uploads/profile_images/...
```

**ProfileImage Component** (`frontend/src/components/ProfileImage.tsx`):
- Currently accepts `src` prop but doesn't validate protocol/port
- Component stores image URLs as-is from the database
- Database stores raw paths or URLs that include `localhost:5002`

---

## Solutions

### Quick Fix for Error 1 (Notification 500 Error)

**Step 1**: Check if notifications table exists in database
```sql
-- Run this in your MySQL terminal
SHOW TABLES LIKE 'notifications';
DESCRIBE notifications;
```

**Step 2**: If table doesn't exist, run Prisma migration
```bash
cd backend
npx prisma migrate dev --name init
```

**Step 3**: If table exists but query fails, add error handling
The controller needs better error handling in `getNotificationStats()`.

### Recommended Fix for Error 2 (Profile Images)

#### Option A: Use Relative URLs (Recommended for Development)

**In Backend** (`backend/src/server.ts`):
```typescript
// Currently at line 110:
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// This is already correct! The issue is in the database/frontend
```

**In Frontend** - Update all profile image references to use correct port:

Create a utility function (`frontend/src/lib/imageUtils.ts`):
```typescript
export function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it starts with /, it's a relative path from the server root
  if (imagePath.startsWith('/')) {
    return `http://localhost:5000${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path under /uploads
  return `http://localhost:5000/uploads/${imagePath}`;
}
```

#### Option B: Use Environment Variable (Better for Production)

**Create `.env.local` in frontend**:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_IMAGE_URL=http://localhost:5000/uploads
```

**Update utility** (`frontend/src/lib/imageUtils.ts`):
```typescript
export function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:5000/uploads';
  
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  return `${baseUrl}/${imagePath}`;
}
```

**Update ProfileImage component** (`frontend/src/components/ProfileImage.tsx`):
```typescript
import { getImageUrl } from '@/lib/imageUtils';

const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  // ... other props
}) => {
  // Update useEffect to use the utility:
  useEffect(() => {
    const correctedUrl = getImageUrl(src);
    setImgSrc(correctedUrl);
    setImgError(false);
    setIsLoading(true);
  }, [src]);
  
  // ... rest of component
};
```

### Option C: Configure Backend to Serve Static Files on Port 5002

**Edit `.env` file**:
```
PORT=5002
WS_PORT=5002
```

**Then restart backend**:
```bash
npm run dev
```

**Note**: This matches your deployment configuration but requires frontend to use port 5002 in development too.

---

## Recommended Action Plan

1. **First**: Fix the notification error
   - Run: `npx prisma migrate dev` in backend folder
   - Check backend logs for specific errors
   
2. **Second**: Fix image URLs
   - Implement Option B (environment variable approach)
   - Creates a single source of truth for image base URLs
   - Works for both development and production

3. **Verify**:
   - Restart both backend and frontend
   - Check Console for remaining errors
   - Verify images load and notifications appear

---

## Testing Commands

```bash
# Test if backend is running
curl http://localhost:5000/health

# Test notifications endpoint (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/notifications/unread-count

# Test static files are being served
curl http://localhost:5000/uploads/
```

---

## Files to Check/Update

- `backend/src/controllers/notification.controller.ts` (lines 95, 465-509)
- `backend/src/server.ts` (line 110)
- `frontend/src/lib/api.ts` (line 3)
- `frontend/src/components/ProfileImage.tsx` (entire file)
- `frontend/.env.local` (create if doesn't exist)
