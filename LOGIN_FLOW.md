# Login Flow Documentation

## Overview
This document explains how the authentication system works in the JAJR Attendance System, including the login flow, API endpoints, and common issues with localhost vs production environments.

## Architecture
- **Frontend**: Next.js (React)
- **Backend**: Express.js with TypeScript
- **Database**: MySQL (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing

## Login Flow

### 1. Frontend Login Page
**Location**: `frontend/src/app/login/page.tsx`

The login page:
- Accepts username and password
- Calls the login API endpoint
- Stores the JWT token in localStorage
- Redirects based on user type (admin vs branch device)

**Key Code**:
```typescript
const loginMutation = useMutation({
  mutationFn: authApi.login,
  onSuccess: (response) => {
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Branch users go to QR scanner, admins to dashboard
    const isBranchUser = /^branch-[a-h]$/i.test(user.username);
    if (isBranchUser) {
      router.push('/branch/qr-scanner');
    } else {
      router.push('/dashboard');
    }
  },
});
```

### 2. API Configuration
**Location**: `frontend/src/lib/api.ts`

The API base URL is configured via environment variable:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

**Important**: The default is `http://localhost:5000/api` for development.

### 3. Backend Login Endpoint
**Location**: `backend/src/controllers/auth.controller.ts`

The login controller:
- Receives username and password
- Looks up the admin in the database
- Verifies password using bcrypt
- Generates a JWT token
- Returns the token and user data

**Key Code**:
```typescript
export const login = async (req, res, next) => {
  const { username, password } = req.body;

  // Find admin user
  const admin = await prisma.admins.findUnique({
    where: { username }
  });

  // Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, admin.password);
  
  // Generate JWT token
  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user: adminWithoutPassword }
  });
};
```

### 4. Authentication Middleware
**Location**: `backend/src/middleware/auth.middleware.ts`

The middleware:
- Extracts the Bearer token from the Authorization header
- Verifies the JWT token
- Fetches the admin from the database
- Attaches the admin to the request object

**Key Code**:
```typescript
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  const admin = await prisma.admins.findUnique({
    where: { id: decoded.adminId }
  });
  
  req.admin = admin;
  next();
};
```

### 5. API Interceptor
**Location**: `frontend/src/lib/api.ts`

The axios interceptor automatically adds the token to all requests:
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

It also handles 401 errors by clearing the token and redirecting to login:
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Environment Configuration

### Localhost Development

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="mysql://root:@localhost:3306/attendance-system"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
QR_VERSION=V2
QR_PREFIX=JAJR-EMP
```

**Important:** Both `.env.local` and `.env` files are in `.gitignore` and will never be committed to Git or deployed to production.

### Production

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://attendacev2.xandree.com/api
```

**Backend (.env):**
```env
NODE_ENV=production
PORT=5002
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/attendance-system"
JWT_SECRET=your-production-secret
JWT_EXPIRES_IN=24h
QR_VERSION=V2
QR_PREFIX=JAJR-EMP
```

For detailed local development setup instructions, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

---

## Common Issues: Localhost vs Production

### Issue 1: API URL Not Configured in Localhost

**Symptom**: Login works in production but fails in localhost with connection errors.

**Cause**: The frontend defaults to `http://localhost:5000/api`, but if the backend is running on a different port or the environment variable is not set, requests will fail.

**Solution**: Create `frontend/.env.local` with the correct API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Issue 2: Backend Not Running

**Symptom**: Login fails with "Network Error" or "ECONNREFUSED".

**Cause**: The backend server is not running or is running on the wrong port.

**Solution**: 
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Verify it's running on the correct port (default: 5000 for development)
3. Check the backend console for any errors

### Issue 3: Database Connection Issues

**Symptom**: Login fails with "Database connection error" or similar.

**Cause**: The database is not running or the connection string is incorrect.

**Solution**:
1. Ensure MySQL is running
2. Verify the `DATABASE_URL` in `backend/.env` is correct
3. Check if the database exists: `jajr_attendance` for development, `attendance-system` for production

### Issue 4: JWT Secret Mismatch

**Symptom**: Login succeeds but subsequent API calls fail with 401 "Invalid or expired token".

**Cause**: The JWT_SECRET is different between when the token was generated and when it's being verified (e.g., after a server restart with a new secret).

**Solution**: Ensure the `JWT_SECRET` is consistent across server restarts. Use a fixed secret in development:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Issue 5: CORS Issues

**Symptom**: Login fails with CORS errors in the browser console.

**Cause**: The backend CORS configuration doesn't allow requests from the frontend origin.

**Solution**: Ensure the backend CORS middleware allows the frontend origin (e.g., `http://localhost:3000`).

## Testing Login Flow

### 1. Test Backend Directly
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

### 2. Test Frontend
1. Open browser to `http://localhost:3000/login`
2. Enter valid credentials
3. Check browser console for errors
4. Check Network tab in DevTools to see API requests

### 3. Verify Token Storage
After successful login, check localStorage:
```javascript
// In browser console
localStorage.getItem('token')
localStorage.getItem('user')
```

## Database Schema

The `admins` table structure:
```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hash
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50),
  branch_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt
2. **JWT Tokens**: Tokens expire after 24 hours (configurable via `JWT_EXPIRES_IN`)
3. **HTTPS**: Always use HTTPS in production to prevent token interception
4. **JWT Secret**: Use a strong, random secret in production
5. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for better security)

## Troubleshooting Checklist

- [ ] Backend server is running on correct port (5000 for dev, 5002 for prod)
- [ ] Frontend `.env.local` exists with correct `NEXT_PUBLIC_API_URL`
- [ ] MySQL database is running and accessible
- [ ] Database connection string in backend `.env` is correct
- [ ] `JWT_SECRET` is set in backend environment
- [ ] Admin user exists in database with correct password hash
- [ ] CORS is configured correctly in backend
- [ ] No firewall blocking localhost connections
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows API requests are being made

## Support

If you continue to experience issues:
1. Check the backend console logs for errors
2. Check the browser console for errors
3. Verify all environment variables are set correctly
4. Ensure both frontend and backend are using compatible versions
