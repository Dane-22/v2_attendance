# Server Administrator's Deployment Manual

Use this procedure to update **attendacev2.xandree.com** whenever new features or fixes are pushed to the repository.

---

## 1. The "Daily" Code Update

When your colleague says "Code is updated on GitHub," run this sequence:

```bash
# 1. Enter the project directory
cd /var/www/version2_attendance

# 2. Pull the latest changes from GitHub
git fetch origin main
git reset --hard origin/main

# 3. Install any new dependencies
npm install
cd /var/www/version2_attendance/backend && npm install
cd /var/www/version2_attendance/frontend && npm install

# 4. Update Prisma Client (if schema changed)
cd /var/www/version2_attendance/backend
npx prisma generate

# 5. Build the backend
cd /var/www/version2_attendance/backend
npm run build

# 6. Build the frontend (with correct API URL)
cd /var/www/version2_attendance/frontend
echo "NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api" > .env.local
npm run build

# 7. Restart PM2 services (with --update-env to ensure env vars are refreshed)
pm2 restart v2_attendance-api --update-env
pm2 restart v2_attendance-web --update-env

# 8. Verify services are running
pm2 status
```

---

## 2. The Database Update

If the update includes new database tables or columns:

**Option A: Prisma Migration (if using migrations)**
```bash
cd /var/www/version2_attendance/backend
npx prisma migrate deploy
```

**Option B: SQL Import (if .sql file provided)**
```bash
# Import the SQL file
mysql -u root -p attendance-system < /path/to/your/file.sql

# Verify: Check if new tables exist
mysql -u root -p -e "USE attendance-system; SHOW TABLES;"
```

---

## 3. Environment Persistence (.env)

Your `.env` files are critical and are **NOT** tracked by Git (they are in `.gitignore`). They will remain intact during deployments.

**Backend .env location:**
```bash
/var/www/version2_attendance/backend/.env
```

**Frontend .env.local location:**
```bash
/var/www/version2_attendance/frontend/.env.local
```

If you ever need to change environment variables, edit these files directly:
```bash
nano /var/www/version2_attendance/backend/.env
nano /var/www/version2_attendance/frontend/.env.local
```

**Important:** After changing `.env` files, restart the services:
```bash
pm2 restart v2_attendance-api --update-env
pm2 restart v2_attendance-web --update-env
```

---

## 4. Quick-Reference Table

| Task | Command | Why? |
|------|---------|------|
| Check for API Errors | `pm2 logs v2_attendance-api --lines 20` | To see why the backend is failing |
| Check Nginx Errors | `sudo tail -f /var/log/nginx/error.log` | To debug 500/502 errors |
| Test Nginx Config | `sudo nginx -t` | To ensure config is valid before reloading |
| Check PM2 Status | `pm2 status` | To verify both services are running |
| Monitor API Logs | `pm2 logs v2_attendance-api` | Real-time backend monitoring |
| Monitor Web Logs | `pm2 logs v2_attendance-web` | Real-time frontend monitoring |
| Check .env Files | `ls -la /var/www/version2_attendance/backend/.env` | Confirm env files exist |
| Restart Nginx | `sudo systemctl reload nginx` | Apply Nginx config changes |

---

## 5. Summary "One-Liner"

For experienced users, run all update steps in a single command:

```bash
cd /var/www/version2_attendance && \
git fetch origin main && \
git reset --hard origin/main && \
npm install && \
cd backend && npm install && npx prisma generate && npm run build && \
cd ../frontend && npm install && echo "NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api" > .env.local && npm run build && \
pm2 restart v2_attendance-api --update-env && pm2 restart v2_attendance-web --update-env && \
pm2 status
```

---

## 6. Troubleshooting Common Issues

### Issue: "Port already in use" (EADDRINUSE)
**Fix:**
```bash
# Find and kill process using the port
sudo lsof -i :5002
sudo kill -9 <PID>
pm2 restart v2_attendance-api
```

### Issue: "Cannot find module" errors
**Fix:**
```bash
cd /var/www/version2_attendance/backend && npm install
cd /var/www/version2_attendance/frontend && npm install
pm2 restart all
```

### Issue: Frontend shows "Route not found"
**Fix:** Check that the frontend was built with the correct API URL:
```bash
cat /var/www/version2_attendance/frontend/.env.local
# Should show: NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api
```

### Issue: 502 Bad Gateway
**Fix:** Check if backend is running:
```bash
pm2 status
pm2 logs v2_attendance-api --lines 20
```

### Issue: "Authentication failed against database" (Prisma P1000)
**Fix:** Update the database password in backend .env:
```bash
nano /var/www/version2_attendance/backend/.env
# Update: DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/attendance-system"
pm2 restart v2_attendance-api --update-env
```

### Issue: SSL Certificate Expired
**Fix:** Renew certificate:
```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 7. Project Structure on Server

```
/var/www/version2_attendance/
├── backend/           # Node.js API (port 5002)
│   ├── .env          # Database & JWT config
│   ├── dist/         # Compiled TypeScript
│   └── prisma/       # Database schema
├── frontend/          # Next.js static export (port 3001)
│   ├── .env.local    # API URL config
│   └── out/          # Static build files
└── nginx config:     # /etc/nginx/sites-available/version2_attendance
```

---

## 8. Service Ports

| Service | Port | Process Name |
|---------|------|--------------|
| Backend API | 5002 | v2_attendance-api |
| Frontend Web | 3001 | v2_attendance-web |
| Nginx | 80, 443 | nginx |
| MySQL | 3306 | mysql |

---

## 9. Emergency Rollback

If a deployment breaks, quickly revert to the previous version:

```bash
cd /var/www/version2_attendance
# View previous commits
git log --oneline -5
# Revert to specific commit (replace abc123 with actual commit hash)
git reset --hard abc123
# Rebuild and restart
cd backend && npm run build
cd ../frontend && npm run build
pm2 restart all
```

---

## 10. Post-Deployment Verification Checklist

After every deployment, verify:
- [ ] `pm2 status` shows both services as "online"
- [ ] `https://attendacev2.xandree.com` loads without SSL warnings
- [ ] Login page works
- [ ] `https://attendacev2.xandree.com/api/health` returns success
- [ ] No errors in `pm2 logs`

---

**Last Updated:** April 21, 2026  
**Domain:** attendacev2.xandree.com  
**Server:** 72.62.254.60
