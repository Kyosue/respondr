import { useResources } from '@/contexts/ResourceContext';
import { useState } from 'react';

export interface ImageUploadOptions {
  resourceId?: string;
  borrowerName?: string;
  folder?: string;
  tags?: string[];
  quality?: 'auto' | '80' | '90' | '100';
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
}

export interface ImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export function useImageUpload() {
  const { uploadResourceImage, uploadBorrowerImage, generateImageUrl } = useResources();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File | Blob | string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult | null> => {
    try {
      setUploading(true);
      setError(null);

      let url: string;

      if (options.resourceId) {
        url = await uploadResourceImage(file, options.resourceId);
      } else if (options.borrowerName) {
        url = await uploadBorrowerImage(file, options.borrowerName);
      } else {
        throw new Error('Either resourceId or borrowerName must be provided');
      }

      // Extract public ID from URL for further operations
      const publicId = extractPublicIdFromUrl(url);

      return {
        url,
        publicId,
        width: 0, // Will be filled by Cloudinary response
        height: 0, // Will be filled by Cloudinary response
        format: options.format || 'auto',
        bytes: 0, // Will be filled by Cloudinary response
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Image upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (
    files: (File | Blob | string)[],
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> => {
    const results: ImageUploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadImage(file, options);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  const generateOptimizedUrl = (
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'scale' | 'crop';
      gravity?: 'auto' | 'face' | 'faces' | 'custom';
      quality?: 'auto' | '80' | '90' | '100';
      format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
      responsive?: boolean;
      placeholder?: boolean;
    } = {}
  ): string => {
    return generateImageUrl(publicId, options);
  };

  const generateThumbnailUrl = (publicId: string, size: number = 200): string => {
    return generateOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto'
    });
  };

  const generateResponsiveUrl = (publicId: string, maxWidth: number = 1200): string => {
    return generateOptimizedUrl(publicId, {
      width: maxWidth,
      crop: 'scale',
      quality: 'auto',
      format: 'auto',
      responsive: true
    });
  };

  const clearError = () => {
    setError(null);
  };

  return {
    uploadImage,
    uploadMultipleImages,
    generateOptimizedUrl,
    generateThumbnailUrl,
    generateResponsiveUrl,
    uploading,
    error,
    clearError,
  };
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url: string): string {
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/v\d+\/(.+?)\./);
    if (match && match[1]) {
      return match[1];
    }
    
    // If no version in URL
    const matchNoVersion = url.match(/\/upload\/(.+?)\./);
    if (matchNoVersion && matchNoVersion[1]) {
      return matchNoVersion[1];
    }
    
    // Fallback: return the full URL
    return url;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return url;
  }
}
