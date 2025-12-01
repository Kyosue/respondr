# Android Build Guide

This guide covers building and deploying the Respondr Android app.

## Prerequisites

1. **EAS CLI** installed and logged in:
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Expo Account** with EAS access

3. **Android Package Name**: `com.reymundabelgas.Respondr` (configured in `app.json`)

## Build Profiles

The app has three build profiles configured in `eas.json`:

### 1. Production Build
- **Purpose**: Release to Google Play Store
- **Command**: `npm run build:android` or `eas build --profile production --platform android`
- **Output**: AAB (Android App Bundle) or APK
- **Auto-increment**: Version code automatically increments

### 2. Preview Build
- **Purpose**: Internal testing and distribution
- **Command**: `npm run build:android:preview` or `eas build --profile preview --platform android`
- **Output**: APK for direct installation
- **Distribution**: Internal (via download link)

### 3. Development Build
- **Purpose**: Development with dev client
- **Command**: `npm run build:android:dev` or `eas build --profile development --platform android`
- **Output**: APK with development client
- **Distribution**: Internal

## Building the Android App

### Production Build

```bash
npm run build:android
```

Or directly:
```bash
eas build --profile production --platform android
```

### Preview Build (for testing)

```bash
npm run build:android:preview
```

### Development Build

```bash
npm run build:android:dev
```

## Build Process

1. **EAS Build** will:
   - Compress and upload your project files
   - Install dependencies
   - Build the native Android app
   - Generate APK or AAB file

2. **Build Time**: Usually 10-20 minutes (longer on free tier)

3. **Build Status**: Check at https://expo.dev/accounts/reymundabelgas/projects/Respondr/builds

## After Build Completes

### Download the APK/AAB

1. Visit the build page on Expo dashboard
2. Download the APK (for preview/dev) or AAB (for production)
3. Install on device:
   - **APK**: Direct install (enable "Install from Unknown Sources")
   - **AAB**: Must be uploaded to Google Play Store

### Submit to Google Play Store

```bash
npm run submit:android
```

Or:
```bash
eas submit --platform android
```

**Requirements**:
- Google Play Console account
- App signing key configured
- Store listing prepared

## Troubleshooting

### Build Fails During Dependency Installation

1. **Check build logs**: Visit the build URL provided in the output
2. **Common issues**:
   - Node version incompatibility
   - Missing dependencies in package.json
   - Network issues during npm install
   - Native module compilation errors

3. **Solutions**:
   - Clear EAS build cache: `eas build --clear-cache`
   - Check Node version compatibility
   - Verify all dependencies are listed in package.json
   - Review build logs for specific errors

### Build Takes Too Long

- Free tier has lower priority
- Consider upgrading to paid plan for faster builds
- Builds typically take 10-20 minutes

### Version Code Issues

- EAS automatically increments versionCode
- Current version: Check `app.json` or EAS dashboard
- Manual override: Update `android/app/build.gradle`

### Keystore Issues

- EAS manages keystores automatically
- For production, ensure keystore is properly configured
- Check credentials: `eas credentials`

## Build Configuration

### Current Configuration

- **Package Name**: `com.reymundabelgas.Respondr`
- **Version**: `1.0.0` (in app.json)
- **Version Code**: Auto-incremented by EAS
- **Build Tool**: EAS Build (cloud-based)
- **Native Code**: Uses existing `android/` directory

### Customizing Builds

Edit `eas.json` to customize:
- Build environment variables
- Build resource allocation
- Build triggers
- Distribution settings

## Monitoring Builds

1. **Expo Dashboard**: https://expo.dev/accounts/reymundabelgas/projects/Respondr/builds
2. **Command Line**: `eas build:list`
3. **View Specific Build**: `eas build:view [BUILD_ID]`

## Next Steps

1. **Test the build** on physical devices
2. **Set up Google Play Console** account
3. **Prepare store listing** (screenshots, description, etc.)
4. **Submit to Play Store** when ready

## Quick Reference

```bash
# Build production Android app
npm run build:android

# Build preview Android app
npm run build:android:preview

# Build development Android app
npm run build:android:dev

# Submit to Google Play Store
npm run submit:android

# List all builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Check credentials
eas credentials
```

