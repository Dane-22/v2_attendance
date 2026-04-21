# Deploying v2-attendance on Hostinger VPS

This guide walks you through deploying your Attendance & Payroll System on a Hostinger VPS.

---

## Project Overview

| Component | Technology | Port |
|-----------|------------|------|
| **Backend** | Express + TypeScript + Prisma | 5000 |
| **Frontend** | Next.js 16 + React 19 + TailwindCSS 4 | 3000 |
| **Database** | MySQL | 3306 |

**GitHub Repository:** `https://github.com/Dane-22/v2_attendance.git`  
**VPS Access:** `ssh root@72.62.254.60`  
**Domain:** `attendacev2.com` (A record → 72.62.254.60)

---

## Step 1: Connect to Your VPS

Open PowerShell or terminal and connect via SSH:

```bash
ssh root@72.62.254.60
```

Update your server packages:

```bash
apt update && apt upgrade -y
```

---

## Step 2: Install Required Software

### Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Verify: v20.x.x
npm -v   # Verify: 10.x.x
```

### Install MySQL

```bash
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Install Nginx (Reverse Proxy)

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## Step 3: Set Up MySQL Database

Secure MySQL installation:

```bash
mysql_secure_installation
```

Create database and user:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'attendance_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON attendance_db.* TO 'attendance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 4: Clone and Setup the Project

```bash
cd /var/www
git clone https://github.com/Dane-22/v2_attendance.git attendance
```

---

## Step 5: Configure Backend Environment

```bash
cd /var/www/attendance/backend
cp .env.example .env
nano .env
```

Update the `.env` file:

```env
# Database
DATABASE_URL="mysql://attendance_user:YourStrongPassword123!@localhost:3306/attendance_db"

# Server
PORT=5000
NODE_ENV=production
# Generate JWT_SECRET:
#   Linux: openssl rand -base64 32
#   Windows PowerShell: -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
JWT_SECRET=YOUR_32_CHAR_RANDOM_SECRET_HERE

# CORS - Update with your actual domain
FRONTEND_URL=https://attendacev2.com
```

### Import Your Existing Database

Upload your SQL file to the VPS using SCP (from your local machine):

```bash
# On your local machine (PowerShell/CMD)
scp "attendance-system (1).sql" root@72.62.254.60:/tmp/
```

Then on the VPS, import the database:

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import the SQL dump
mysql -u root -p attendance_db < /tmp/attendance-system\ \(1\).sql

# Verify import
mysql -u root -p -e "USE attendance_db; SHOW TABLES;"
```

### Transfer Profile Images (If Available)

Your database references employee profile images in `uploads/employees/` and `uploads/profile_images/`. 

**Check if the uploads folder exists:**
```powershell
# On your local machine (PowerShell)
Test-Path "C:\wamp64\www\v2-attendance\uploads"
```

**If the folder exists**, transfer it:
```bash
# From your local WAMP server (PowerShell as Admin)
scp -r "C:\wamp64\www\v2-attendance\uploads" root@72.62.254.60:/var/www/attendance/backend/

# On the VPS, fix permissions:
chown -R www-data:www-data /var/www/attendance/backend/uploads
chmod -R 755 /var/www/attendance/backend/uploads
```

**If the folder doesn't exist**, the profile images will show as broken links. You can:
- Re-upload employee photos after deployment
- Or search for the images in another location on your system

### Install Dependencies & Build

```bash
npm install
npx prisma generate
npm run build
```

**Note:** Do NOT run `prisma migrate deploy` or `db:seed` since you're importing existing data.

---

## Step 6: Configure Frontend Environment

```bash
cd /var/www/attendance/frontend
```

Create the environment file:

```bash
nano .env.local
```

Add this content:

```env
NEXT_PUBLIC_API_URL=https://attendacev2.com/api
```

### Install Dependencies & Build

```bash
npm install
npm run build
```

---

## Step 7: Start Services with PM2

### Backend (API Server)

```bash
cd /var/www/attendance/backend
pm2 start dist/server.js --name "attendance-api"
pm2 save
```

### Frontend (Next.js)

```bash
cd /var/www/attendance/frontend
pm2 start "npm start" --name "attendance-frontend"
pm2 save
```

### Configure PM2 Startup

```bash
pm2 startup systemd
# Run the command output from above
pm2 save
```

---

## Step 8: Configure Nginx as Reverse Proxy

Create Nginx config for your domain:

```bash
nano /etc/nginx/sites-available/attendance
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name attendacev2.com www.attendacev2.com;

    # Frontend - Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Step 9: Set Up SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d attendacev2.com -d www.attendacev2.com
```

Follow the prompts. Certbot will automatically update your Nginx config for HTTPS.

---

## Step 10: Update Backend CORS for Production

Edit the backend server to allow your domain:

```bash
nano /var/www/attendance/backend/src/server.ts
```

Update the CORS configuration:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://attendacev2.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

Rebuild and restart:

```bash
cd /var/www/attendance/backend
npm run build
pm2 restart attendance-api
```

---

## Step 11: Firewall Configuration

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check running processes |
| `pm2 logs attendance-api` | View backend logs |
| `pm2 logs attendance-frontend` | View frontend logs |
| `pm2 restart all` | Restart all services |
| `systemctl status nginx` | Check Nginx status |
| `systemctl status mysql` | Check MySQL status |

---

## File & Directory Structure on VPS

```
/var/www/attendance/
├── backend/               # Express API
│   ├── dist/             # Compiled TypeScript
│   ├── prisma/           # Database schema
│   ├── src/              # Source code
│   ├── .env              # Environment variables
│   └── package.json
│
├── frontend/             # Next.js App
│   ├── .next/            # Build output
│   ├── src/              # Source code
│   ├── .env.local        # Environment variables
│   └── package.json
│
└── README.md
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
mysql -u attendance_user -p attendance_db

# Check Prisma connection
npx prisma db pull
```

### PM2 Process Issues

```bash
pm2 delete all
pm2 flush
# Then restart processes (Step 7)
```

### Nginx Issues

```bash
nginx -t                          # Test config
journalctl -u nginx -f           # View logs
```

### Port Already in Use

```bash
lsof -i :5000
lsof -i :3000
# Kill process if needed: kill -9 <PID>
```

---

## Security Recommendations

1. **Change default passwords** - Use strong, unique passwords
2. **Keep software updated** - Run `apt update && apt upgrade` regularly
3. **Disable root SSH** - Create a non-root user for SSH access
4. **Set up fail2ban** - Protect against brute force attacks:
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   ```
5. **Backup database regularly**:
   ```bash
   mysqldump -u root -p attendance_db > backup_$(date +%Y%m%d).sql
   ```

---

## Updating the Application

When you push changes to GitHub:

```bash
cd /var/www/attendance
git pull origin main

# Update backend
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart attendance-api

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart attendance-frontend
```

---

**Your Attendance & Payroll System should now be live at `https://attendacev2.com`**

For support, contact Hostinger support or refer to the documentation for each technology (Node.js, Next.js, Prisma, Nginx).
