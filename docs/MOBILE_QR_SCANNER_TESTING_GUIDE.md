# Mobile QR Scanner Testing Guide

## Overview
This guide explains how to access your localhost development server from your phone to test the QR scanner functionality when your PC doesn't have a camera.

## Prerequisites
- PC and phone connected to the same Wi-Fi network
- Backend and frontend servers running on your PC
- Phone with a camera and web browser
- Postman installed on your PC (download from https://www.postman.com/downloads/)

## Postman Setup for QR Scanner API Testing

### Step 1: Install Postman
1. Download Postman from https://www.postman.com/downloads/
2. Run the installer and follow the setup wizard
3. Launch Postman and create an account (optional, but recommended for saving collections)
4. Sign in to your Postman account if you created one

### Step 2: Create a New Workspace
1. In Postman, click on "Workspaces" in the left sidebar
2. Click "Create New" → "New Workspace"
3. Name it: "Attendance System QR Scanner Testing"
4. Set visibility to "Personal" (or "Team" if collaborating)
5. Click "Create"

### Step 3: Set Up Environment Variables
1. In your new workspace, click on "Environments" in the left sidebar
2. Click "Add" to create a new environment
3. Name it: "Development"
4. Add the following variables:

| Variable Name | Initial Value | Current Value | Description |
|---------------|---------------|---------------|-------------|
| `base_url` | `http://localhost:5000/api` | `http://localhost:5000/api` | Backend API base URL (local testing) |
| `pc_ip` | `192.168.1.100` | `192.168.1.100` | Your PC's local IP address |
| `mobile_base_url` | `http://{{pc_ip}}:5000/api` | `http://{{pc_ip}}:5000/api` | API URL for mobile testing |
| `branch_token` | | | JWT token for branch authentication (will be set after login) |
| `employee_code` | | | Employee code for testing QR scan |

5. Replace `192.168.1.100` with your actual PC IP address (from Step 1 in main guide)
6. Click "Save"
7. Make sure to select this environment as active (click the dropdown in top-right corner)

### Step 4: Create API Collection
1. Click "Collections" in the left sidebar
2. Click "Create Collection" or the "+" button
3. Name it: "QR Scanner API"
4. Add description: "API endpoints for testing QR scanner functionality"
5. Click "Save"

### Step 5: Add Authentication Request
1. In the "QR Scanner API" collection, click "Add request"
2. Name it: "Branch Login"
3. Set request method to: `POST`
4. Set URL to: `{{mobile_base_url}}/auth/login`
5. Go to the "Body" tab
6. Select "raw" and "JSON" from the dropdowns
7. Add the following JSON body:
```json
{
  "username": "your_branch_username",
  "password": "your_branch_password"
}
```
8. Replace with actual branch credentials from your database
9. Go to the "Tests" tab and add this script to save the token:
```javascript
// Test if login was successful
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Save the token to environment variable
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("branch_token", jsonData.token);
    console.log("Token saved:", jsonData.token);
}
```
10. Click "Save"

### Step 6: Add QR Scan Verification Request
1. In the collection, click "Add request"
2. Name it: "Verify Employee QR Code"
3. Set request method to: `POST`
4. Set URL to: `{{mobile_base_url}}/qr/verify`
5. Go to the "Headers" tab
6. Add header:
   - Key: `Authorization`
   - Value: `Bearer {{branch_token}}`
7. Go to the "Body" tab
8. Select "raw" and "JSON"
9. Add the following JSON body:
```json
{
  "qrCode": "EMPLOYEE_QR_CODE_HERE"
}
```
10. Replace `EMPLOYEE_QR_CODE_HERE` with an actual employee QR code from your database
11. Go to the "Tests" tab and add:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has employee data", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('employee');
});

pm.test("Response has attendance action", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('action');
});
```
12. Click "Save"

### Step 7: Add Clock In Request
1. In the collection, click "Add request"
2. Name it: "Clock In"
3. Set request method to: `POST`
4. Set URL to: `{{mobile_base_url}}/attendance/clock-in`
5. Go to the "Headers" tab
6. Add header:
   - Key: `Authorization`
   - Value: `Bearer {{branch_token}}`
7. Go to the "Body" tab
8. Select "raw" and "JSON"
9. Add the following JSON body:
```json
{
  "employeeCode": "EMPLOYEE_CODE_HERE",
  "branchId": 1,
  "latitude": 14.5995,
  "longitude": 120.9842
}
```
10. Replace `EMPLOYEE_CODE_HERE` with actual employee code
11. Adjust `branchId`, `latitude`, and `longitude` as needed
12. Go to the "Tests" tab and add:
```javascript
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response has success status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```
13. Click "Save"

### Step 8: Add Clock Out Request
1. In the collection, click "Add request"
2. Name it: "Clock Out"
3. Set request method to: `POST`
4. Set URL to: `{{mobile_base_url}}/attendance/clock-out`
5. Go to the "Headers" tab
6. Add header:
   - Key: `Authorization`
   - Value: `Bearer {{branch_token}}`
7. Go to the "Body" tab
8. Select "raw" and "JSON"
9. Add the following JSON body:
```json
{
  "employeeCode": "EMPLOYEE_CODE_HERE",
  "branchId": 1,
  "latitude": 14.5995,
  "longitude": 120.9842
}
```
10. Replace `EMPLOYEE_CODE_HERE` with actual employee code
11. Adjust `branchId`, `latitude`, and `longitude` as needed
12. Go to the "Tests" tab and add:
```javascript
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response has success status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```
13. Click "Save"

### Step 9: Add Get Attendance History Request
1. In the collection, click "Add request"
2. Name it: "Get Attendance History"
3. Set request method to: `GET`
4. Set URL to: `{{mobile_base_url}}/attendance/?employeeCode=EMPLOYEE_CODE_HERE`
5. Go to the "Headers" tab
6. Add header:
   - Key: `Authorization`
   - Value: `Bearer {{branch_token}}`
7. Go to the "Tests" tab and add:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is an array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('array');
});
```
8. Click "Save"

### Step 10: Test the Collection
1. Make sure your backend server is running on port 5002
2. Make sure the "Development" environment is selected in Postman
3. Run requests in order:
   - First: "Branch Login" (this will save the token)
   - Then: "Verify Employee QR Code"
   - Then: "Clock In" or "Clock Out"
   - Finally: "Get Attendance History"
4. Check the response body and test results for each request

### Step 11: Run Collection as Automated Test
1. Click on the "QR Scanner API" collection
2. Click the "..." (more options) button
3. Select "Run collection"
4. This opens the Collection Runner
5. Select the "Development" environment
6. Choose which requests to run (or run all)
7. Click "Run QR Scanner API"
8. Review the test results in the runner

### Step 12: Export and Share Collection (Optional)
1. Click on the "QR Scanner API" collection
2. Click the "..." button
3. Select "Export"
4. Choose format: "Collection v2.1"
5. Save the JSON file
6. You can share this file with team members or import it on another machine

### Step 13: Import Collection (If Receiving from Team)
1. In Postman, click "Import" in the top-left
2. Drag and drop the collection JSON file
3. Or click "Upload Files" and select the file
4. Postman will import the collection with all requests and tests

### Step 14: Set Up Request Pre-Script for Automatic Token Refresh
1. Click on the "QR Scanner API" collection
2. Go to the "Pre-request Script" tab
3. Add this script to automatically include the token:
```javascript
// Automatically add Authorization header if token exists
const token = pm.environment.get("branch_token");
if (token) {
    pm.request.headers.add({
        key: 'Authorization',
        value: `Bearer ${token}`
    });
}
```
4. This eliminates the need to manually add the Authorization header to each request

### Step 15: Create Folder Structure in Collection
1. In the "QR Scanner API" collection, click "Add folder"
2. Name it: "Authentication"
3. Move "Branch Login" request into this folder
4. Create another folder named "Attendance"
5. Move "Verify Employee QR Code", "Clock In", "Clock Out", and "Get Attendance History" into this folder
6. This keeps your collection organized

### Step 16: Add Documentation to Requests
1. Click on any request
2. Go to the "Documentation" tab (looks like a document icon)
3. Add a description explaining what the request does
4. Include example responses and error scenarios
5. This helps other team members understand the API

### Step 17: Monitor Response Times
1. After running requests, look at the response time displayed next to the status code
2. This helps identify slow endpoints
3. For QR scanner, responses should be under 500ms for good UX

### Step 18: Debug Failed Requests
1. If a request fails, check the "Console" at the bottom of Postman
2. Look for error messages and stack traces
3. Check the "Headers" tab to see what was actually sent
4. Compare with expected headers in your API documentation

## Step 1: Find Your PC's Local IP Address

### Windows
1. Open Command Prompt (Win+R, type `cmd`, press Enter)
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your network adapter (usually `192.168.x.x` or `10.0.x.x`)
4. Note this address (e.g., `192.168.1.100`)

### Alternative Method
1. Open Settings → Network & Internet → Properties
2. Look for IPv4 address

## Step 2: Configure Backend to Accept External Connections

### Option A: If Using Development Server
By default, development servers bind to `localhost` only. You need to change this to bind to all network interfaces.

**Backend (Express/Node.js):**
```bash
# Instead of:
npm run dev

# Use:
HOST=0.0.0.0 npm run dev
```

Or modify your `package.json`:
```json
{
  "scripts": {
    "dev": "HOST=0.0.0.0 nodemon src/index.ts"
  }
}
```

**Frontend (Next.js):**
```bash
# Instead of:
npm run dev

# Use:
HOST=0.0.0.0 npm run dev
```

Or create/modify `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  hostname: '0.0.0.0',
  port: 3000,
}

module.exports = nextConfig
```

### Option B: If Using Production Build with PM2
PM2 should already be configured to accept external connections. Verify your ecosystem file or startup script doesn't restrict to localhost.

## Step 3: Configure Frontend API URL

The frontend needs to know the backend's IP address to make API calls from your phone.

### Temporary Method (for testing)
1. On your phone, access the frontend
2. Open browser developer tools (if available) or check network requests
3. The API calls will fail - this is expected

### Permanent Method
Update the frontend environment variable:

**Development:**
```bash
# In frontend directory
echo "NEXT_PUBLIC_API_URL=http://YOUR_PC_IP:5002/api" > .env.local
```

Replace `YOUR_PC_IP` with your actual IP (e.g., `192.168.1.100`)

**Production Build:**
```bash
echo "NEXT_PUBLIC_API_URL=https://your-domain.com/api" > .env.local
```

## Step 4: Access from Your Phone

### Frontend (QR Scanner Page)
1. Open browser on your phone
2. Navigate to: `http://YOUR_PC_IP:3000/branch/qr-scanner`
3. Replace `YOUR_PC_IP` with your actual IP address
4. Login with branch credentials

### Backend API (for testing)
1. Navigate to: `http://YOUR_PC_IP:5002/api/health` (if health endpoint exists)
2. You should see a JSON response

## Step 5: Windows Firewall Configuration

If you can't access the server from your phone, Windows Firewall might be blocking the connection.

### Allow Node.js/Backend through Firewall
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" (requires admin)
4. Find "Node.js" or click "Allow another app"
5. Browse to your Node.js executable (usually in `C:\Program Files\nodejs\node.exe`)
6. Check both "Private" and "Public" networks
7. Click OK

### Allow Specific Ports (Alternative)
1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" → Specific local ports: `3000,5002`
5. Select "Allow the connection"
6. Check all profiles (Domain, Private, Public)
7. Name: "Node.js Development Servers"

## Step 6: Test QR Scanner

1. On your phone, navigate to the QR scanner page
2. Point camera at a QR code (employee QR code)
3. Verify:
   - Camera activates
   - QR code is detected
   - Clock in/out message displays correctly
   - No console errors

## Troubleshooting

### Issue: "Connection Refused" or "ERR_CONNECTION_REFUSED"
**Solutions:**
- Verify PC and phone are on same Wi-Fi network
- Check if servers are running on PC
- Verify firewall settings (Step 5)
- Try pinging PC IP from phone (use terminal app)

### Issue: "Network Error" in API calls
**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running on port 5002
- Verify backend accepts external connections (Step 2)
- Check browser console for CORS errors

### Issue: Camera not working on phone
**Solutions:**
- Ensure browser has camera permissions
- Try different browser (Chrome, Firefox, Safari)
- Check if HTTPS is required (some browsers block camera on HTTP)
- For testing, you may need to use HTTPS or enable insecure flags

### Issue: Very slow loading
**Solutions:**
- Check Wi-Fi signal strength
- Verify PC isn't firewall-throttling
- Close other network-intensive applications

## Security Notes

⚠️ **Important for Development Only:**
- These settings expose your development server to your local network
- Only use on trusted home/office networks
- Don't expose to public internet
- Revert to localhost-only when done testing
- Don't commit `.env.local` with public IP to version control

## Alternative: Use ngrok (Tunneling)

If network configuration is difficult, use ngrok to create a secure tunnel:

### Install ngrok
1. Download from https://ngrok.com/download
2. Extract and add to PATH

### Use ngrok
```bash
# Tunnel backend
ngrok http 5002

# Tunnel frontend (in separate terminal)
ngrok http 3000
```

### Access from Phone
1. ngrok will provide a URL like `https://abc123.ngrok.io`
2. Use this URL on your phone instead of IP address
3. Update frontend API URL to use ngrok backend URL

## Quick Reference Commands

```bash
# Find IP address (Windows)
ipconfig

# Start backend with external access
cd backend
HOST=0.0.0.0 npm run dev

# Start frontend with external access
cd frontend
HOST=0.0.0.0 npm run dev

# Set API URL for mobile testing
cd frontend
echo "NEXT_PUBLIC_API_URL=http://192.168.1.100:5002/api" > .env.local

# Test connection from phone
# Open: http://192.168.1.100:3000/branch/qr-scanner
```

## Testing Checklist

- [ ] PC and phone on same Wi-Fi
- [ ] Backend running on port 5002
- [ ] Frontend running on port 3000
- [ ] Both servers accept external connections (0.0.0.0)
- [ ] Firewall allows ports 3000 and 5002
- [ ] Frontend API URL configured correctly
- [ ] Can access frontend from phone browser
- [ ] Camera permissions granted on phone
- [ ] QR code scanning works
- [ ] Clock in/out messages display correctly
