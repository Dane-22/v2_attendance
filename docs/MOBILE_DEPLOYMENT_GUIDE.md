# Mobile App Deployment Manual

Use this procedure to build and deploy **JAJR Pulse (attendance-mobile)** for Android and iOS platforms.

---

## 1. Prerequisites

Before deploying, ensure you have:
- Expo CLI installed: `npm install -g expo-cli`
- EAS CLI installed: `npm install -g eas-cli`
- Expo account: Create at https://expo.dev
- Logged in to EAS: `eas login`

---

## 2. Git Workflow

### 2.1 Pulling Latest Changes from GitHub

When your colleague says "Code is updated on GitHub," run this sequence:

```bash
# 1. Enter the mobile app directory
cd attendance-mobile

# 2. Pull the latest changes from GitHub
git pull origin main

# 3. Install any new dependencies
npm install
```

### 2.2 Pushing Changes to GitHub

When you've made changes to the mobile app and want to push them to the repository:

```bash
# 1. Enter the mobile app directory
cd attendance-mobile

# 2. Check current git status
git status

# 3. Add all changes
git add .

# 4. Commit changes with a descriptive message
git commit -m "Your commit message here"

# 5. Push to GitHub
git push origin main

# If using a different branch, replace 'main' with your branch name
```

**Alternative: One-liner for quick commits**
```bash
cd attendance-mobile && git add . && git commit -m "Your message" && git push origin main
```

**Note:** If you encounter merge conflicts, pull first:
```bash
git pull origin main
# Resolve conflicts, then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

---

## 3. Environment Configuration

The mobile app needs to be configured with the production API URL before building.

**Current configuration file:**
```bash
attendance-mobile/src/constants/config.ts
```

**Update for production:**
```typescript
// Change from local dev host to production URL
const DEV_HOST = 'attendacev2.xandree.com';

export const API_BASE_URL = `https://${DEV_HOST}/api`;
```

**Important:** Always revert to local dev host after building for production if you need to continue development.

---

## 3. Building for Android

### Option A: Development Build (APK for testing)
```bash
cd attendance-mobile

# Install dependencies
npm install

# Start Expo dev server
expo start

# Press 'a' to run on Android device/emulator
# Or build APK:
eas build --platform android --profile development
```

### Option B: Production Build (AAB for Play Store)
```bash
cd attendance-mobile

# Configure EAS (first time only)
eas build:configure

# Build production AAB
eas build --platform android --profile production

# The build will be uploaded to EAS and available for download
```

### Option C: APK for Direct Distribution
```bash
# Build APK for direct installation
eas build --platform android --profile preview

# Download and install APK on devices
```

---

## 4. Building for iOS

### Option A: Development Build (for testing)
```bash
cd attendance-mobile

# Build for iOS simulator
eas build --platform ios --profile development --simulator

# Or build for physical device (requires Apple Developer account)
eas build --platform ios --profile development
```

### Option B: Production Build (for App Store)
```bash
# Requires Apple Developer account ($99/year)
eas build --platform ios --profile production

# Upload to App Store Connect
eas submit --platform ios
```

---

## 5. EAS Build Profiles

The app uses EAS (Expo Application Services) for building. Create or update `eas.json` in the project root:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 6. Quick-Reference Table

| Task | Command | Why? |
|------|---------|------|
| Install Dependencies | `npm install` | Install/update packages |
| Start Dev Server | `expo start` | Run app in development mode |
| Build Android APK | `eas build --platform android --profile preview` | Create APK for testing |
| Build Android AAB | `eas build --platform android --profile production` | Create AAB for Play Store |
| Build iOS IPA | `eas build --platform ios --profile production` | Create IPA for App Store |
| View Build Status | `eas build:list` | Check build progress |
| Submit to App Store | `eas submit --platform ios` | Upload to App Store Connect |
| Update API Config | Edit `src/constants/config.ts` | Change API endpoint |

---

## 7. Summary "One-Liner" for Android Production Build

```bash
cd attendance-mobile && \
npm install && \
# Update config.ts with production API URL first, then: \
eas build --platform android --profile production
```

---

## 8. Troubleshooting Common Issues

### Issue: "Module not found" errors
**Fix:**
```bash
cd attendance-mobile
rm -rf node_modules
npm install
```

### Issue: Build fails with "EAS Build failed"
**Fix:**
```bash
# Check build logs
eas build:list

# View specific build details
eas build:view [BUILD_ID]
```

### Issue: API connection errors in production build
**Fix:** Verify API URL in config.ts:
```bash
cat attendance-mobile/src/constants/config.ts
# Should show: https://attendacev2.xandree.com/api
```

### Issue: Android build fails with "Keystore not found"
**Fix:** Generate a keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore attendance-mobile.keystore -alias attendance-mobile -keyalg RSA -keysize 2048 -validity 10000
```
Then configure in `eas.json` or EAS dashboard.

### Issue: iOS build requires Apple Developer account
**Fix:** You need an Apple Developer account ($99/year) for production iOS builds. For testing, use:
```bash
eas build --platform ios --profile development
```

### Issue: Camera/Permissions not working in production
**Fix:** Ensure permissions are configured in `app.json`:
```json
{
  "plugins": [
    "expo-secure-store",
    ["expo-camera", {
      "cameraPermission": "Allow JAJR Pulse to access your camera"
    }]
  ]
}
```

---

## 9. Project Structure

```
attendance-mobile/
├── src/
│   ├── App.tsx              # Main app component
│   ├── api/                 # API service layer
│   ├── components/          # Reusable components
│   ├── constants/
│   │   └── config.ts        # API configuration (IMPORTANT)
│   ├── hooks/               # Custom React hooks
│   ├── navigation/          # React Navigation setup
│   ├── screens/             # Screen components
│   ├── store/               # Redux store
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── App.tsx                  # Entry point
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── eas.json                 # EAS build profiles (create this)
```

---

## 10. App Store & Play Store Submission

### Android (Google Play Store)
1. Build production AAB: `eas build --platform android --profile production`
2. Create app listing in Google Play Console
3. Upload AAB to Play Console
4. Complete store listing, screenshots, and privacy policy
5. Submit for review

### iOS (Apple App Store)
1. Build production IPA: `eas build --platform ios --profile production`
2. Create app listing in App Store Connect
3. Upload IPA: `eas submit --platform ios`
4. Complete store listing, screenshots, and privacy policy
5. Submit for review

---

## 11. Post-Build Verification Checklist

After building, verify:
- [ ] API URL is set to production in `config.ts`
- [ ] App can connect to production API
- [ ] Camera permission works
- [ ] Face detection works
- [ ] Notifications work
- [ ] Secure storage works
- [ ] Login/logout flow works
- [ ] Attendance scanning works

---

## 12. Version Management

Update version in `app.json` before each release:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

Also update in `package.json`:
```json
{
  "version": "1.0.1"
}
```

---

## 13. Testing Before Production

Always test on physical devices before releasing:
```bash
# Build preview APK for testing
eas build --platform android --profile preview

# Install on test device and verify all features
```

---

## 14. Emergency Rollback

If a production build has critical bugs:
1. Remove app from stores (if already published)
2. Fix the issue in code
3. Increment version number
4. Rebuild with fixed version
5. Submit new version to stores

---

**Last Updated:** May 30, 2026  
**App Name:** JAJR Pulse  
**Package:** com.anonymous.attendancemobile  
**Production API:** https://attendacev2.xandree.com/api
