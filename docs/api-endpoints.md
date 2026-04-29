# Profile Image API Endpoints Documentation

## Overview

This document describes the API endpoints for the profile image system, including upload functionality and employee archiving.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All endpoints require authentication using the `authenticate` middleware. Include the authentication token in the request headers.

## Endpoints

### Employee Profile Image Endpoints

#### Upload Employee Profile Image

**Endpoint:** `POST /employees/:id/upload-profile-image`

**Description:** Upload a profile image for an employee.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Parameters:**
- `id` (path): Employee ID (integer)

**Request Body:**
```
profileImage: File (image/jpeg, image/jpg, image/png, image/gif, image/webp)
```

**Request Example:**
```javascript
const formData = new FormData();
formData.append('profileImage', file);

const response = await fetch('/api/employees/123/upload-profile-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token-here'
  },
  body: formData
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 123,
    "employeeCode": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "profileImage": "/assets/profile-images/employees/123_1234567890.jpg",
    "createdAt": "2026-04-28T10:00:00.000Z",
    "updatedAt": "2026-04-28T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or invalid file type
- `404 Not Found`: Employee not found
- `413 Payload Too Large`: File size exceeds 10MB limit
- `500 Internal Server Error`: Server error during upload

#### Archive Employee

**Endpoint:** `PATCH /employees/:id/archive`

**Description:** Archive an employee (soft delete with status change and archive record creation).

**Authentication:** Required

**Content-Type:** `application/json`

**Parameters:**
- `id` (path): Employee ID (integer)

**Request Body:**
```json
{
  "reason": "Employee resigned"
}
```

**Request Example:**
```javascript
const response = await fetch('/api/employees/123/archive', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  },
  body: JSON.stringify({
    reason: "Employee resigned"
  })
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Employee archived successfully",
  "data": {
    "id": 123,
    "employeeCode": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "status": "Inactive"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
- `404 Not Found`: Employee not found
- `500 Internal Server Error`: Database error during archive

### Admin Profile Image Endpoints

#### Upload Admin Profile Image

**Endpoint:** `POST /admins/:id/upload-profile-image`

**Description:** Upload a profile image for an admin user.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Parameters:**
- `id` (path): Admin ID (integer)

**Request Body:**
```
profileImage: File (image/jpeg, image/jpg, image/png, image/gif, image/webp)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 456,
    "username": "admin1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "profileImage": "/assets/profile-images/admins/456_1234567890.jpg",
    "createdAt": "2026-04-28T10:00:00.000Z",
    "updatedAt": "2026-04-28T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or invalid file type
- `404 Not Found`: Admin not found
- `413 Payload Too Large`: File size exceeds 10MB limit
- `500 Internal Server Error`: Server error during upload

### Branch User Profile Image Endpoints

#### Upload Branch User Profile Image

**Endpoint:** `POST /branch-users/:id/upload-profile-image`

**Description:** Upload a profile image for a branch user.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Parameters:**
- `id` (path): Branch user ID (integer)

**Request Body:**
```
profileImage: File (image/jpeg, image/jpg, image/png, image/gif, image/webp)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 789,
    "username": "branch_user1",
    "name": "Branch User",
    "email": "branch@example.com",
    "role": "admin",
    "profileImage": "/assets/profile-images/branch-users/789_1234567890.jpg",
    "createdAt": "2026-04-28T10:00:00.000Z",
    "updatedAt": "2026-04-28T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded or invalid file type
- `404 Not Found`: Branch user not found
- `413 Payload Too Large`: File size exceeds 10MB limit
- `500 Internal Server Error`: Server error during upload

## File Upload Specifications

### Supported File Types
- JPEG (image/jpeg)
- JPG (image/jpg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

### File Size Limits
- Maximum file size: 10MB (10,485,760 bytes)
- Recommended size: Under 1MB for optimal performance

### Image Processing
- Automatic compression to 80% quality
- Maximum dimensions: 800x800 pixels
- Aspect ratio preservation
- EXIF metadata stripping for privacy

### File Naming Convention
Files are named using the following pattern:
```
{userId}_{timestamp}.{extension}
```

Example: `123_1714297600000.jpg`

### Storage Structure
```
assets/profile-images/
├── employees/
│   ├── 123_1714297600000.jpg
│   └── 124_1714297601000.png
├── admins/
│   ├── 456_1714297602000.jpg
│   └── 457_1714297603000.webp
└── branch-users/
    ├── 789_1714297604000.jpg
    └── 790_1714297605000.png
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (if available)"
}
```

### Common Error Scenarios

#### File Validation Errors
```json
{
  "success": false,
  "message": "Invalid file type. Only JPG, PNG, GIF, and WebP are allowed."
}
```

#### File Size Errors
```json
{
  "success": false,
  "message": "File size exceeds 10MB limit."
}
```

#### User Not Found Errors
```json
{
  "success": false,
  "message": "Employee not found"
}
```

## Rate Limiting

Upload endpoints are subject to rate limiting to prevent abuse:
- Maximum 10 uploads per minute per user
- Maximum 50 uploads per hour per user
- Maximum 200 uploads per day per user

Rate limit exceeded responses:
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

## Security Considerations

### File Validation
- MIME type validation at server level
- File extension validation
- Magic number verification
- Virus scanning integration (if available)

### Path Security
- Absolute path validation to prevent directory traversal
- Secure file naming to prevent conflicts
- Upload directory permission restrictions

### Access Control
- Authentication required for all endpoints
- User can only upload to their own profile (unless admin)
- Audit logging for all upload operations

## Integration Examples

### JavaScript/TypeScript Frontend Integration

```typescript
interface ProfileImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    profileImage: string;
  };
}

class ProfileImageService {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async uploadEmployeeProfileImage(employeeId: number, file: File): Promise<ProfileImageUploadResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch(`${this.baseUrl}/employees/${employeeId}/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadAdminProfileImage(adminId: number, file: File): Promise<ProfileImageUploadResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch(`${this.baseUrl}/admins/${adminId}/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async uploadBranchUserProfileImage(branchUserId: number, file: File): Promise<ProfileImageUploadResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch(`${this.baseUrl}/branch-users/${branchUserId}/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async archiveEmployee(employeeId: number, reason: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/employees/${employeeId}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      throw new Error(`Archive failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage example
const profileService = new ProfileImageService('http://localhost:5000/api', 'your-auth-token');

// Upload employee profile image
try {
  const result = await profileService.uploadEmployeeProfileImage(123, selectedFile);
  console.log('Upload successful:', result.data.profileImage);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### cURL Examples

#### Upload Employee Profile Image
```bash
curl -X POST \
  http://localhost:5000/api/employees/123/upload-profile-image \
  -H 'Authorization: Bearer your-token-here' \
  -F 'profileImage=@/path/to/image.jpg'
```

#### Archive Employee
```bash
curl -X PATCH \
  http://localhost:5000/api/employees/123/archive \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-token-here' \
  -d '{"reason": "Employee resigned"}'
```

## Testing

### Unit Testing Examples

```javascript
// Test file upload validation
describe('Profile Image Upload', () => {
  test('should reject invalid file types', async () => {
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('profileImage', invalidFile);

    const response = await fetch('/api/employees/123/upload-profile-image', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
      body: formData
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('Invalid file type');
  });

  test('should reject oversized files', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('profileImage', largeFile);

    const response = await fetch('/api/employees/123/upload-profile-image', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
      body: formData
    });

    expect(response.status).toBe(413);
    const data = await response.json();
    expect(data.message).toContain('File size exceeds');
  });
});
```

## Monitoring and Logging

### Upload Metrics
- Success rate by user type
- Average upload time
- File size distribution
- Error rate by error type

### Audit Logging
All profile image operations are logged with:
- User ID and name
- Action type (upload, archive)
- Timestamp
- IP address
- User agent
- File details (size, type, name)

### Performance Monitoring
- Upload endpoint response times
- File processing duration
- Storage usage trends
- Error rate alerts

---

**Last Updated:** April 28, 2026  
**Version:** 1.0.0  
**Author:** Development Team
