# Local Development Setup Guide

This guide explains how to set up and run the JAJR Attendance System on your local machine for development.

## Prerequisites

- **Node.js** 20.x or higher
- **MySQL** 5.7 or higher
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## Database Setup

### 1. Create Local Database

Open MySQL command line or use a tool like MySQL Workbench:

```sql
CREATE DATABASE attendance-system;
```

### 2. Import Schema (Optional)

If you have a SQL schema file, import it:

```bash
mysql -u root -p attendance-system < attendance_db.sql
```

### 3. Verify Tables

Ensure your database has the required tables:
- `admins`
- `employees`
- `attendance`
- `branches`
- `payroll_records`
- `logs`

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The backend uses a `.env` file for configuration. Create or update `backend/.env`:

```env
NODE_ENV=development

# Database
DATABASE_URL="mysql://root:@localhost:3306/attendance-system"

# Server
PORT=5000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# QR Code Settings
QR_VERSION=V2
QR_PREFIX=JAJR-EMP
```

**Important:** The `.env` file is in `.gitignore` and will never be committed to Git.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Start Backend Server

```bash
npm run dev
```

The backend will start on `http://localhost:5000`

**Verify it's running:** Open `http://localhost:5000/health` in your browser - you should see a JSON response with status "ok".

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Important:** The `.env.local` file is in `.gitignore` and will never be committed to Git.

### 4. Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Running Both Services

### Option 1: Separate Terminals (Recommended)

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Option 2: Single Terminal with Concurrently

Install concurrently:
```bash
npm install -g concurrently
```

Run both:
```bash
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

## Accessing the Application

Once both services are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

## Login Credentials

Use the admin credentials from your local database:

```sql
-- Check your admins table
SELECT * FROM admins;
```

Default credentials (if seeded):
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### Backend Issues

**Issue:** "Database connection failed"
- **Solution:**
  - Ensure MySQL is running
  - Verify DATABASE_URL in `backend/.env` is correct
  - Check that the database `attendance-system` exists

**Issue:** "Port 5000 already in use"
- **Solution:** 
  - Change PORT in `backend/.env` to a different port (e.g., 5001)
  - Update `frontend/.env.local` to match the new port

**Issue:** "Prisma client not generated"
- **Solution:** Run `npx prisma generate` in the backend directory

### Frontend Issues

**Issue:** "API connection failed" or "Network Error"
- **Solution:**
  - Ensure backend is running on port 5000
  - Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is correct
  - Check browser console for CORS errors

**Issue:** "Port 3000 already in use"
- **Solution:**
  - Stop the process using port 3000
  - Or run frontend on a different port: `npm run dev -- -p 3001`

**Issue:** Login fails in localhost but works in production
- **Solution:**
  - Ensure `frontend/.env.local` exists with correct API URL
  - Restart the frontend development server after creating `.env.local`

### Database Issues

**Issue:** "Table doesn't exist"
- **Solution:**
  - Import the SQL schema file
  - Or run Prisma migrations: `npx prisma migrate dev`

**Issue:** "Authentication failed"
- **Solution:**
  - Verify admin user exists in database
  - Check password is correctly hashed (bcrypt)
  - Use the reset script if needed

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Backend auto-restarts with `npm run dev`
   - Test API endpoints with Postman or browser

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Frontend auto-reloads with `npm run dev`
   - Test in browser at http://localhost:3000

### Database Changes

If you modify the Prisma schema:

```bash
cd backend
npx prisma migrate dev --name your_migration_name
npx prisma generate
```

## Useful Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Regenerate Prisma Client
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
```

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| DATABASE_URL | MySQL connection string | mysql://root:@localhost:3306/attendance-system |
| PORT | Backend server port | 5000 |
| JWT_SECRET | Secret for JWT tokens | - |
| JWT_EXPIRES_IN | JWT token expiration | 24h |
| QR_VERSION | QR code version | V2 |
| QR_PREFIX | QR code prefix | JAJR-EMP |

### Frontend (.env.local)
| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API base URL | http://localhost:5000/api |

## Security Notes

- Never commit `.env` or `.env.local` files to Git (they're in `.gitignore`)
- Use different JWT secrets for development and production
- Don't use production database credentials in development
- Keep your `.env` files secure and don't share them

## Production vs Development

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | `attendance-system` (local) | `attendance-system` (VPS) |
| Backend Port | 5000 | 5002 |
| Frontend Port | 3000 | 3001 |
| API URL | `http://localhost:5000/api` | `https://attendacev2.xandree.com/api` |
| Environment | development | production |

## Additional Resources

- [LOGIN_FLOW.md](./LOGIN_FLOW.md) - Detailed login flow documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment guide
- [SERVER_DEPLOYMENT_GUIDE.md](./SERVER_DEPLOYMENT_GUIDE.md) - Server administration guide

## Support

If you encounter issues not covered here:
1. Check the browser console for JavaScript errors
2. Check the backend terminal for server errors
3. Verify all environment variables are set correctly
4. Ensure MySQL is running and accessible
