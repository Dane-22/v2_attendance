import crypto from 'crypto';
import sharp from 'sharp';

class FileCompressionService {
  /**
   * Generate SHA-256 hash of file buffer
   */
  async generateFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Compress image files (JPG, PNG) at 80% quality
   */
  async compressImage(buffer: Buffer, mimeType: string): Promise<{ compressedBuffer: Buffer; wasCompressed: boolean }> {
    try {
      // Only compress images larger than 5MB
      const sizeInMB = buffer.length / (1024 * 1024);
      if (sizeInMB < 5) {
        return { compressedBuffer: buffer, wasCompressed: false };
      }

      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        const compressedBuffer = await sharp(buffer)
          .jpeg({ quality: 80 })
          .toBuffer();
        return { compressedBuffer, wasCompressed: true };
      }

      if (mimeType === 'image/png') {
        const compressedBuffer = await sharp(buffer)
          .png({ quality: 80 })
          .toBuffer();
        return { compressedBuffer, wasCompressed: true };
      }

      return { compressedBuffer: buffer, wasCompressed: false };
    } catch (error) {
      console.error('[Compression] Image compression failed:', error);
      // Return original buffer if compression fails
      return { compressedBuffer: buffer, wasCompressed: false };
    }
  }

  /**
   * Compress PDF files if size exceeds 20MB
   * Note: This is a placeholder. PDF compression requires additional libraries like pdf-lib
   * For now, we'll just return the original buffer
   */
  async compressPDF(buffer: Buffer): Promise<{ compressedBuffer: Buffer; wasCompressed: boolean }> {
    try {
      const sizeInMB = buffer.length / (1024 * 1024);
      if (sizeInMB < 20) {
        return { compressedBuffer: buffer, wasCompressed: false };
      }

      // TODO: Implement PDF compression using pdf-lib or similar library
      // For now, return original buffer
      console.warn('[Compression] PDF compression not yet implemented');
      return { compressedBuffer: buffer, wasCompressed: false };
    } catch (error) {
      console.error('[Compression] PDF compression failed:', error);
      return { compressedBuffer: buffer, wasCompressed: false };
    }
  }

  /**
   * Compress file based on MIME type
   */
  async compressFile(buffer: Buffer, mimeType: string): Promise<{ compressedBuffer: Buffer; wasCompressed: boolean }> {
    if (mimeType.startsWith('image/')) {
      return this.compressImage(buffer, mimeType);
    }

    if (mimeType === 'application/pdf') {
      return this.compressPDF(buffer);
    }

    // No compression for other file types
    return { compressedBuffer: buffer, wasCompressed: false };
  }
}

export default new FileCompressionService();
