# Installing Dev Build on Mobile

This guide explains how to install and run the Respondr app as a development build on your mobile device.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) if you don't have one
2. **EAS CLI**: Install the Expo Application Services CLI
   ```bash
   npm install -g eas-cli
   ```
3. **Login to EAS**:
   ```bash
   eas login
   ```

## Method 1: EAS Build (Recommended)

This method builds the app in the cloud and provides you with an installable file.

### For Android

1. **Build the development client**:
   ```bash
   eas build --profile development --platform android
   ```

2. **Wait for the build to complete** (usually 10-20 minutes). You'll get a link to download the APK.

3. **Install on your device**:
   - **Option A**: Download the APK directly on your Android device and install it
   - **Option B**: Use the QR code provided after the build completes
   - **Option C**: Enable "Install from Unknown Sources" in Android settings and transfer the APK via USB/email

4. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start --dev-client
   ```

5. **Connect your device**:
   - Scan the QR code with your camera (Android) or Expo Go won't work - use the dev client you just installed
   - The app should automatically connect to the dev server
   - If not, shake your device and select "Configure Bundler" to enter the dev server URL manually

### For iOS

1. **Build the development client**:
   ```bash
   eas build --profile development --platform ios
   ```

2. **Install on your device**:
   - You'll receive a link to install via TestFlight (if configured) or direct download
   - For direct install, you may need to register your device UDID in your Apple Developer account

3. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start --dev-client
   ```

4. **Connect your device**:
   - Open the dev client app on your iOS device
   - Shake your device and select "Configure Bundler" to enter the dev server URL
   - Or scan the QR code if your device and computer are on the same network

## Method 2: Local Build (Android Only)

If you have Android Studio and the Android SDK installed, you can build locally:

1. **Generate native code** (if needed):
   ```bash
   npx expo prebuild
   ```

2. **Build the APK**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **Install on your device**:
   ```bash
   ./gradlew installDebug
   ```
   Or manually install the APK from `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Start the development server**:
   ```bash
   npm start
   ```

## Method 3: Using Expo Go (Limited - Not Recommended for Dev Builds)

⚠️ **Note**: Expo Go has limitations and may not work with all native modules. For a full dev build experience, use Method 1 or 2.

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Install Expo Go**:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

3. **Scan the QR code** with:
   - Android: Expo Go app or your camera
   - iOS: Camera app (will open in Expo Go)

## Troubleshooting

### App won't connect to dev server

1. **Check network**: Ensure your device and computer are on the same Wi-Fi network
2. **Check firewall**: Make sure your firewall isn't blocking the connection
3. **Manual connection**: 
   - Shake your device to open the dev menu
   - Select "Configure Bundler"
   - Enter: `http://YOUR_COMPUTER_IP:8081` (replace with your actual IP)
   - Find your IP with:
     - Windows: `ipconfig` (look for IPv4 Address)
     - Mac/Linux: `ifconfig` or `ip addr`

### Build fails

1. **Clear cache**:
   ```bash
   npx expo start --clear
   ```

2. **Check EAS status**:
   ```bash
   eas build:list
   ```

3. **View build logs**:
   ```bash
   eas build:view [BUILD_ID]
   ```

### Android: "App not installed" error

1. **Uninstall any existing version** of the app first
2. **Enable "Install from Unknown Sources"** in Android settings
3. **Check if you have enough storage** space

### iOS: Build requires Apple Developer account

For iOS development builds, you need:
- An Apple Developer account ($99/year)
- Your device UDID registered
- Proper provisioning profiles

## Quick Reference

### Start dev server
```bash
npm start
# or
npx expo start --dev-client
```

### Build for Android
```bash
eas build --profile development --platform android
```

### Build for iOS
```bash
eas build --profile development --platform ios
```

### Check build status
```bash
eas build:list
```

### View build details
```bash
eas build:view [BUILD_ID]
```

## Development Workflow

1. **First time setup**: Build the dev client once using EAS Build
2. **Daily development**:
   - Start the dev server: `npm start`
   - Open the dev client app on your device
   - Make code changes - they'll hot reload automatically
3. **When you add new native dependencies**: Rebuild the dev client

## Notes

- The dev build includes `expo-dev-client` which allows you to load your JavaScript bundle
- You only need to rebuild the native app when you add/remove native dependencies
- JavaScript changes are reflected immediately via hot reload
- The dev build is different from Expo Go - it's a custom build of your app

















