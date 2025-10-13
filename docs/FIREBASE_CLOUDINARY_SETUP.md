# Firebase and Cloudinary Integration Setup

This document explains how to set up Firebase and Cloudinary integration for the Respondr app.

## Firebase Setup

### 1. Firebase Project Configuration

The Firebase configuration is already set up in `firebase/config.ts`. Make sure your Firebase project has the following services enabled:

- **Authentication** - For user management
- **Firestore** - For data storage
- **Storage** - For file storage (optional, we're using Cloudinary)

### 2. Firestore Collections

The app uses the following Firestore collections:

- `resources` - Resource data
- `transactions` - Resource transactions
- `multiTransactions` - Multi-resource transactions
- `borrowers` - Borrower profiles
- `resourceHistory` - Resource history logs
- `sitrep_documents` - Situation report documents (NEW)

### 3. Firestore Security Rules

Make sure to set up appropriate security rules for your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Resources collection
    match /resources/{resourceId} {
      allow read, write: if request.auth != null;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    // Multi-transactions collection
    match /multiTransactions/{multiTransactionId} {
      allow read, write: if request.auth != null;
    }
    
    // Borrowers collection
    match /borrowers/{borrowerId} {
      allow read, write: if request.auth != null;
    }
    
    // Resource history collection
    match /resourceHistory/{historyId} {
      allow read, write: if request.auth != null;
    }
    
    // SitRep Documents collection - NEW
    match /sitrep_documents/{documentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Firebase Storage Security Rules

For document uploads, you also need to set up Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // SitRep documents - authenticated users only
    match /sitrep/documents/{fileName} {
      allow read, write: if request.auth != null;
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Deploy Security Rules

To deploy the security rules to Firebase:

```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage

# Or use the deployment script
node scripts/deploy-firebase-rules.js
```

## Cloudinary Setup

### 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com) and create an account
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Create an upload preset for unsigned uploads

### 2. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
EXPO_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### 3. Upload Preset Configuration

In your Cloudinary dashboard:

1. Go to Settings > Upload
2. Create a new upload preset
3. Set the following options:
   - **Signing Mode**: Unsigned
   - **Folder**: `respondr/` (or your preferred folder)
   - **Resource Type**: Image
   - **Access Mode**: Public

### 4. Image Transformations

The app uses several image transformations:

- **Thumbnails**: 200x200px, auto-cropped
- **Responsive**: Max width 1200px, auto-optimized
- **Avatars**: 100x100px, face-detected cropping

## Usage

### Resource Management

```typescript
import { useResources } from '@/contexts/ResourceContext';

const { 
  addResource, 
  updateResource, 
  deleteResource,
  uploadResourceImage,
  generateImageUrl 
} = useResources();

// Add a new resource
await addResource({
  name: 'Emergency Generator',
  description: 'Portable generator for emergency use',
  category: 'equipment',
  totalQuantity: 1,
  availableQuantity: 1,
  images: [],
  location: 'Warehouse A',
  status: 'active',
  condition: 'good',
  tags: ['emergency', 'portable'],
  createdBy: 'user-id',
  updatedBy: 'user-id'
});

// Upload an image
const imageUrl = await uploadResourceImage(file, resourceId);

// Generate optimized image URL
const thumbnailUrl = generateImageUrl(publicId, {
  width: 200,
  height: 200,
  crop: 'fill'
});
```

### Image Upload Component

```typescript
import { ImageUpload } from '@/components/ui/ImageUpload';

<ImageUpload
  onImageSelected={(url, publicId) => {
    // Handle image selection
  }}
  onImageRemoved={() => {
    // Handle image removal
  }}
  resourceId="resource-id"
  maxImages={5}
  quality="auto"
  format="auto"
/>
```

## Features

### Firebase Integration

- **Real-time sync** - Resources sync automatically across devices
- **Offline support** - Works offline with local caching
- **Batch operations** - Efficient bulk operations
- **History tracking** - Complete audit trail of changes

### Cloudinary Integration

- **Automatic optimization** - Images are automatically optimized
- **Responsive images** - Different sizes for different use cases
- **Format conversion** - Automatic format selection (WebP, AVIF)
- **Quality optimization** - Automatic quality adjustment
- **Face detection** - Smart cropping for avatars

### Image Management

- **Multiple upload methods** - Camera, gallery, or file selection
- **Progress tracking** - Upload progress indicators
- **Error handling** - Comprehensive error handling
- **Image preview** - Real-time image preview
- **Batch operations** - Upload multiple images at once

## Troubleshooting

### Common Issues

1. **Firebase connection issues**
   - Check your Firebase configuration
   - Ensure Firestore is enabled
   - Verify security rules

2. **Cloudinary upload failures**
   - Check your API credentials
   - Verify upload preset configuration
   - Ensure proper permissions

3. **Image display issues**
   - Check image URLs
   - Verify Cloudinary configuration
   - Check network connectivity

### Debug Mode

Enable debug logging by setting:

```typescript
// In your app configuration
console.log('Firebase config:', firebaseConfig);
console.log('Cloudinary config:', cloudinaryConfig);
```

## Security Considerations

1. **API Keys** - Never commit API keys to version control
2. **Upload Presets** - Use unsigned uploads for client-side uploads
3. **Firestore Rules** - Implement proper security rules
4. **Image Validation** - Validate image types and sizes
5. **Rate Limiting** - Implement rate limiting for uploads

## Performance Optimization

1. **Image Caching** - Images are automatically cached
2. **Lazy Loading** - Images load only when needed
3. **Compression** - Automatic image compression
4. **CDN** - Cloudinary's global CDN for fast delivery
5. **Batch Operations** - Efficient bulk operations
