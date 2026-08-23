# Respondr App

A comprehensive disaster response management system built with React Native and Expo Router. Developed for the Provincial Disaster Risk Reduction and Management Office (PDRRMO) of Davao Oriental, Philippines, to coordinate resources, track operations, manage situation reports, and monitor weather conditions during disasters and emergencies.

## Features

### Core Functionality
- **Resource Management**: Inventory system for emergency resources (vehicles, medical supplies, equipment, personnel)
- **Operations Tracking**: Map-based operations management across Davao Oriental municipalities
- **Situation Reports (SitRep)**: Document management with uploads, search, offline access, and DOCX export
- **Memo & Document Management**: Internal memo distribution, acknowledgements, and role-based assignment
- **User Management**: Multi-user system with role-based access (admin, supervisor, operator)
- **Borrower Management**: Track resource borrowing and returns with borrower profiles
- **Weather Station**: Live weather monitoring, PAGASA advisories, rainfall analytics, and predictive analysis
- **Dashboard**: Activity stream, system alerts, resource overview, and recent operations

### Technical Features
- **Firebase Integration**: Real-time sync with Firestore, Firebase Auth, Storage, and Cloud Functions
- **Offline Support**: Resilient operation in low-connectivity areas with local caching (after initial login)
- **Push Notifications**: Expo Notifications for weather advisories and system alerts
- **Image Management**: Camera integration and Cloudinary optimization
- **Cross-Platform**: Native iOS, Android, and web with responsive desktop and mobile layouts
- **TypeScript**: Full type safety throughout the application
- **Theme Support**: Light and dark mode

### Resilience Features
- **Offline-First Architecture**: Works without internet after initial authentication
- **Network State Monitoring**: Automatic retry and connection quality detection
- **Data Synchronization**: Queued operations sync when connectivity is restored
- **Secure Storage**: Sensitive data stored with Expo SecureStore
- **Authentication Limitation**: Initial login requires internet (Firebase Auth requirement)

### Public Web Landing Page
- **`/home`**: Unauthenticated web visitors see a public weather dashboard with station data, analytics, and a link to sign in

## Project Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── index.tsx            # Main authenticated app shell (tab navigation)
├── home.tsx             # Public web landing page (weather dashboard)
├── login.tsx            # Authentication screen
└── signup.tsx           # User registration screen

components/
├── auth/                # Login and signup forms
├── dashboard/           # Dashboard metrics, activity stream, alerts
├── layout/              # Desktop layout shell
├── navigation/          # Header, sidebar, bottom navigation
├── operations/          # Operations map and modals
├── resources/           # Resource management and modals
├── sitrep/              # Situation reports and document cards
├── reports/             # Memo and document management
├── user-management/     # User administration
├── weather-station/     # Weather monitoring and analytics
├── settings/            # App settings, help, and terms
├── help/                # Help content (used in settings modal)
├── about/               # About content
└── ui/                  # Shared UI components

config/                  # App configuration (navigation, Cloudinary)
contexts/                # React Context providers
├── AuthContext.tsx
├── ResourceContext.tsx
├── SitRepContext.tsx
├── MemoContext.tsx
├── NotificationContext.tsx
├── NetworkContext.tsx
├── NavigationContext.tsx
└── ThemeContext.tsx

firebase/                # Firebase and backend services
├── config.ts            # Firebase initialization
├── auth.ts              # Authentication
├── resources.ts         # Resource management
├── operations.ts        # Operations
├── documents.ts         # SitRep documents
├── memos.ts             # Memo documents
├── weatherStations.ts   # Weather station data
├── notifications.ts     # Push notifications
├── cloudinary.ts        # Image upload and optimization
├── functions.ts         # Callable Cloud Functions client
└── resilient*.ts        # Offline-resilient service wrappers

functions/               # Firebase Cloud Functions (admin user creation, etc.)
hooks/                   # Custom React hooks
services/                # Weather API and PAGASA advisory services
types/                   # TypeScript definitions
utils/                   # Offline storage, sync, validation, and helpers
docs/                    # Extended setup, deployment, and feature documentation
```

## Key Features

### Resource Management
- Inventory tracking with categories (vehicles, medical, equipment, communication, personnel, tools, supplies)
- Borrowing system with borrower profiles and return management
- External agency resources and maintenance tracking
- Photo documentation via Cloudinary

### Operations Management
- Interactive maps: Leaflet on web, SVG pan/zoom on native
- Operation creation and status tracking by municipality
- Resource and personnel allocation to operations

### Situation Reports (SitRep)
- Upload and manage PDF, DOC, images, and other file types
- Search, filter, bulk delete, and offline download
- Automated SitRep export to DOCX

### Memo & Document Management
- Upload and distribute internal memos to users
- Acknowledgement tracking and supervisor/admin assignment
- Search, filter, and bulk operations

### Weather Station
- Live weather metrics from configured stations
- PAGASA advisory integration and alert thresholds
- Historical data, analytics dashboard, and rainfall prediction
- Custom station management (admin/supervisor)

### User Management
- Roles: admin, supervisor, and operator with permission-gated features
- Profile management with search and filter

## Architecture

### Technology Stack
- **Frontend**: React Native 0.81, Expo 54, Expo Router
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **State Management**: React Context with custom hooks
- **Offline Storage**: AsyncStorage and Expo SecureStore
- **Image Processing**: Cloudinary
- **Maps**: Leaflet (web), react-native-svg pan/zoom (native)
- **Notifications**: expo-notifications

### Data Flow
1. **Authentication**: Firebase Auth with persistent sessions
2. **Data Sync**: Real-time Firestore updates with offline fallback
3. **File Storage**: Firebase Storage for documents; Cloudinary for images
4. **Offline Queue**: Failed operations queued for later sync
5. **Cloud Functions**: Server-side admin operations (e.g. user creation)

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (or use `npx expo`)
- Firebase project (already configured)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd respondr
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Run on specific platforms:**
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web
   ```

### Firebase Setup
The app is pre-configured with Firebase. Enabled services:
- **Authentication**: User login/signup
- **Firestore**: Real-time database
- **Storage**: File storage
- **Cloud Functions**: Admin operations
- **Hosting**: Web deployment (`dist/`)

### Cloudinary Setup (Optional)
For full image optimization (demo mode works without it):
1. Create a Cloudinary account
2. Set environment variables in `.env`:
   ```env
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
   EXPO_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

See [docs/FIREBASE_CLOUDINARY_SETUP.md](docs/FIREBASE_CLOUDINARY_SETUP.md) and [docs/WEATHER_API_SETUP.md](docs/WEATHER_API_SETUP.md) for additional configuration.

## Usage

### Resource Management
1. Open the **Resources** tab
2. Add PDRRMO or external resources
3. Track borrowing, returns, and maintenance

### Operations
1. Open the **Operation** tab
2. View the Davao Oriental map
3. Create operations and assign resources and personnel

### Situation Reports
1. Open the **SitRep** tab
2. Upload documents with metadata
3. Search, filter, download offline, or export to DOCX

### Documents (Memos)
1. Open **Documents** from the side menu (admin, supervisor, or operator)
2. Upload and distribute memos
3. Track acknowledgements and assignments

### Weather Station
1. Open **Weather Station** from the side menu
2. Monitor live metrics, advisories, and alerts
3. Review historical data and predictive analysis

## Deployment

```bash
npm run build:web              # Export web build to dist/
npm run deploy:web             # Build and deploy to Firebase Hosting
npm run deploy:firebase        # Deploy rules, functions, and hosting
npm run build:android          # EAS production Android build
npm run build:ios              # EAS production iOS build
```

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) and [docs/ANDROID_BUILD_GUIDE.md](docs/ANDROID_BUILD_GUIDE.md) for full instructions.

## Development

### Adding New Features
- **Screens**: Add to `app/` following Expo Router conventions
- **Components**: Add to `components/` with TypeScript types
- **Hooks**: Add to `hooks/` for reusable logic
- **Contexts**: Add to `contexts/` for global state
- **Firebase Services**: Add to `firebase/`; server logic to `functions/`

### Documentation
Extended guides live in [`docs/`](docs/), including:
- [APP_BRIEF.md](docs/APP_BRIEF.md) — application overview
- [SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md) — detailed setup
- [RESILIENCE_FEATURES.md](docs/RESILIENCE_FEATURES.md) — offline architecture
- [MEMO_DOCUMENT_MANAGEMENT.md](docs/MEMO_DOCUMENT_MANAGEMENT.md) — memo system
- [MOBILE_USER_MANUAL.md](docs/MOBILE_USER_MANUAL.md) — end-user guide

## Dependencies

### Core
- **Expo 54** / **React Native 0.81** / **React 19**
- **Expo Router** — file-based navigation
- **TypeScript** — type safety

### Firebase
- **Firebase Auth, Firestore, Storage** — backend services
- **Firebase Cloud Functions** — server-side operations

### UI & UX
- **React Native Reanimated** — animations
- **Expo Vector Icons** — icons
- **React Native SVG** / **Leaflet** — maps

### Utilities
- **AsyncStorage** / **Expo SecureStore** — local and secure storage
- **Expo Document Picker** / **Expo Image Picker** — file and camera access
- **expo-notifications** — push notifications
- **docx** / **xlsx** — document and spreadsheet export

## License

This project is developed for disaster response management and emergency coordination.
