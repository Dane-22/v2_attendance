# API Testing Guide for Timezone Fix

## Overview
Test the timezone fix using API calls to verify the backend returns correct `clock_in`/`clock_out` actions.

## Prerequisites
- Backend development server running on port 5002
- Valid authentication token (from login)
- Employee code for testing (e.g., `E0001`)

## Test Endpoints

### 1. Login to Get Token
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...}
  }
}
```

Copy the `token` value for subsequent requests.

### 2. Clock In Test
```bash
curl -X POST http://localhost:5002/api/attendance/clock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"qrCodeData":"E0001"}'
```

**Expected Response (Clock In):**
```json
{
  "success": true,
  "message": "Clocked in successfully at HH:MM:SS",
  "data": {
    "action": "clock_in",
    "employeeId": 123,
    "employeeName": "John Doe",
    "attendance": {...}
  }
}
```

**Verify:** `data.action` equals `"clock_in"`

### 3. Clock Out Test
```bash
curl -X POST http://localhost:5002/api/attendance/clock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"qrCodeData":"E0001"}'
```

**Expected Response (Clock Out):**
```json
{
  "success": true,
  "message": "Clocked out successfully at HH:MM:SS",
  "data": {
    "action": "clock_out",
    "employeeId": 123,
    "employeeName": "John Doe",
    "attendance": {...}
  }
}
```

**Verify:** `data.action` equals `"clock_out"`

### 4. Clock In Again (New Shift)
```bash
curl -X POST http://localhost:5002/api/attendance/clock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"qrCodeData":"E0001"}'
```

**Expected Response (Clock In):**
```json
{
  "success": true,
  "message": "Clocked in successfully at HH:MM:SS",
  "data": {
    "action": "clock_in",
    "employeeId": 123,
    "employeeName": "John Doe",
    "attendance": {...}
  }
}
```

**Verify:** `data.action` equals `"clock_in"` (new shift)

## Postman Collection

### Import Collection
Create a new Postman collection with these requests:

**Request 1: Login**
- Method: POST
- URL: `http://localhost:5002/api/auth/login`
- Body (raw JSON):
```json
{
  "username": "your_username",
  "password": "your_password"
}
```
- Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
pm.test("Token exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.exist;
    pm.environment.set("auth_token", jsonData.data.token);
});
```

**Request 2: Clock In/Out**
- Method: POST
- URL: `http://localhost:5002/api/attendance/clock`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "qrCodeData": "E0001"
}
```
- Tests:
```javascript
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
pm.test("Action field exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.action).to.exist;
    console.log("Action:", jsonData.data.action);
});
```

## Testing Scenarios

### Scenario 1: Fresh Clock In
1. Ensure employee has no active clock-in today (check database or clock out first)
2. Send clock request
3. **Expected:** `action: "clock_in"`

### Scenario 2: Clock Out
1. Clock in first (if not already)
2. Send clock request again
3. **Expected:** `action: "clock_out"`

### Scenario 3: Multiple Clock In/Out Cycles
1. Clock in → verify `clock_in`
2. Clock out → verify `clock_out`
3. Clock in → verify `clock_in`
4. Clock out → verify `clock_out`

### Scenario 4: Different QR Code Formats
Test with various QR code formats:
- Simple: `E0001`
- URL: `https://jajr.com/attendance/E0001`
- Pipe format: `JAJR-EMP:123|E0001|John Doe`

## Verification Checklist

- [ ] Clock in returns `action: "clock_in"`
- [ ] Clock out returns `action: "clock_out"`
- [ ] Multiple cycles work correctly
- [ ] No errors in backend console
- [ ] Database records created/updated correctly
- [ ] Different QR code formats work

## Troubleshooting

### Issue: "Employee not found"
**Solution:** Verify employee code exists in database

### Issue: "Employee account is not active"
**Solution:** Check employee status is "Active" in database

### Issue: "No active clock-in record found"
**Solution:** Clock in first before testing clock out

### Issue: "Duplicate scan ignored"
**Solution:** Wait 3 seconds between scans (recent scan prevention)

### Issue: 401 Unauthorized
**Solution:** Verify token is valid and not expired

## Database Verification

After each test, verify database records:

```sql
-- Check today's attendance for employee
SELECT * FROM attendance 
WHERE employee_id = 123 
AND date = CURDATE()
ORDER BY id DESC 
LIMIT 5;
```

Expected results:
- After clock in: record with `check_in` populated, `check_out` NULL
- After clock out: same record with `check_out` populated

## Success Criteria

The timezone fix is working correctly if:
1. Clock in consistently returns `action: "clock_in"`
2. Clock out consistently returns `action: "clock_out"`
3. No "timed in" when should be "timed out"
4. Database records have correct dates
5. No timezone-related errors in logs
