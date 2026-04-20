# Employee QR Code Format

## Overview

The JAJR Attendance System uses QR codes for employee check-in/check-out at branch locations. Each employee has a unique QR code that contains their identification information.

---

## QR Code Data Format

The QR code contains a structured text string with the following format:

```
JAJR-EMP:{id}|{employee_code}|{employee_name}
```

### Format Breakdown

| Field | Description | Example |
|-------|-------------|---------|
| `JAJR-EMP:` | Fixed prefix identifier | `JAJR-EMP:` |
| `{id}` | Employee database ID (numeric) | `123` |
| `{employee_code}` | Employee code based on position | `W0001`, `ADMIN-2024-001` |
| `{employee_name}` | Full employee name | `John Doe` |

### Separator
- Fields are separated by the pipe character `|`

---

## Example QR Code Data

```
JAJR-EMP:123|W0001|John Doe
```

This breaks down as:
- **Prefix**: `JAJR-EMP:`
- **ID**: `123`
- **Employee Code**: `W0001` (Worker position)
- **Name**: `John Doe`

---

## Employee Code Format by Position

| Position | Code Format | Example |
|----------|-------------|---------|
| Worker | `W` + 4-digit number | `W0001` |
| Admin | `ADMIN-YYYY-` + 3-digit number | `ADMIN-2024-001` |
| Engineer | `ENGINEER-YYYY-` + 3-digit number | `ENGINEER-2024-001` |
| Architect | `ARCHITECT-YYYY-` + 3-digit number | `ARCHITECT-2024-001` |
| Developer | `DEV-YYYY-` + 2-digit number | `DEV-2024-01` |

---

## QR Code Generation

The QR codes are generated using the **goQR.me API**:

```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_qr_data}
```

### Generation Code Reference

**Location**: `views/employee/employee_list.php:1500`

```javascript
const qrData = `JAJR-EMP:${id}|${code}|${name}`;
qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}" alt="QR Code">`;
```

### Visual Styling

- **Size**: 200x200 pixels
- **Border**: 4px solid gold (#FFD700) accent color
- **Border radius**: 8px

---

## QR Code Parsing (Scanner)

**Location**: `controllers/BranchQRController.php:37-58`

The scanner uses the following regex pattern to parse QR code data:

```php
// Parse QR data format: JAJR-EMP:id|code|name
if (!preg_match('/JAJR-EMP:(\d+)\|([^|]+)\|(.+)/', $qrData, $matches)) {
    return ['error' => 'Invalid QR code format'];
}

$employeeId = $matches[1];    // Employee database ID
$employeeCode = $matches[2];  // Employee code
$employeeName = $matches[3];    // Employee name
```

### Validation Process

1. **Format Check**: Validates the QR code matches the expected pattern
2. **Employee Lookup**: Queries the database using the employee ID
3. **Status Check**: Verifies the employee status is "Active"
4. **Attendance Check**: Validates cross-branch check-in/checkout rules

---

## Security Considerations

1. **Employee ID Exposure**: The database ID is exposed in the QR code. This is acceptable for internal use but consider encryption for higher security requirements.

2. **QR Code Validity**: QR codes remain valid as long as the employee record exists and is active.

3. **No Expiration**: QR codes do not have an expiration date - they are tied to the employee's active status.

---

## Usage Flow

1. **Admin/HR** generates QR code from the employee list (`views/employee/employee_list.php`)
2. **Employee** presents their QR code at the branch scanner
3. **Scanner** (`views/branch_qr/scanner.php`) reads and decodes the QR code
4. **Controller** (`controllers/BranchQRController.php`) validates and processes the attendance
5. **System** records check-in or check-out based on employee's current status

---

## Files Reference

| File | Purpose |
|------|---------|
| `views/employee/employee_list.php` | QR code generation and display |
| `views/branch_qr/scanner.php` | QR code scanning interface |
| `controllers/BranchQRController.php` | QR parsing and attendance processing |

---

## Related Documentation

- [DEPLOYMENT_MANUAL.md](./DEPLOYMENT_MANUAL.md) - System deployment guide
- [ATTENDANCE_SYSTEM_GUIDE.md](./ATTENDANCE_SYSTEM_GUIDE.md) - Full system documentation
