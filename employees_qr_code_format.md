# QR Code Format Documentation

## Overview
The QR code system in `employees.php` generates scannable codes that link to the employee time-in page with pre-filled employee data.

## Library Used
- **Library**: QRCode.js
- **Version**: 1.0.0
- **CDN**: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`

## QR Code Configuration

| Property | Value |
|----------|-------|
| Width | 280px |
| Height | 280px |
| Color Dark | #000000 (black) |
| Color Light | #ffffff (white) |
| Error Correction Level | H (High) |

## QR Code Data Format

The QR code encodes a **URL** with query parameters:

```
{baseUrl}/employee/select_employee.php?auto_timein=1&select_branch=1&emp_id={id}&emp_code={encoded_code}
```

### URL Components

| Parameter | Description | Example |
|-----------|-------------|---------|
| `auto_timein` | Flag to trigger automatic time-in | `1` |
| `select_branch` | Flag to prompt branch selection | `1` |
| `emp_id` | Employee database ID | `42` |
| `emp_code` | Employee code (URL-encoded) | `EMP-001` |

### Example URL
```
https://example.com/employee/select_employee.php?auto_timein=1&select_branch=1&emp_id=42&emp_code=EMP-001
```

## Usage Flow

1. Admin clicks the QR button next to an employee record
2. JavaScript `generateQRCode()` function creates the URL
3. QRCode.js renders the QR code in a modal
4. QR code can be downloaded as PNG with employee name/code overlay

## Downloaded QR Image

When downloaded, the PNG includes:
- The QR code (280x280px)
- Employee name below the QR code
- Employee code below the name
- White background with black text
- Filename format: `employee-qr-{employee_code}.png`

## Related Files

- `employee/select_employee.php` - Landing page that processes QR scans
- `employee/function/employees_function.php` - Backend employee functions
