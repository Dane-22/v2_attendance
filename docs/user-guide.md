# Profile Image System User Guide

## Overview

This guide helps users understand how to use the new Profile Image System in the attendance management application. The system allows employees, admins, and branch users to upload and manage profile pictures that replace the default text-based avatars.

## Getting Started

### What You'll Need
- A valid user account with appropriate permissions
- A profile image file (JPG, PNG, GIF, or WebP format)
- Recommended image size: Under 10MB
- Recommended image dimensions: Square or portrait orientation works best

### Supported Image Formats
- **JPEG/JPG**: Best for photographs
- **PNG**: Best for images with transparency
- **GIF**: For simple animations
- **WebP**: Modern format with better compression

## For HR Team and Managers

### Adding New Employees with Profile Images

1. **Navigate to Employee Management**
   - Go to **Dashboard → Employees**
   - Click the **"Add New Employee"** button

2. **Fill Employee Information**
   - Complete all required fields (Employee Code, Name, Email, Position)
   - Add optional information as needed

3. **Upload Profile Image**
   - Scroll to the **"Profile Image"** section
   - Click **"Choose Profile Image"** button OR drag and drop an image file
   - Select your image file from your computer
   - Optionally use the cropping tool to adjust the image
   - Click **"Add Employee"** to save

4. **Image Upload Tips**
   - Use a clear, recent photo of the employee
   - Ensure good lighting and professional appearance
   - Square images work best for profile pictures
   - The system will automatically compress large images

### Managing Existing Employee Profiles

#### Updating Profile Images
1. Find the employee in the employee table
2. Click the **Edit** button in the Actions column
3. In the **"Profile Image"** section:
   - Click **"Choose Profile Image"** to upload a new photo
   - The new image will replace the current one
   - Click **"Save"** to update the employee record

#### Removing Profile Images
1. Edit the employee as described above
2. In the **"Profile Image"** section:
   - Click **"Remove selected image"** link
   - This will remove the profile picture and revert to initials
   - Click **"Save"** to confirm the change

### Employee Archiving

Instead of deleting employees, you can archive them to preserve their data while removing them from active lists.

1. **Archive an Employee**
   - Find the employee in the employee table
   - Click the **Archive** button in the Actions column
   - Enter a reason for archiving (e.g., "Resigned", "Terminated", "Transferred")
   - Click **"Archive Employee"** to confirm

2. **View Archived Employees**
   - Use the **"View Archived"** toggle above the employee table
   - Archived employees will appear with an "Inactive" status
   - You can still view their profile images and information

3. **Restore Archived Employees**
   - Contact your system administrator to restore archived employees
   - This requires database-level access

## For Employees

### Viewing Your Profile

Your profile image appears in various places throughout the system:

- **Employee Table**: Your picture shows next to your name
- **Attendance Records**: Your image appears in attendance views
- **QR Codes**: Your profile picture may be included in QR code displays

### Updating Your Profile Image

You cannot directly update your own profile image. Contact your HR team or system administrator to:
- Upload a new profile picture
- Remove your current profile image
- Make changes to your profile information

## For System Administrators

### Managing Admin Profile Images

1. **Access Admin Management**
   - Go to **Dashboard → Employees**
   - Switch to the **"Admins"** tab

2. **Update Admin Profile**
   - Click **Edit** next to the admin account
   - Upload or remove profile image as needed
   - Save changes

### Managing Branch User Profile Images

1. **Access Branch User Management**
   - Go to **Dashboard → Employees**
   - Switch to the **"Branch Users"** tab

2. **Update Branch User Profile**
   - Click **Edit** next to the branch user account
   - Upload or remove profile image as needed
   - Save changes

### System Maintenance

#### Storage Management
- Profile images are stored in `assets/profile-images/` directory
- Regular cleanup may be needed for orphaned files
- Monitor disk space usage as images accumulate

#### Troubleshooting Common Issues

**Images Not Displaying**
- Check if the image file exists in the correct directory
- Verify file permissions on the upload directory
- Clear browser cache and reload the page

**Upload Failures**
- Verify image file is under 10MB
- Ensure image format is supported (JPG, PNG, GIF, WebP)
- Check network connection stability
- Verify user has appropriate permissions

**Performance Issues**
- Large images may take longer to upload
- Consider image optimization before upload
- Monitor server resources during peak usage

## Image Guidelines and Best Practices

### Recommended Image Specifications

#### File Size
- **Maximum**: 10MB
- **Recommended**: Under 1MB for faster uploads
- **Optimal**: 100KB - 500KB

#### Dimensions
- **Minimum**: 200x200 pixels
- **Recommended**: 400x400 to 800x800 pixels
- **Maximum**: 800x800 pixels (system will resize larger images)

#### Quality
- Use clear, high-quality photos
- Ensure good lighting and professional appearance
- Avoid blurry or pixelated images
- Use recent photos (within last year)

### Professional Image Tips

#### What Makes a Good Profile Picture
- **Clear Face**: Employee's face should be clearly visible
- **Professional Attire**: Business casual or company uniform
- **Simple Background**: Plain or non-distracting background
- **Good Lighting**: Even lighting without harsh shadows
- **Front-facing**: Straight-on or slightly angled view

#### What to Avoid
- **Selfies**: Use professionally taken photos when possible
- **Group Photos**: Only the employee should be in the picture
- **Inappropriate Content**: Maintain professional standards
- **Low Quality**: Blurry, pixelated, or distorted images
- **Outdated Photos**: Use recent, current appearance

### Image File Management

#### Naming Conventions
- The system automatically generates secure filenames
- Don't worry about file names - the system handles this
- Original file names are not preserved for security

#### File Organization
- Images are automatically organized by user type
- Employees: `assets/profile-images/employees/`
- Admins: `assets/profile-images/admins/`
- Branch Users: `assets/profile-images/branch-users/`

## Troubleshooting Guide

### Common Problems and Solutions

#### Upload Issues

**Problem:** "Invalid file type" error
**Solution:** Ensure your image is JPG, PNG, GIF, or WebP format

**Problem:** "File size exceeds limit" error
**Solution:** Compress your image or use a smaller file (under 10MB)

**Problem:** Upload seems stuck or takes forever
**Solution:** Check your internet connection and try a smaller image file

#### Display Issues

**Problem:** Profile image not showing in the table
**Solution:** 
- Refresh the page
- Clear browser cache
- Contact your administrator if the issue persists

**Problem:** Image appears distorted or cropped incorrectly
**Solution:** 
- Try uploading a square image
- Use the cropping tool during upload
- Contact HR to re-upload with better image

#### Permission Issues

**Problem:** Cannot see upload options
**Solution:** Contact your system administrator to verify your permissions

**Problem:** Cannot edit other users' profiles
**Solution:** Only HR team and administrators can manage employee profiles

### Getting Help

#### Contact Information
- **HR Team**: For employee profile management
- **System Administrator**: For technical issues and permissions
- **IT Support**: For upload and display problems

#### Information to Provide
When requesting help, please provide:
- Your username and role
- The specific issue you're experiencing
- Any error messages you received
- Browser and device information
- Steps you already tried

## Frequently Asked Questions

### General Questions

**Q: Can I upload multiple profile images at once?**
A: Currently, the system supports one profile image per user. You'll need to upload images individually.

**Q: What happens to my old profile image when I upload a new one?**
A: The old image is replaced by the new one. The system automatically manages file cleanup.

**Q: Can I use animated GIFs as profile images?**
A: Yes, GIFs are supported, but keep in mind they may not display properly in all contexts.

**Q: How long do uploads take?**
A: Upload time depends on file size and network speed. Most images upload within 5-30 seconds.

### Technical Questions

**Q: Are my images secure?**
A: Yes, images are stored securely with randomized filenames and access controls.

**Q: Can I download my profile image?**
A: Currently, there's no direct download option. Contact your administrator if you need a copy.

**Q: What image format is best?**
A: JPEG is recommended for photographs due to good compression and quality balance.

### Privacy Questions

**Q: Who can see my profile image?**
A: Your profile image is visible to all users with access to the employee management system.

**Q: Can I control who sees my profile image?**
A: Currently, profile image visibility is controlled by system access permissions.

**Q: Is my image data used for anything else?**
A: Profile images are used only for display within the attendance system.

## Mobile Usage

### Uploading Images on Mobile Devices

1. **Take or Select Photo**
   - Use your device's camera to take a new photo
   - Or select an existing photo from your gallery

2. **Upload Process**
   - The upload interface works on mobile browsers
   - Tap the upload area to select a file
   - Wait for the upload to complete

3. **Mobile Tips**
   - Use portrait orientation for best results
   - Ensure good lighting when taking photos
   - Crop images before uploading for better results

### Mobile Display

- Profile images are optimized for mobile viewing
- Images automatically resize to fit mobile screens
- Touch-friendly interface for all profile image operations

## Security and Privacy

### Data Protection
- Images are stored securely with access controls
- Filenames are randomized to prevent guessing
- Regular security audits of the image system

### Privacy Rights
- You can request removal of your profile image
- Contact HR or administration for privacy concerns
- Profile images are not used for external purposes

### Best Practices
- Use professional, appropriate images
- Respect others' privacy when viewing profiles
- Report any inappropriate profile images to administration

---

**Last Updated:** April 28, 2026  
**Version:** 1.0.0  
**Author:** Development Team
