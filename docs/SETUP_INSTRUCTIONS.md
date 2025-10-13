# Respondr Setup Instructions

## Quick Start

The app is now ready to run with Firebase and Cloudinary integration! Here's how to get started:

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npx expo start
```

## Firebase Setup

Firebase is already configured and ready to use. The app will work with the existing Firebase project.

### Firestore Collections

The app uses these Firestore collections:
- `resources` - Resource data
- `transactions` - Resource transactions  
- `multiTransactions` - Multi-resource transactions
- `borrowers` - Borrower profiles
- `resourceHistory` - Resource history logs

## Cloudinary Setup (Optional)

Cloudinary is configured to work in demo mode by default. To enable full image upload functionality:

### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com) and create an account
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Create an upload preset for unsigned uploads

### 2. Set Environment Variables

Create a `.env` file in your project root:

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

## Features

### ✅ Working Features

- **Resource Management**: Create, read, update, delete resources
- **Firebase Integration**: Real-time data sync
- **Image Upload**: Camera and gallery integration
- **Offline Support**: Works offline with local caching
- **Image Optimization**: Automatic image optimization (when Cloudinary is configured)
- **Responsive Design**: Works on mobile and web
- **Real-time Updates**: Changes sync across devices

### 🔧 Demo Mode

When Cloudinary is not configured, the app runs in demo mode:
- Image uploads return placeholder images
- All functionality works except actual image storage
- Perfect for testing and development

## Usage

### Adding Resources

1. Open the app
2. Navigate to Resources
3. Tap the "+" button to add a new resource
4. Fill in the resource details
5. Add photos (camera or gallery)
6. Save the resource

### Image Management

- **Upload**: Tap the camera icon to take a photo or select from gallery
- **Preview**: Images are displayed with thumbnails
- **Optimization**: Images are automatically optimized for different sizes
- **Responsive**: Images adapt to different screen sizes

### Offline Support

- The app works offline
- Changes are queued and synced when online
- Data is cached locally for fast access

## Troubleshooting

### Common Issues

1. **Build Errors**: Run `npx expo start --clear` to clear cache
2. **Image Upload Issues**: Check Cloudinary configuration
3. **Firebase Connection**: Verify Firebase project settings
4. **Permission Issues**: Grant camera and photo library permissions

### Debug Mode

Enable debug logging by checking the console for:
- Firebase connection status
- Cloudinary configuration status
- Image upload progress

## Development

### Project Structure

```
├── app/                    # App screens
├── components/            # Reusable components
├── contexts/             # React contexts
├── firebase/             # Firebase services
├── hooks/                # Custom hooks
├── types/                # TypeScript types
└── utils/                # Utility functions
```

### Key Files

- `firebase/config.ts` - Firebase configuration
- `firebase/resources.ts` - Resource management
- `firebase/cloudinary.ts` - Image management
- `contexts/ResourceContext.tsx` - Resource state management
- `components/ui/ImageUpload.tsx` - Image upload component

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
EXPO_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

### Security Rules

Make sure to set up proper Firestore security rules for production use.

## Support

For issues or questions:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Check Firebase and Cloudinary configuration
4. Review the documentation in the `docs/` folder
