/**
 * Utility functions for handling profile image URLs
 * Ensures all image paths resolve to the correct server and port
 */

/**
 * Convert a relative image path to a full URL
 * @param imagePath - The image path from database (can be absolute URL, relative path, or filename)
 * @returns Full URL to the image, or null if input is null/empty
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get the base image URL from environment variable or use default
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:5000/uploads';

  // If path starts with /, prepend base URL without double slashes
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }

  // For relative paths, append to base URL
  return `${baseUrl}/${imagePath}`;
}

/**
 * Get a fallback image URL for broken or missing images
 */
export function getFallbackImageUrl(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23d3d3d3"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dy=".3em" fill="%23666"%3E👤%3C/text%3E%3C/svg%3E';
}

/**
 * Validate if an image URL is accessible
 * @param url - The image URL to validate
 * @returns Promise<boolean> - true if URL is accessible, false otherwise
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
