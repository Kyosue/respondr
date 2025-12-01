# Respondr Deployment Guide

This guide covers all deployment options for the Respondr application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Deployment](#firebase-deployment)
3. [Web Deployment](#web-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Deployment Scripts](#deployment-scripts)

## Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** installed
2. **Firebase CLI** installed and logged in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
3. **EAS CLI** installed (for mobile builds):
   ```bash
   npm install -g eas-cli
   eas login
   ```
4. **Firebase Project** configured and selected:
   ```bash
   firebase use --add
   ```
5. **Environment Variables** configured (if using Cloudinary or other services)

## Firebase Deployment

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

### Deploy Firebase Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Deploy All Firebase Services

```bash
firebase deploy
```

This will deploy:
- Firestore security rules
- Storage security rules
- Cloud Functions

## Web Deployment

The Respondr app supports web deployment and can be hosted on various platforms.

### Option 1: Firebase Hosting (Recommended)

Firebase Hosting provides fast, secure hosting with CDN distribution.

#### Setup Firebase Hosting

1. **Initialize Firebase Hosting** (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to: `web-build`
   - Configure as single-page app: **Yes**
   - Set up automatic builds: **No** (we'll build manually)

2. **Build the web app**:
   ```bash
   npx expo export:web
   ```
   or
   ```bash
   npx expo export --platform web
   ```

3. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

#### Update firebase.json

Add hosting configuration to `firebase.json`:

```json
{
  "hosting": {
    "public": "web-build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build the web app**:
   ```bash
   npx expo export:web
   ```

3. **Deploy**:
   ```bash
   cd web-build
   vercel --prod
   ```

### Option 3: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the web app**:
   ```bash
   npx expo export:web
   ```

3. **Deploy**:
   ```bash
   cd web-build
   netlify deploy --prod --dir=.
   ```

### Option 4: GitHub Pages

1. **Build the web app**:
   ```bash
   npx expo export:web
   ```

2. **Configure GitHub Actions** (see `.github/workflows/deploy-web.yml`)

3. **Push to GitHub** - deployment will be automatic

## Mobile App Deployment

### Android Deployment

#### Production Build

1. **Build production APK/AAB**:
   ```bash
   eas build --profile production --platform android
   ```

2. **Submit to Google Play Store**:
   ```bash
   eas submit --platform android
   ```

#### Preview Build (Internal Testing)

1. **Build preview version**:
   ```bash
   eas build --profile preview --platform android
   ```

2. **Download and distribute** the APK/AAB file

### iOS Deployment

#### Production Build

1. **Build production app**:
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

#### TestFlight (Beta Testing)

1. **Build for TestFlight**:
   ```bash
   eas build --profile production --platform ios
   ```

2. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios
   ```

3. **Configure in App Store Connect** for beta testing

## Deployment Scripts

### Quick Deployment Scripts

#### Deploy Everything (Firebase)

```bash
npm run deploy:firebase
```

#### Deploy Web Only

```bash
npm run deploy:web
```

#### Build Web for Production

```bash
npm run build:web
```

#### Deploy Mobile Apps

```bash
npm run deploy:android
npm run deploy:ios
```

## Step-by-Step Full Deployment

### 1. Deploy Firebase Services

```bash
# Deploy all Firebase services
firebase deploy

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only functions
```

### 2. Build Web Application

```bash
# Export web build
npx expo export:web

# Verify build output
ls web-build
```

### 3. Deploy Web Application

**If using Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**If using Vercel:**
```bash
cd web-build
vercel --prod
```

**If using Netlify:**
```bash
cd web-build
netlify deploy --prod --dir=.
```

### 4. Build Mobile Applications

**Android:**
```bash
eas build --profile production --platform android
```

**iOS:**
```bash
eas build --profile production --platform ios
```

### 5. Submit Mobile Applications

**Android:**
```bash
eas submit --platform android
```

**iOS:**
```bash
eas submit --platform ios
```

## Environment Variables

For production deployment, ensure these environment variables are set:

### Firebase
- Already configured in `firebase/config.ts`

### Cloudinary (Optional)
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `EXPO_PUBLIC_CLOUDINARY_API_KEY`
- `EXPO_PUBLIC_CLOUDINARY_API_SECRET`
- `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Weather API (Optional)
- `EXPO_PUBLIC_WEATHER_API_KEY`

## Post-Deployment Checklist

- [ ] Verify Firebase rules are deployed correctly
- [ ] Test authentication on deployed web app
- [ ] Verify Firebase Storage access
- [ ] Test Firestore read/write operations
- [ ] Check Cloud Functions are working
- [ ] Verify mobile app builds are successful
- [ ] Test app on physical devices
- [ ] Monitor Firebase console for errors
- [ ] Check analytics and performance

## Troubleshooting

### Firebase Deployment Issues

1. **Authentication Error**:
   ```bash
   firebase login --reauth
   ```

2. **Project Not Selected**:
   ```bash
   firebase use --add
   ```

3. **Functions Build Error**:
   ```bash
   cd functions
   npm install
   npm run build
   ```

### Web Build Issues

1. **Build Fails**:
   ```bash
   npx expo export:web --clear
   ```

2. **Missing Dependencies**:
   ```bash
   npm install
   ```

### Mobile Build Issues

1. **EAS Build Fails**:
   - Check `eas.json` configuration
   - Verify app.json settings
   - Review build logs: `eas build:view [BUILD_ID]`

2. **iOS Code Signing**:
   - Ensure Apple Developer account is configured
   - Check certificates in EAS dashboard

## Continuous Deployment

### GitHub Actions

Set up GitHub Actions for automatic deployment on push to main branch.

See `.github/workflows/` directory for workflow files.

### EAS Update

For over-the-air updates (JavaScript only, no native changes):

```bash
eas update --branch production --message "Update description"
```

## Security Considerations

1. **Firebase Rules**: Review and test security rules before deployment
2. **API Keys**: Never commit API keys to version control
3. **Environment Variables**: Use secure environment variable management
4. **Build Secrets**: Store sensitive data in EAS secrets

## Monitoring

After deployment, monitor:

1. **Firebase Console**: Check for errors and usage
2. **EAS Dashboard**: Monitor build status and app distribution
3. **Analytics**: Track user engagement and errors
4. **Performance**: Monitor app performance metrics

## Rollback

### Firebase Hosting

```bash
firebase hosting:channel:list
firebase hosting:rollback
```

### Mobile Apps

- Use EAS Update to rollback JavaScript changes
- For native changes, create a new build with previous version

## Support

For deployment issues:
1. Check Firebase Console logs
2. Review EAS build logs
3. Check Expo documentation
4. Review Firebase documentation

