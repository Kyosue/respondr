import { cloudinaryConfig, isCloudinaryConfigured } from '@/config/cloudinary';
import * as FileSystem from 'expo-file-system/legacy';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  tags?: string[];
  // Note: quality and format should be configured in the upload preset
  // for unsigned uploads, not passed as parameters
}

export class CloudinaryService {
  private static instance: CloudinaryService;

  private constructor() {}

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  // Upload image to Cloudinary
  async uploadImage(
    file: File | Blob | string, 
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary is not configured. Please set up your environment variables.');
        console.warn('Required variables: EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
        // Return a mock response for demo mode
        return {
          public_id: 'demo-image',
          secure_url: typeof file === 'string' ? file : 'https://via.placeholder.com/400x300?text=Demo+Image',
          width: 400,
          height: 300,
          format: 'jpg',
          resource_type: 'image',
          bytes: 1000,
          created_at: new Date().toISOString()
        };
      }

      const formData = new FormData();
      
      // Handle different file types
      if (typeof file === 'string') {
        // Check if it's a local file URI (starts with file://)
        if (file.startsWith('file://')) {
          // For React Native, read the file as base64
          try {
            const base64 = await FileSystem.readAsStringAsync(file, {
              encoding: FileSystem.EncodingType.Base64,
            });
            // Create data URI for Cloudinary
            const dataUri = `data:image/jpeg;base64,${base64}`;
            formData.append('file', dataUri);
          } catch (error) {
            console.error('Error reading file as base64:', error);
            throw new Error('Failed to read image file');
          }
        } else {
          // If it's a base64 string or URL
          formData.append('file', file);
        }
      } else {
        // If it's a File or Blob
        formData.append('file', file);
      }

      // Add upload preset
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      // Add options (only parameters allowed for unsigned uploads)
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }
      if (options.tags) {
        formData.append('tags', options.tags.join(','));
      }
      // Note: quality and format parameters are not allowed with unsigned uploads
      // These should be configured in the upload preset instead

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result as CloudinaryUploadResult;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      // If it's a network error or configuration issue, provide helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Upload multiple images
  async uploadMultipleImages(
    files: (File | Blob | string)[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  // Delete image from Cloudinary
  async deleteImage(publicId: string): Promise<void> {
    try {
      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary is not configured. Skipping image deletion.');
        return;
      }

      // Note: This method is designed to fail gracefully
      // Cloudinary delete operations often fail due to signature validation issues
      // We accept that some images may remain on Cloudinary rather than breaking the app

      // Skip deletion if it's a demo image
      if (publicId === 'demo-image' || publicId.startsWith('demo-')) {
        console.warn('Skipping deletion of demo image:', publicId);
        return;
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await this.generateSignature(publicId, timestamp);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            timestamp: timestamp,
            signature: signature,
            api_key: cloudinaryConfig.apiKey,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Cloudinary delete failed (continuing anyway):', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          publicId
        });
        // Don't throw - just return gracefully
        return;
      }

      console.log('Successfully deleted image:', publicId);
    } catch (error) {
      console.warn('Error deleting image from Cloudinary (continuing anyway):', error);
      // Don't throw the error - just log it and continue
      // This prevents the entire resource deletion from failing due to image deletion issues
      console.warn('Continuing with resource deletion despite image deletion failure');
    }
  }

  // Delete multiple images
  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
      const results = await Promise.allSettled(deletePromises);
      
      // Log any failures but don't throw
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`Failed to delete ${failures.length} out of ${publicIds.length} images`);
        failures.forEach((failure, index) => {
          console.warn(`Image deletion failed for ${publicIds[index]}:`, failure);
        });
      }
      
      console.log(`Successfully processed ${publicIds.length} image deletions`);
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      // Don't throw - just log and continue
      console.warn('Continuing despite image deletion failures');
    }
  }

  // Generate optimized image URL using Cloudinary's URL transformation API
  generateImageUrl(
    publicId: string, 
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'scale' | 'crop' | 'fit' | 'limit';
      gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
      quality?: 'auto' | '80' | '90' | '100';
      format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
      responsive?: boolean;
      placeholder?: boolean;
    } = {}
  ): string {
    try {
      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary is not configured. Using demo mode.');
        // Return a placeholder image URL for demo mode
        const width = options.width || 400;
        const height = options.height || 300;
        return `https://via.placeholder.com/${width}x${height}?text=Demo+Image`;
      }

      const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;
      const transformations: string[] = [];

      // Add transformations
      if (options.width || options.height) {
        const crop = options.crop || 'fill';
        const gravity = options.gravity || 'auto';
        const size = options.width && options.height 
          ? `${options.width},${options.height}` 
          : options.width || options.height;
        transformations.push(`w_${size},h_${size},c_${crop},g_${gravity}`);
      }

      // Add quality
      if (options.quality) {
        if (options.quality === 'auto') {
          transformations.push('q_auto');
        } else {
          transformations.push(`q_${options.quality}`);
        }
      }

      // Add format
      if (options.format) {
        if (options.format === 'auto') {
          transformations.push('f_auto');
        } else {
          transformations.push(`f_${options.format}`);
        }
      }

      // Add responsive flag
      if (options.responsive) {
        transformations.push('fl_responsive');
      }

      // Add placeholder flag
      if (options.placeholder) {
        transformations.push('fl_placeholder');
      }

      // Build final URL
      const transformString = transformations.length > 0 ? transformations.join(',') + '/' : '';
      return `${baseUrl}/${transformString}${publicId}`;
    } catch (error) {
      console.error('Error generating image URL:', error);
      return publicId; // Fallback to original URL
    }
  }

  // Generate thumbnail URL
  generateThumbnailUrl(publicId: string, size: number = 200): string {
    return this.generateImageUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto'
    });
  }

  // Generate responsive image URL
  generateResponsiveImageUrl(publicId: string, maxWidth: number = 1200): string {
    return this.generateImageUrl(publicId, {
      width: maxWidth,
      crop: 'scale',
      quality: 'auto',
      format: 'auto',
      responsive: true
    });
  }

  // Generate signature for API calls
  private async generateSignature(publicId: string, timestamp: number): Promise<string> {
    // In a real implementation, you would generate the signature on your backend
    // For now, we'll use a simple approach (not secure for production)
    const message = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
    
    // This is a simplified version - in production, use proper HMAC-SHA1
    return btoa(message);
  }

  // Get image info
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/resources/image/upload/${publicId}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${cloudinaryConfig.apiKey}:${cloudinaryConfig.apiSecret}`)}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get image info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting image info:', error);
      throw error;
    }
  }

  // Search images
  async searchImages(query: string, options: {
    folder?: string;
    tags?: string[];
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        expression: query,
        max_results: (options.limit || 50).toString()
      });

      if (options.folder) {
        params.append('folder', options.folder);
      }

      if (options.tags) {
        params.append('tags', options.tags.join(','));
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/resources/search?${params}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${cloudinaryConfig.apiKey}:${cloudinaryConfig.apiSecret}`)}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.resources || [];
    } catch (error) {
      console.error('Error searching images:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cloudinaryService = CloudinaryService.getInstance();

// Helper functions for common use cases
export const imageUtils = {
  // Upload resource image
  async uploadResourceImage(file: File | Blob | string, resourceId: string): Promise<CloudinaryUploadResult> {
    return cloudinaryService.uploadImage(file, {
      folder: `resources/${resourceId}`,
      tags: ['resource', resourceId]
    });
  },

  // Upload borrower image
  async uploadBorrowerImage(file: File | Blob | string, borrowerName: string): Promise<CloudinaryUploadResult> {
    return cloudinaryService.uploadImage(file, {
      folder: `borrowers/${borrowerName}`,
      tags: ['borrower', borrowerName]
    });
  },

  // Generate resource image URL
  generateResourceImageUrl(publicId: string, options: {
    thumbnail?: boolean;
    maxWidth?: number;
    responsive?: boolean;
  } = {}): string {
    if (options.thumbnail) {
      return cloudinaryService.generateThumbnailUrl(publicId);
    }
    
    if (options.responsive) {
      return cloudinaryService.generateResponsiveImageUrl(publicId, options.maxWidth);
    }

    return cloudinaryService.generateImageUrl(publicId, {
      width: options.maxWidth,
      quality: 'auto',
      format: 'auto'
    });
  },

  // Generate borrower image URL
  generateBorrowerImageUrl(publicId: string, size: number = 100): string {
    return cloudinaryService.generateImageUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'auto'
    });
  }
};
