# JAJR Attendance & Payroll System - Standard Operating Procedure (SOP)

## Table of Contents
1. [Purpose & Scope](#purpose--scope)
2. [System Access & Login](#system-access--login)
3. [Employee Management](#employee-management)
4. [Attendance Tracking](#attendance-tracking)
5. [Payroll Processing](#payroll-processing)
6. [Branch Management](#branch-management)
7. [Document Management](#document-management)
8. [Reporting & Analytics](#reporting--analytics)
9. [System Administration](#system-administration)
10. [Backup & Recovery](#backup--recovery)
11. [Security Procedures](#security-procedures)
12. [Troubleshooting Procedures](#troubleshooting-procedures)
13. [Emergency Procedures](#emergency-procedures)
14. [Maintenance Schedule](#maintenance-schedule)

---

## Purpose & Scope

### Purpose
This Standard Operating Procedure (SOP) document provides step-by-step instructions for operating the JAJR Attendance & Payroll System. It ensures consistent and efficient system operations across all branches and administrative functions.

### Scope
This SOP applies to:
- System Administrators
- HR Personnel
- Branch Managers
- Payroll Officers
- All authorized system users

### Document Control
- **Version:** 1.0
- **Effective Date:** April 2026
- **Review Date:** April 2027
- **Approved By:** System Administrator
- **Owner:** Development Team

---

## System Access & Login

### 1. Admin Login Procedure

**Prerequisites:**
- Valid admin username and password
- Internet connection
- Supported web browser (Chrome, Firefox, Edge, Safari)

**Steps:**

1. **Access the System**
   - Navigate to: `https://attendacev2.xandree.com`
   - Wait for the login page to load

2. **Enter Credentials**
   - Input username in the "Username" field
   - Input password in the "Password" field
   - Ensure Caps Lock is off (passwords are case-sensitive)

3. **Authenticate**
   - Click the "Login" button
   - Wait for authentication to complete
   - Successful login redirects to dashboard

4. **Verify Session**
   - Confirm dashboard loads correctly
   - Check user profile in top-right corner
   - Verify correct branch access (if applicable)

**Troubleshooting:**
- **Login fails:** Verify credentials, check internet connection, contact administrator
- **Page not loading:** Clear browser cache, try different browser, check server status
- **Session expires:** Re-login with credentials, token expires after 24 hours

### 2. Branch Device Login Procedure

**Prerequisites:**
- Branch device credentials (username: branch-[a-h])
- QR scanner access
- Stable internet connection

**Steps:**

1. **Access Branch Login**
   - Navigate to system URL
   - Login page will detect branch device

2. **Enter Branch Credentials**
   - Username format: `branch-[a-h]` (e.g., `branch-a`)
   - Enter branch-specific password
   - Click "Login"

3. **Access QR Scanner**
   - System automatically redirects to QR scanner
   - Grant camera permissions if prompted
   - Scanner interface loads

**Security Notes:**
- Branch credentials are device-specific
- Do not share branch device credentials
- Report lost credentials immediately

---

## Employee Management

### 1. Adding New Employees

**Responsible Role:** HR Personnel / Admin

**Prerequisites:**
- Admin access
- Employee personal information
- Employee position details
- Branch assignment

**Steps:**

1. **Navigate to Employee Management**
   - Login to admin dashboard
   - Go to: Dashboard → Employees
   - Click "Add Employee" button

2. **Enter Employee Information**
   
   **Personal Details:**
   - First Name (required)
   - Middle Name (optional)
   - Last Name (required)
   - Email (unique, required)
   
   **Employment Details:**
   - Employee Code (auto-generated or manual)
   - Department (required)
   - Position (required)
   - Branch Assignment (required)
   - Daily Rate (decimal format, required)
   
   **Financial Details:**
   - Has Deductions (yes/no)
   - Performance Allowance (optional)
   
3. **Upload Profile Photo**
   - Click "Upload Photo" button
   - Select image file (JPG/PNG, max 5MB)
   - Wait for upload confirmation
   - Preview displays uploaded photo

4. **Save Employee Record**
   - Review all entered information
   - Click "Save" button
   - Confirm success message
   - QR code auto-generated

5. **Generate and Print QR Code**
   - Locate new employee in list
   - Click "View QR Code" button
   - Download QR code image
   - Print QR code (200x200 pixels recommended)
   - Laminate QR code for durability

**Verification:**
- Confirm employee appears in employee list
- Verify QR code scans correctly
- Test attendance recording with new QR code

### 2. Updating Employee Information

**Responsible Role:** HR Personnel / Admin

**Steps:**

1. **Locate Employee**
   - Navigate to Dashboard → Employees
   - Search by name or employee code
   - Click on employee record

2. **Edit Information**
   - Click "Edit" button
   - Update required fields
   - Upload new photo if needed
   - Click "Save Changes"

3. **Verify Updates**
   - Confirm changes saved
   - Review updated employee profile
   - Notify employee of changes (if applicable)

**Important Notes:**
- Employee code cannot be changed after creation
- Branch changes affect attendance records
- Financial changes apply to future payroll only

### 3. Deactivating Employees

**Responsible Role:** HR Personnel / Admin

**Steps:**

1. **Locate Employee**
   - Navigate to Dashboard → Employees
   - Search for employee
   - Click on employee record

2. **Deactivate Account**
   - Click "Deactivate" button
   - Confirm deactivation action
   - Select reason (resignation, termination, etc.)
   - Add notes if required

3. **Verify Deactivation**
   - Employee status changes to "Inactive"
   - QR code becomes invalid
   - Attendance recording disabled

**Data Retention:**
- Employee records retained in database
- Historical attendance records preserved
- Payroll records maintained
- Documents archived

### 4. Transferring Employees Between Branches

**Responsible Role:** HR Personnel / Admin

**Steps:**

1. **Locate Employee**
   - Navigate to Dashboard → Employees
   - Search for employee

2. **Initiate Transfer**
   - Click "Transfer Branch" button
   - Select new branch from dropdown
   - Enter effective date
   - Add transfer notes

3. **Confirm Transfer**
   - Review transfer details
   - Click "Confirm Transfer"
   - System updates branch assignment

**Impact:**
- Attendance records show branch history
- Payroll calculations use current branch
- QR code remains valid
- Historical data preserved

---

## Attendance Tracking

### 1. QR Code Scanning (Time In)

**Responsible Role:** Branch Device / Security Guard

**Prerequisites:**
- Branch device logged in
- Camera functional
- Employee QR code available
- Stable internet connection

**Steps:**

1. **Prepare Scanner**
   - Ensure branch device is logged in
   - Open QR scanner interface
   - Grant camera permissions if prompted
   - Wait for camera to initialize

2. **Scan Employee QR Code**
   - Hold employee QR code 10-15cm from camera
   - Ensure QR code is clearly visible
   - Wait for scan confirmation (beep/visual)
   - Verify employee name on screen

3. **Confirm Time In**
   - Check displayed time is correct
   - Verify "Time In" status
   - System records attendance automatically

4. **Handle Special Cases**
   
   **Late Arrival:**
   - System marks as "Late" if after 9:00 AM
   - Note reason if required
   - Employee acknowledges late status
   
   **Weekend/Holiday:**
   - System displays warning
   - Confirm if work is authorized
   - Add notes if overtime

**Error Handling:**
- **Invalid QR Code:** Request employee to verify QR code
- **Already Clocked In:** Display message, no action needed
- **Employee Not Found:** Verify employee status, contact HR
- **Network Error:** Retry scan, check internet connection

### 2. QR Code Scanning (Time Out)

**Responsible Role:** Branch Device / Security Guard

**Steps:**

1. **Scan Employee QR Code**
   - Same procedure as Time In
   - System detects active Time In
   - Automatically records Time Out

2. **Verify Time Out**
   - Check displayed time is correct
   - Verify "Time Out" status
   - System calculates work duration

3. **Handle Special Cases**
   
   **Early Departure:**
   - System records actual time
   - Note reason if required
   - May affect daily rate calculation
   
   **Overtime:**
   - System calculates overtime hours
   - Verify overtime authorization
   - Add notes if applicable

### 3. Manual Clock-In/Out

**Responsible Role:** Admin / Branch Manager

**When to Use:**
- QR code scanner malfunction
- Employee forgot QR code
- System downtime
- Remote approval required

**Steps:**

1. **Navigate to Attendance Page**
   - Login to admin dashboard
   - Go to Dashboard → Attendance
   - Select branch

2. **Locate Employee**
   - Search by name or employee code
   - View employee status

3. **Manual Clock-In**
   - Click "Clock In" button
   - Select employee
   - Enter time (default: current time)
   - Add notes if required
   - Click "Confirm"

4. **Manual Clock-Out**
   - Click "Clock Out" button
   - Select employee
   - Enter time (default: current time)
   - Add notes if required
   - Click "Confirm"

**Audit Trail:**
- Manual entries logged separately
- Requires authorization
- Notes mandatory for audit purposes

### 4. Marking Absence

**Responsible Role:** Admin / Branch Manager

**Steps:**

1. **Navigate to Attendance Page**
   - Go to Dashboard → Attendance
   - Select branch and date

2. **Identify Absent Employees**
   - Review employee list
   - Employees without time-in marked as "Available"

3. **Mark as Absent**
   - Click "Mark Absent" button
   - Select employee(s)
   - Select absence reason (sick, leave, unauthorized)
   - Add notes if required
   - Click "Confirm"

**Impact:**
- Attendance status changes to "Absent"
- Daily rate may be affected
- Payroll calculation adjusted

---

## Payroll Processing

### 1. Weekly Payroll Generation

**Responsible Role:** Payroll Officer / Admin

**Prerequisites:**
- All attendance recorded for the week
- Employee rates verified
- Deduction rates updated
- Overtime approved

**Steps:**

1. **Navigate to Payroll Module**
   - Login to admin dashboard
   - Go to Dashboard → Payroll

2. **Select Payroll Period**
   - Choose week start date
   - Choose week end date
   - System auto-calculates week number

3. **Generate Payroll**
   - Click "Generate Payroll" button
   - System processes all employees
   - Wait for calculation completion

4. **Review Calculations**
   
   **For Each Employee:**
   - Days worked: Verify count
   - Basic pay: (days × daily rate)
   - Overtime hours: Verify overtime
   - Overtime amount: (hours × rate × 1.5)
   - Performance allowance: Verify amount
   - Gross pay: Sum of above
   - Deductions: Verify rates
     - SSS contribution
     - PhilHealth contribution
     - HDMF contribution
     - Cash advance
   - Net pay: Gross - Deductions

5. **Adjust if Necessary**
   - Click "Edit" for individual employee
   - Adjust values as needed
   - Add adjustment notes
   - Save changes

6. **Approve Payroll**
   - Review entire payroll summary
   - Click "Approve" button
   - Confirm approval
   - Status changes to "Processed"

7. **Generate Payslips**
   - Click "Generate Payslips" button
   - Select format (PDF)
   - Download payslips
   - Distribute to employees

**Verification:**
- Total payroll amount matches budget
- All employees included
- No calculation errors
- Deductions accurate

### 2. Payroll Adjustment

**Responsible Role:** Payroll Officer / Admin

**When to Use:**
- Calculation errors discovered
- Retroactive rate changes
- Missing overtime
- Deduction corrections

**Steps:**

1. **Locate Payroll Record**
   - Go to Dashboard → Payroll
   - Find payroll period
   - Click on payroll record

2. **Unlock Payroll**
   - Click "Unlock" button
   - Provide authorization
   - Status changes to "Draft"

3. **Make Adjustments**
   - Select employee to adjust
   - Edit required fields
   - Add adjustment notes
   - Save changes

4. **Recalculate**
   - System auto-recalculates totals
   - Verify new calculations
   - Check impact on net pay

5. **Re-approve**
   - Review adjustments
   - Click "Approve" button
   - Regenerate payslips if needed

**Audit Requirements:**
- All adjustments logged
- Notes mandatory
- Authorization required
- Original values preserved in logs

### 3. Cash Advance Management

**Responsible Role:** Admin / Finance Officer

**Steps:**

1. **Request Cash Advance**
   - Navigate to Employee Profile
   - Click "Request Cash Advance"
   - Enter amount
   - Select repayment period
   - Add reason
   - Submit for approval

2. **Approve Cash Advance**
   - Admin reviews request
   - Verify employee eligibility
   - Check available balance
   - Approve or reject
   - Notify employee

3. **Deduct from Payroll**
   - Cash advance auto-deducted from next payroll
   - Deduction appears in payroll record
   - Employee receives net pay minus deduction

**Limits:**
- Maximum cash advance: 50% of monthly salary
- Repayment: Maximum 3 months
- One active cash advance per employee

---

## Branch Management

### 1. Adding New Branch

**Responsible Role:** System Administrator

**Prerequisites:**
- Admin access
- Branch details
- Branch device credentials

**Steps:**

1. **Navigate to Branch Management**
   - Login to admin dashboard
   - Go to Dashboard → Settings → Branches

2. **Add New Branch**
   - Click "Add Branch" button
   - Enter branch code (unique, e.g., "I")
   - Enter branch name
   - Enter address
   - Enter contact number
   - Set status to "Active"
   - Click "Save"

3. **Create Branch User**
   - Go to Branch Users
   - Click "Add Branch User"
   - Enter username: `branch-[code]` (e.g., `branch-i`)
   - Set password
   - Assign branch code
   - Click "Save"

4. **Configure Branch Device**
   - Deploy branch device to location
   - Login with branch user credentials
   - Test QR scanner
   - Verify connectivity

**Verification:**
- Branch appears in branch list
- Branch device can login
- QR scanner functions correctly
- Attendance records to correct branch

### 2. Updating Branch Information

**Responsible Role:** System Administrator

**Steps:**

1. **Locate Branch**
   - Go to Dashboard → Settings → Branches
   - Find branch in list
   - Click on branch

2. **Update Information**
   - Edit branch name, address, or contact
   - Click "Save Changes"
   - Verify updates

**Important:**
- Branch code cannot be changed
- Status change affects all branch operations
- Deactivation disables branch device

### 3. Branch Device Troubleshooting

**Common Issues:**

**Camera Not Working:**
1. Check camera permissions
2. Restart device
3. Update browser/app
4. Test camera in other applications

**Scanner Not Scanning:**
1. Ensure good lighting
2. Clean camera lens
3. Hold QR code at correct distance
4. Verify QR code is not damaged

**Network Issues:**
1. Check internet connection
2. Test connectivity
3. Restart router if needed
4. Contact IT support

---

## Document Management

### 1. Uploading Employee Documents

**Responsible Role:** HR Personnel / Admin

**Supported Document Types:**
- Resume
- SSS ID/Contributions
- TIN ID
- PhilHealth ID
- Birth Certificate
- PDS (Personal Data Sheet)
- Cover Letter
- Application Letter
- Clearance

**Steps:**

1. **Navigate to Employee Profile**
   - Go to Dashboard → Employees
   - Click on employee
   - Go to Documents tab

2. **Upload Document**
   - Click "Upload Document" button
   - Select document type from dropdown
   - Click "Choose File"
   - Select file (max 10MB)
   - Click "Upload"

3. **Verify Upload**
   - Confirm document appears in list
   - Check file size and type
   - Verify document is accessible

**File Requirements:**
- PDF, JPG, PNG formats only
- Maximum file size: 10MB
- Clear, readable documents
- No password protection

### 2. Archiving Documents

**Responsible Role:** HR Personnel / Admin

**When to Archive:**
- Employee deactivated
- Document outdated
- Storage optimization needed

**Steps:**

1. **Locate Document**
   - Go to Employee Profile → Documents
   - Find document to archive

2. **Archive Document**
   - Click "Archive" button
   - Confirm archive action
   - Document moved to archive

**Archive Access:**
- Archived documents not visible in main list
- Can be restored if needed
- Retained per data retention policy

### 3. Document Retrieval

**Responsible Role:** HR Personnel / Admin

**Steps:**

1. **Navigate to Documents**
   - Go to Dashboard → Documents
   - Filter by employee or document type

2. **Download Document**
   - Click on document
   - Click "Download" button
   - Save to local device

**Security:**
- Document access logged
- Download authorization required
- Sensitive documents protected

---

## Reporting & Analytics

### 1. Daily Attendance Report

**Responsible Role:** Admin / Branch Manager

**Steps:**

1. **Navigate to Reports**
   - Go to Dashboard → Reports
   - Select "Daily Attendance"

2. **Select Date**
   - Choose report date
   - Select branch (optional)
   - Click "Generate"

3. **Review Report**
   - Total employees
   - Present count
   - Absent count
   - Late count
   - On-time percentage

4. **Export Report**
   - Click "Export" button
   - Select format (CSV/Excel/PDF)
   - Download report

### 2. Monthly Summary Report

**Responsible Role:** Admin / HR Personnel

**Steps:**

1. **Navigate to Reports**
   - Go to Dashboard → Reports
   - Select "Monthly Summary"

2. **Select Month**
   - Choose month and year
   - Select branch (optional)
   - Click "Generate"

3. **Review Report**
   - Total working days
   - Average attendance
   - Trend analysis
   - Branch comparison

4. **Export Report**
   - Click "Export" button
   - Select format
   - Download report

### 3. Payroll Report

**Responsible Role:** Payroll Officer / Admin

**Steps:**

1. **Navigate to Reports**
   - Go to Dashboard → Reports
   - Select "Payroll"

2. **Select Period**
   - Choose payroll period
   - Select branch (optional)
   - Click "Generate"

3. **Review Report**
   - Total payroll amount
   - Breakdown by employee
   - Deduction summary
   - Overtime summary

4. **Export Report**
   - Click "Export" button
   - Select format
   - Download report

---

## System Administration

### 1. User Management

**Adding New Admin User:**

**Responsible Role:** Super Admin

**Steps:**

1. **Navigate to Admin Users**
   - Go to Dashboard → Settings → Admin Users

2. **Add New Admin**
   - Click "Add Admin" button
   - Enter username (unique)
   - Enter password (minimum 8 characters)
   - Enter name
   - Enter email
   - Select role (super_admin / admin)
   - Assign branch (if applicable)
   - Click "Save"

3. **Configure Permissions** (if enabled)
   - Enable permissions system
   - Select specific permissions
   - Click "Save"

**Updating Admin User:**

1. Locate admin user
2. Click "Edit"
3. Update information
4. Click "Save Changes"

**Deactivating Admin User:**

1. Locate admin user
2. Click "Deactivate"
3. Confirm action
4. User cannot login

### 2. System Configuration

**QR Code Settings:**

**Responsible Role:** System Administrator

**Steps:**

1. **Navigate to Settings**
   - Go to Dashboard → Settings
   - Select "QR Code Configuration"

2. **Configure Settings**
   - QR Version: V2 (default)
   - QR Prefix: JAJR-EMP (default)
   - QR Size: 200x200 pixels (default)
   - Click "Save"

**Rate Limiting Configuration:**

1. **Navigate to Settings**
   - Go to Dashboard → Settings
   - Select "Rate Limiting"

2. **Configure Limits**
   - User requests per minute: 100 (default)
   - IP requests per minute: 500 (default)
   - Global requests per minute: 10000 (default)
   - Action-specific limits
   - Click "Save"

**Log Retention Configuration:**

1. **Navigate to Settings**
   - Go to Dashboard → Settings
   - Select "Log Retention"

2. **Configure Retention**
   - Login logs: 365 days
   - Employee logs: 180 days
   - Attendance logs: 90 days
   - Payroll logs: 365 days
   - Default: 90 days
   - Click "Save"

### 3. Monitoring System Health

**Daily Checks:**

1. **Check Server Status**
   - Login to VPS
   - Run: `pm2 status`
   - Verify all processes running

2. **Check Database Connectivity**
   - Run: `mysql -u root -p -e "SELECT 1"`
   - Verify connection successful

3. **Check Disk Space**
   - Run: `df -h`
   - Ensure sufficient space available

4. **Check Error Logs**
   - Run: `pm2 logs v2-attendance-api --err --lines 50`
   - Review for critical errors

5. **Check WebSocket Connections**
   - Monitor active connections
   - Verify real-time features working

**Weekly Checks:**

1. **Review Activity Logs**
   - Check for unusual activity
   - Verify login patterns
   - Review failed attempts

2. **Backup Verification**
   - Verify backup completed
   - Test backup restore
   - Check backup integrity

3. **Performance Review**
   - Check response times
   - Monitor resource usage
   - Identify bottlenecks

---

## Backup & Recovery

### 1. Database Backup Procedure

**Automated Daily Backup:**

**Schedule:** Daily at 2:00 AM

**Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/var/backups/attendance-system"
mysqldump -u root -pPASSWORD attendance-system > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql
```

**Retention:** 30 days

### 2. Manual Backup Procedure

**Responsible Role:** System Administrator

**Steps:**

1. **Login to VPS**
   ```bash
   ssh root@72.62.254.60
   ```

2. **Create Backup**
   ```bash
   mysqldump -u root -p attendance-system > backup_manual_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Compress Backup**
   ```bash
   gzip backup_manual_*.sql
   ```

4. **Download Backup**
   ```bash
   scp root@72.62.254.60:/path/to/backup.gz ./local_backup.gz
   ```

### 3. Restore Procedure

**Responsible Role:** System Administrator

**Prerequisites:**
- Backup file available
- Database access
- System downtime acceptable

**Steps:**

1. **Stop Services**
   ```bash
   pm2 stop v2-attendance-api
   pm2 stop v2-attendance-web
   ```

2. **Create Current Backup**
   ```bash
   mysqldump -u root -p attendance-system > backup_before_restore.sql
   ```

3. **Drop Database**
   ```bash
   mysql -u root -p -e "DROP DATABASE attendance-system"
   ```

4. **Create Database**
   ```bash
   mysql -u root -p -e "CREATE DATABASE attendance-system"
   ```

5. **Restore Backup**
   ```bash
   gunzip backup_file.gz
   mysql -u root -p attendance-system < backup_file.sql
   ```

6. **Run Migrations**
   ```bash
   cd /var/www/version2_attendance/backend
   npx prisma migrate deploy
   ```

7. **Restart Services**
   ```bash
   pm2 restart v2-attendance-api
   pm2 restart v2-attendance-web
   ```

8. **Verify Restore**
   - Login to system
   - Verify data integrity
   - Test key functions

### 4. File Backup Procedure

**Uploads Directory Backup:**

**Schedule:** Weekly

**Steps:**

1. **Archive Uploads**
   ```bash
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/version2_attendance/backend/public/uploads
   ```

2. **Transfer to Backup Location**
   ```bash
   scp uploads_backup_*.tar.gz backup-server:/backups/
   ```

---

## Security Procedures

### 1. Password Management

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Password Change Procedure:**

1. **Login to System**
2. **Navigate to Profile**
3. **Click "Change Password"**
4. **Enter current password**
5. **Enter new password**
6. **Confirm new password**
7. **Click "Update Password"**

**Password Reset (Admin):**

1. **Navigate to Admin Users**
2. **Locate user**
3. **Click "Reset Password"**
4. **Enter temporary password**
5. **Notify user
6. **User must change on next login**

### 2. Session Management

**Automatic Logout:**
- Session expires after 24 hours
- Auto-logout on inactivity (configurable)
- Manual logout available

**Session Termination:**

1. **Click "Logout" button**
2. **Confirm logout**
3. **Session cleared**
4. **Redirected to login**

### 3. Access Control Review

**Quarterly Review:**

1. **Review Active Users**
   - List all admin users
   - Identify inactive accounts
   - Deactivate unnecessary accounts

2. **Review Permissions**
   - Verify user roles
   - Check branch assignments
   - Review permission settings

3. **Audit Access Logs**
   - Review login history
   - Check for unusual patterns
   - Investigate failed attempts

### 4. Security Incident Response

**Types of Incidents:**
- Unauthorized access attempt
- Data breach
- System compromise
- Malware infection

**Response Steps:**

1. **Identify Incident**
   - Monitor logs
   - User reports
   - Automated alerts

2. **Contain Incident**
   - Disable affected accounts
   - Isolate affected systems
   - Change compromised credentials

3. **Eradicate Threat**
   - Remove malware
   - Patch vulnerabilities
   - Close security gaps

4. **Recover Systems**
   - Restore from clean backup
   - Verify system integrity
   - Resume operations

5. **Document Incident**
   - Create incident report
   - Document timeline
   - Identify root cause

6. **Prevent Recurrence**
   - Implement security improvements
   - Update procedures
   - Train staff

---

## Troubleshooting Procedures

### 1. System Not Loading

**Symptoms:**
- Page not loading
- Timeout errors
- Blank screen

**Troubleshooting Steps:**

1. **Check Server Status**
   ```bash
   pm2 status
   ```
   - Verify processes running
   - Restart if stopped

2. **Check Network Connection**
   - Ping server
   - Check internet connection
   - Verify DNS resolution

3. **Clear Browser Cache**
   - Clear cookies
   - Clear cache
   - Try incognito mode

4. **Check Browser Console**
   - Open developer tools
   - Review JavaScript errors
   - Check network requests

5. **Contact Support**
   - Document error messages
   - Provide screenshots
   - Report to IT support

### 2. Database Connection Failed

**Symptoms:**
- "Database connection error" message
- Login failures
- Data not loading

**Troubleshooting Steps:**

1. **Check MySQL Service**
   ```bash
   systemctl status mysql
   ```
   - Start if stopped: `systemctl start mysql`

2. **Verify Database Credentials**
   - Check .env file
   - Verify username/password
   - Test connection manually

3. **Check Database Exists**
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

4. **Check Database Connectivity**
   ```bash
   mysql -u root -p attendance-system -e "SELECT 1"
   ```

5. **Review Error Logs**
   ```bash
   pm2 logs v2-attendance-api --err
   ```

### 3. QR Scanner Not Working

**Symptoms:**
- Camera not opening
- Scanner not detecting QR codes
- Scan errors

**Troubleshooting Steps:**

1. **Check Camera Permissions**
   - Grant camera permissions
   - Check browser settings
   - Allow camera access

2. **Check Camera Hardware**
   - Test camera in other apps
   - Clean camera lens
   - Restart device

3. **Check Lighting Conditions**
   - Ensure adequate lighting
   - Avoid glare
   - Adjust QR code angle

4. **Verify QR Code Quality**
   - Check QR code is not damaged
   - Ensure QR code is clear
   - Reprint if needed

5. **Test with Different QR Code**
   - Use known working QR code
   - Verify scanner functionality

### 4. Payroll Calculation Errors

**Symptoms:**
- Incorrect calculations
- Missing employees
- Wrong deduction amounts

**Troubleshooting Steps:**

1. **Verify Employee Data**
   - Check daily rates
   - Verify deductions settings
   - Review performance allowance

2. **Check Attendance Data**
   - Verify attendance records
   - Check time-in/time-out
   - Review overtime approvals

3. **Recalculate Payroll**
   - Unlock payroll
   - Click "Recalculate"
   - Review new calculations

4. **Manual Adjustment**
   - Edit individual employee
   - Adjust values manually
   - Add adjustment notes

5. **Report Issue**
   - Document error
   - Provide screenshots
   - Report to development team

---

## Emergency Procedures

### 1. System Outage

**Definition:** Complete system unavailability

**Immediate Actions:**

1. **Notify Users**
   - Send notification to all users
   - Post status update
   - Provide estimated recovery time

2. **Assess Situation**
   - Identify cause of outage
   - Determine impact scope
   - Estimate recovery time

3. **Initiate Recovery**
   - Follow recovery procedures
   - Restore from backup if needed
   - Verify system integrity

4. **Communicate Updates**
   - Regular status updates
   - Notify when resolved
   - Document incident

### 2. Data Loss

**Definition:** Accidental deletion or corruption of data

**Immediate Actions:**

1. **Stop System**
   - Prevent further data loss
   - Stop all write operations
   - Isolate affected systems

2. **Assess Damage**
   - Identify lost data
   - Determine extent of loss
   - Check for corruption

3. **Restore from Backup**
   - Identify appropriate backup
   - Restore data
   - Verify integrity

4. **Notify Stakeholders**
   - Inform affected users
   - Explain impact
   - Provide recovery timeline

### 3. Security Breach

**Definition:** Unauthorized access or data compromise

**Immediate Actions:**

1. **Contain Breach**
   - Disable compromised accounts
   - Change all passwords
   - Isolate affected systems

2. **Assess Impact**
   - Identify accessed data
   - Determine scope of breach
   - Check for malware

3. **Notify Authorities**
   - Report to management
   - Contact legal if required
   - Notify affected users

4. **Remediate**
   - Patch vulnerabilities
   - Implement security improvements
   - Monitor for recurrence

---

## Maintenance Schedule

### Daily Maintenance

**Time:** 2:00 AM - 3:00 AM

**Tasks:**
- Automated database backup
- Log cleanup job execution
- System health check
- Disk space monitoring

**Responsible:** Automated scripts

### Weekly Maintenance

**Day:** Sunday

**Tasks:**
- Review system logs
- Check error rates
- Monitor performance metrics
- Verify backup integrity
- Review security logs
- Update software patches

**Responsible:** System Administrator

### Monthly Maintenance

**Day:** First Sunday of month

**Tasks:**
- Full system audit
- User access review
- Performance optimization
- Database maintenance
- Security assessment
- Documentation update
- Disaster recovery test

**Responsible:** System Administrator

### Quarterly Maintenance

**Schedule:** January, April, July, October

**Tasks:**
- Major software updates
- Security audit
- Capacity planning
- Backup strategy review
- Disaster recovery drill
- Staff training
- Policy review

**Responsible:** System Administrator, Management

### Annual Maintenance

**Schedule:** December

**Tasks:**
- Full system review
- Technology assessment
- Budget planning
- Contract review
- Compliance audit
- Strategic planning

**Responsible:** Management, System Administrator

---

## Appendix

### A. Contact Information

**System Administrator:**
- Email: admin@jajr-attendance.com
- Phone: [Insert Phone Number]

**IT Support:**
- Email: support@jajr-attendance.com
- Phone: [Insert Phone Number]

**Emergency Contact:**
- Phone: [Insert Emergency Number]

### B. Quick Reference

**Common Commands:**

```bash
# Check server status
pm2 status

# View logs
pm2 logs v2-attendance-api

# Restart services
pm2 restart all

# Database backup
mysqldump -u root -p attendance-system > backup.sql

# Check disk space
df -h

# Check MySQL status
systemctl status mysql
```

**Important URLs:**
- System: https://attendacev2.xandree.com
- Admin Dashboard: https://attendacev2.xandree.com/dashboard
- API Health: https://attendacev2.xandree.com/health

**Default Credentials (Change Immediately):**
- Admin Username: admin
- Admin Password: admin123

### C. Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | April 2026 | Initial release | Development Team |

---

**Document Version:** 1.0  
**Effective Date:** April 2026  
**Next Review Date:** April 2027  
**Approved By:** System Administrator  
**Owner:** Development Team
