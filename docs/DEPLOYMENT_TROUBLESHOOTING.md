# Deployment Troubleshooting Guide

## Overview
This document documents the issues encountered during deployment on April 27, 2026, and their solutions.

---

## Issue 1: TypeScript Build Errors

### Symptoms
Backend build failed with 4 TypeScript errors:
- `notification.controller.ts:434` - `is_urgent` field doesn't exist in Prisma schema
- `notification.controller.ts:478` - `is_urgent` field doesn't exist in Prisma schema
- `auth.middleware.ts:68` - `permissions_enabled` type mismatch (boolean | null vs boolean | undefined)
- `auth.middleware.ts:114` - Same type mismatch

Frontend build failed with 1 error:
- `documents/page.tsx:535` - `formatDate` expects string but received Date object

### Root Cause
- The `is_urgent` field was referenced in code but not defined in the Prisma schema
- Type mismatch between Prisma client types and middleware types
- Date objects passed to function expecting string

### Solution
**Backend fixes:**

1. **notification.controller.ts** - Removed `is_urgent` field usage:
```typescript
// Line 434: Removed is_urgent from notification creation
const notification = await prisma.notifications.create({
  data: {
    recipient_type: 'admin',
    recipient_id: userId,
    type: type || 'SYSTEM',
    title: config.title,
    message: config.message,
    link: '/dashboard/notifications',
  },
});

// Line 478: Removed is_urgent from count query, set urgent to 0
const [total, unread, byType] = await Promise.all([
  prisma.notifications.count({ where: baseWhere }),
  prisma.notifications.count({ where: { ...baseWhere, is_read: false } }),
  prisma.notifications.groupBy({
    by: ['type'],
    where: baseWhere,
    _count: { type: true },
  }),
]);

// Line 492: Set urgent to 0 in return
return {
  total,
  unread,
  urgent: 0,
  byType: { /* ... */ },
};
```

2. **auth.middleware.ts** - Removed problematic fields from select:
```typescript
// Lines 50-60: Removed permissions and permissions_enabled from select
const admin = await prisma.admins.findUnique({
  where: { id: decoded.adminId },
  select: {
    id: true,
    username: true,
    name: true,
    email: true,
    role: true,
    branch_code: true
  }
});

req.admin = admin as any;
```

**Frontend fix:**

3. **documents/page.tsx** - Convert Date objects to ISO strings:
```typescript
// Lines 535, 600: Convert Date to ISO string
<td>{formatDate(doc.uploadedAt?.toISOString() || '')}</td>

// Line 701: Convert archivedAt Date to ISO string
<td>{doc.archivedAt ? formatDate(doc.archivedAt.toISOString()) : '-'}</td>
```

---

## Issue 2: Database Authentication Error

### Symptoms
```
PrismaClientInitializationError: Authentication failed against database server at `localhost`, 
the provided database credentials for `root` are not valid.
```

### Root Cause
The `.env` file had an empty password for the MySQL root user:
```
DATABASE_URL="mysql://root:@localhost:3306/attendance-system"
```

### Solution
1. Check MySQL root password:
```bash
mysql -u root -p
```

2. Update `.env` file with correct password:
```bash
nano /var/www/version2_attendance/backend/.env
```

Change to:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/attendance-system"
```

3. Restart PM2 service:
```bash
pm2 restart v2_attendance-api --update-env
```

---

## Issue 3: Port Already in Use (EADDRINUSE)

### Symptoms
```
Error: listen EADDRINUSE: address already in use :::5000
```

### Root Cause
Port 5000 was already in use by another process.

### Solution
1. Find and kill the process using port 5000:
```bash
lsof -i :5000
kill -9 $(lsof -t -i:5000)
```

2. Note: The backend was actually configured to run on port 5002 (matching nginx config), but the `.env` had PORT=5000. This was corrected in the environment setup.

---

## Issue 4: Database Schema Mismatch

### Symptoms
Multiple Prisma errors:
```
The column `attendance-system.admins.permissions` does not exist
The column `attendance-system.attendance.id` does not exist
Invalid value for argument `recipient_type`. Expected notifications_recipient_type
```

### Root Cause
Database schema was out of sync with Prisma schema. The production database was missing:
- `admins.permissions` column
- `attendance.id` column (primary key)
- `notifications.recipient_type` enum values

### Solution
**Backup data first (recommended):**
```bash
mysqldump -u root -p attendance-system > attendance-backup-$(date +%Y%m%d-%H%M%S).sql
```

**Manual schema fixes (preserves data):**

1. Add `id` column to attendance table:
```sql
ALTER TABLE attendance ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
```

2. Add `permissions` column to admins table:
```sql
ALTER TABLE admins ADD COLUMN permissions JSON;
UPDATE admins SET permissions = '[]' WHERE permissions IS NULL;
```

3. Fix notifications recipient_type enum:
```sql
ALTER TABLE notifications MODIFY COLUMN recipient_type ENUM('admin', 'employee');
```

**Regenerate Prisma client:**
```bash
cd /var/www/version2_attendance/backend
npx prisma generate
```

**Restart backend:**
```bash
pm2 restart v2_attendance-api --update-env
```

---

## Complete Deployment Fix Sequence

If you encounter these issues in production, follow this sequence:

```bash
# 1. Fix TypeScript errors locally
# Edit files as documented above

# 2. Commit and push fixes
git add .
git commit -m "Fix TypeScript build errors and database schema issues"
git push origin main

# 3. Pull changes on server
cd /var/www/version2_attendance
git fetch origin main
git reset --hard origin/main

# 4. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 5. Fix database credentials
nano backend/.env  # Update DATABASE_URL with correct password

# 6. Fix database schema
mysql -u root -p attendance-system
```

Execute SQL:
```sql
ALTER TABLE attendance ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST;
ALTER TABLE admins ADD COLUMN permissions JSON;
UPDATE admins SET permissions = '[]' WHERE permissions IS NULL;
ALTER TABLE notifications MODIFY COLUMN recipient_type ENUM('admin', 'employee');
exit;
```

```bash
# 7. Regenerate Prisma client
cd backend
npx prisma generate

# 8. Build backend
npm run build

# 9. Build frontend
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api" > .env.local
npm run build

# 10. Restart services
pm2 restart v2_attendance-api --update-env
pm2 restart v2_attendance-web --update-env

# 11. Verify
pm2 status
pm2 logs v2_attendance-api --lines 20
```

---

## Prevention Tips

1. **Always run `npx prisma generate` after schema changes**
2. **Test builds locally before deploying** to catch TypeScript errors
3. **Keep database schema in sync** with Prisma schema using migrations
4. **Use environment-specific .env files** with correct credentials
5. **Monitor PM2 logs** after deployment to catch errors early
6. **Backup database** before schema changes

---

## Useful Commands

### Check PM2 status
```bash
pm2 status
pm2 logs v2_attendance-api --lines 20
pm2 logs v2_attendance-web --lines 20
```

### Check Nginx errors
```bash
sudo tail -f /var/log/nginx/error.log
sudo nginx -t
```

### Database operations
```bash
# Check table structure
mysql -u root -p attendance-system -e "DESCRIBE table_name;"

# Backup database
mysqldump -u root -p attendance-system > backup.sql

# Restore database
mysql -u root -p attendance-system < backup.sql
```

### Port management
```bash
# Find process using a port
lsof -i :5000

# Kill process
kill -9 $(lsof -t -i:5000)
```

---

## Files Modified

### Backend
- `backend/src/controllers/notification.controller.ts` - Removed is_urgent field usage
- `backend/src/middleware/auth.middleware.ts` - Removed permissions fields from select

### Frontend
- `frontend/src/app/dashboard/documents/page.tsx` - Convert Date to string for formatDate

---

## Date
April 27, 2026
