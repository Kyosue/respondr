// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || 'demo',
  apiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'demo',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'demo'
};

// Check if Cloudinary is properly configured
export const isCloudinaryConfigured = () => {
  return cloudinaryConfig.cloudName !== 'demo' && 
         cloudinaryConfig.apiKey !== 'demo' && 
         cloudinaryConfig.apiSecret !== 'demo' &&
         cloudinaryConfig.uploadPreset !== 'demo';
};

// Default image transformations
export const defaultImageTransformations = {
  thumbnail: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto'
  },
  responsive: {
    width: 1200,
    crop: 'scale',
    quality: 'auto',
    format: 'auto',
    responsive: true
  },
  avatar: {
    width: 100,
    height: 100,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    format: 'auto'
  }
};
