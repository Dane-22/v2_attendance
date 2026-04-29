# Profile Image System Documentation

## Overview

The Profile Image System provides comprehensive profile image upload and management functionality for employees, admins, and branch users across the attendance management system.

## Features

### Core Features
- **Profile Image Upload**: Upload profile images for all user types (employees, admins, branch users)
- **Avatar Replacement**: System-wide replacement of text-based avatars with profile images
- **Image Processing**: Automatic image compression, resizing, and format optimization
- **Drag & Drop**: Intuitive drag-and-drop file upload interface
- **Image Cropping**: Built-in image cropping tool for perfect profile pictures
- **Image Preview**: Full-screen image preview with zoom and rotation capabilities
- **Employee Archiving**: Soft delete system with archived employee management

### Technical Features
- **Storage**: Organized file storage in `assets/profile-images/` with subdirectories per user type
- **Security**: File validation, metadata stripping, and secure file naming
- **Performance**: Lazy loading, caching, and WebP optimization
- **Responsive**: Mobile-friendly interface with adaptive sizing

## Architecture

### Backend Components

#### Database Schema
- **employees.profileImage**: Path to employee profile image
- **admins.profileImage**: Path to admin profile image  
- **branch_users.profileImage**: Path to branch user profile image
- **archived_employees**: Complete employee archive with profile images preserved

#### API Endpoints
```
POST /employees/:id/upload-profile-image
POST /admins/:id/upload-profile-image  
POST /branch-users/:id/upload-profile-image
PATCH /employees/:id/archive
```

#### File Storage Structure
```
assets/
├── profile-images/
│   ├── employees/
│   ├── admins/
│   └── branch-users/
```

### Frontend Components

#### Core Components
- **ProfileImage**: Reusable profile image display component
- **ImageUpload**: Drag-and-drop upload interface
- **ImageCropper**: Advanced image cropping tool
- **ImagePreview**: Full-screen image viewer

#### Integration Points
- **Employee Management**: Add/Edit modals, employee table, attendance views
- **Admin Management**: Admin table and modals
- **Branch User Management**: Branch user table and modals

## Implementation Guide

### Database Setup

1. Run the migration files in order:
```sql
-- Migration 001: Add profile image support
-- File: backend/prisma/migrations/001_add_profile_images.sql

-- Migration 002: Create archived employees table  
-- File: backend/prisma/migrations/002_add_archived_employees.sql
```

2. Update Prisma schema and regenerate client:
```bash
cd backend
npx prisma generate
```

### Backend Setup

1. **Employee Controller** (`backend/src/controllers/employee.controller.ts`)
   - Profile image upload endpoint
   - Employee archiving functionality
   - File validation and compression

2. **Admin Controller** (`backend/src/controllers/admin.controller.ts`)
   - Profile image upload for admins
   - File management and validation

3. **Branch User Controller** (`backend/src/controllers/branch-user.controller.ts`)
   - Profile image upload for branch users
   - Integration with existing branch management

### Frontend Setup

1. **Component Installation**
   - Place components in `frontend/src/components/`
   - ProfileImage.tsx
   - ImageUpload.tsx
   - ImageCropper.tsx
   - ImagePreview.tsx

2. **Integration**
   - Update API types in `frontend/src/lib/api.ts`
   - Replace avatar implementations throughout the application
   - Add profile upload to Add Employee Modal

## Usage Guide

### For HR Team

#### Adding Employee Profile Images
1. Navigate to **Dashboard → Employees**
2. Click **"Add New Employee"**
3. Fill in employee information
4. In the **Profile Image** section:
   - Click **"Choose Profile Image"** or drag & drop
   - Optionally crop the image using the cropping tool
   - Click **"Add Employee"**

#### Managing Existing Employee Images
1. Find the employee in the employee table
2. Click the **Edit** button
3. In the **Profile Image** section:
   - Upload a new image to replace the current one
   - Click **"Remove selected image"** to remove the profile picture
   - Save changes

#### Employee Archiving
1. Select an employee from the table
2. Click the **Archive** button
3. Provide a reason for archiving
4. Confirm the action
5. View archived employees using the **"View Archived"** toggle

### For System Administrators

#### Managing Admin Profile Images
1. Navigate to **Dashboard → Employees → Admins tab**
2. Edit an admin to update their profile image
3. Upload and crop images as needed

#### Managing Branch User Profile Images  
1. Navigate to **Dashboard → Employees → Branch Users tab**
2. Edit a branch user to update their profile image
3. Upload and crop images as needed

## Technical Specifications

### Image Processing
- **Maximum File Size**: 10MB
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Compression**: Automatic compression to 80% quality
- **Maximum Dimensions**: 800x800px
- **Output Format**: Preserves original format with compression

### Security Measures
- **File Type Validation**: Strict MIME type checking
- **File Size Limits**: Enforced at both client and server
- **Secure File Naming**: Timestamp-based unique filenames
- **Path Traversal Prevention**: Absolute path validation
- **Metadata Stripping**: EXIF data removal for privacy

### Performance Optimizations
- **Lazy Loading**: Images load only when visible
- **WebP Support**: Automatic format conversion where supported
- **Caching**: Browser caching headers for static images
- **Progressive Loading**: Placeholder display during image load

## Troubleshooting

### Common Issues

#### Image Upload Fails
- **Check file size**: Ensure image is under 10MB
- **Check file format**: Only JPG, PNG, GIF, WebP supported
- **Check permissions**: Verify upload directory is writable
- **Check network**: Ensure stable connection during upload

#### Images Not Displaying
- **Check file path**: Verify image exists in correct directory
- **Check URL format**: Ensure API URL is correctly configured
- **Check permissions**: Verify web server can access image files
- **Check browser cache**: Clear browser cache and reload

#### Archiving Issues
- **Check database**: Ensure archived_employees table exists
- **Check permissions**: Verify user has archive permissions
- **Check constraints**: Ensure no foreign key conflicts

### Error Codes

#### Upload Errors
- `400`: Invalid file type or size
- `404`: User not found
- `413`: File too large
- `500`: Server error during processing

#### Archive Errors  
- `404`: Employee not found
- `409**: Archive already exists
- `500`: Database error during archive

## API Reference

### Profile Image Upload

#### Upload Employee Profile Image
```http
POST /api/employees/:id/upload-profile-image
Content-Type: multipart/form-data

profileImage: File
```

**Response:**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "id": 1,
    "profileImage": "/assets/profile-images/employees/1_1234567890.jpg"
  }
}
```

#### Upload Admin Profile Image
```http
POST /api/admins/:id/upload-profile-image
Content-Type: multipart/form-data

profileImage: File
```

#### Upload Branch User Profile Image
```http
POST /api/branch-users/:id/upload-profile-image
Content-Type: multipart/form-data

profileImage: File
```

### Employee Archiving

#### Archive Employee
```http
PATCH /api/employees/:id/archive
Content-Type: application/json

{
  "reason": "Employee resigned"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee archived successfully",
  "data": {
    "id": 1,
    "status": "Inactive"
  }
}
```

## Deployment Guide

### Production Setup

1. **Database Migration**
   ```bash
   # Run migrations in production
   mysql -u username -p database_name < backend/prisma/migrations/001_add_profile_images.sql
   mysql -u username -p database_name < backend/prisma/migrations/002_add_archived_employees.sql
   ```

2. **Directory Permissions**
   ```bash
   # Create upload directories with proper permissions
   mkdir -p assets/profile-images/{employees,admins,branch-users}
   chmod 755 assets/profile-images
   chmod 755 assets/profile-images/*
   ```

3. **Environment Configuration**
   ```env
   # Ensure API URL is correctly configured
   NEXT_PUBLIC_API_URL=http://your-domain.com/api
   ```

4. **Web Server Configuration**
   ```nginx
   # Example Nginx configuration for serving images
   location /assets/ {
     alias /path/to/your/project/assets/;
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

### Monitoring

#### Storage Monitoring
- Monitor disk usage in `assets/profile-images/`
- Set up alerts for storage capacity limits
- Regular cleanup of orphaned images

#### Performance Monitoring
- Track image upload success rates
- Monitor image load times
- Track compression ratios

#### Error Monitoring
- Log upload failures with detailed error information
- Monitor database archiving operations
- Track file system permission issues

## Maintenance

### Regular Tasks

#### Weekly
- Review storage usage and clean up orphaned files
- Monitor upload success rates and investigate failures
- Check database integrity of archived records

#### Monthly  
- Review and optimize image compression settings
- Update file type validation rules if needed
- Audit user permissions for image management

#### Quarterly
- Review storage capacity planning
- Update security patches for image processing libraries
- Evaluate performance optimization opportunities

### Backup Strategy

#### Database Backup
- Include `archived_employees` table in regular backups
- Backup profile image paths and metadata

#### File Backup
- Regular backup of `assets/profile-images/` directory
- Consider cloud storage backup for disaster recovery
- Test restore procedures regularly

## Security Considerations

### File Upload Security
- Validate file types at both client and server
- Scan uploaded files for malware
- Implement rate limiting for upload endpoints
- Use secure file naming practices

### Data Privacy
- Strip EXIF metadata from uploaded images
- Implement access controls for profile image viewing
- Consider GDPR implications for biometric data
- Regular security audits of file handling code

### Access Control
- Restrict profile image upload to authorized users
- Implement audit logging for image changes
- Role-based permissions for image management
- Secure file access at the operating system level

## Future Enhancements

### Planned Features
- **Bulk Image Operations**: Upload multiple images at once
- **Image Watermarking**: Add company watermarks to profile images
- **Face Detection**: Automatic face detection and cropping
- **Image Analytics**: Track image usage and engagement metrics
- **CDN Integration**: Content delivery network for faster image serving

### Technical Improvements
- **WebP Conversion**: Automatic conversion to WebP format
- **Progressive JPEG**: Progressive image loading
- **Image Optimization**: Advanced compression algorithms
- **Cloud Storage**: Integration with cloud storage providers
- **API Versioning**: Versioned API endpoints for backward compatibility

## Support

For technical support or questions about the Profile Image System:

1. **Documentation**: Refer to this guide first
2. **Issue Tracking**: Create tickets in the project issue tracker
3. **Code Review**: Submit pull requests for improvements
4. **Community**: Join the development team discussions

---

**Last Updated**: April 28, 2026  
**Version**: 1.0.0  
**Author**: Development Team
