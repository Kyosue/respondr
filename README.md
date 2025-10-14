# Respondr App

A comprehensive disaster response management system built with React Native and Expo Router. Designed for emergency management agencies to coordinate resources, track operations, and manage situation reports during disasters and emergencies.

## Features

### 🚨 Core Functionality
- **Resource Management**: Complete inventory system for emergency resources (vehicles, medical supplies, equipment, personnel)
- **Operations Tracking**: Interactive map-based operations management for Davao Oriental municipalities
- **Situation Reports (SitRep)**: Document management system for emergency reports and attachments
- **User Management**: Multi-user system with role-based access control
- **Borrower Management**: Track resource borrowing and returns with borrower profiles

### 🔧 Technical Features
- **Firebase Integration**: Real-time data sync with Firestore and Firebase Storage
- **Offline Support**: Resilient operation in low-connectivity areas with local caching
- **Image Management**: Camera integration and Cloudinary optimization
- **Cross-Platform**: Native iOS, Android, and Web support
- **TypeScript**: Full type safety throughout the application
- **Theme Support**: Light and dark mode with responsive design

### 🛡️ Resilience Features
- **Offline-First Architecture**: Works without internet connection
- **Network State Monitoring**: Automatic retry mechanisms and connection quality detection
- **Data Synchronization**: Queued operations sync when connectivity is restored
- **Secure Storage**: Sensitive data stored with Expo SecureStore

## Project Structure

```
app/
├── _layout.tsx          # Root layout with authentication provider
├── index.tsx            # Main dashboard with tab navigation
├── login.tsx            # Authentication screen
└── signup.tsx           # User registration screen

components/
├── auth/                # Authentication components
├── dashboard/           # Dashboard components
├── operations/          # Operations management
│   ├── OperationsMap/   # Interactive map components
│   └── modals/         # Operation-related modals
├── resources/           # Resource management
│   ├── modals/         # Resource operation modals
│   ├── ResourceCard/   # Resource display components
│   └── ResourceHeader/ # Resource management header
├── sitrep/             # Situation reports
│   ├── DocumentCard/   # Document display components
│   ├── SitRepHeader/   # SitRep management header
│   └── modals/         # Document-related modals
├── user-management/    # User administration
├── reports/            # Reporting system
├── settings/           # App settings
├── help/               # Help and support
└── about/              # About information

firebase/               # Firebase services and configuration
├── config.ts          # Firebase initialization
├── auth.ts            # Authentication services
├── resources.ts       # Resource management
├── documents.ts       # Document management
└── resilient*.ts      # Offline-resilient services

contexts/              # React Context providers
├── AuthContext.tsx    # Authentication state
├── ResourceContext.tsx # Resource management state
├── SitRepContext.tsx  # Document management state
├── NetworkContext.tsx # Network status monitoring
└── ThemeContext.tsx   # Theme management

hooks/                 # Custom React hooks
├── useLogin.ts        # Authentication logic
├── useDocumentUpload.ts # Document upload handling
├── useDocumentDownload.ts # Document download handling
├── useImageUpload.ts  # Image upload functionality
└── useOfflineOperations.ts # Offline operation management

types/                 # TypeScript type definitions
├── Resource.ts        # Resource-related types
├── SitRep.ts          # Situation report types
├── Document.ts        # Document types
└── UserData.ts        # User management types

utils/                 # Utility functions
├── offlineStorage.ts  # Offline data persistence
├── networkUtils.ts    # Network management
├── syncManager.ts     # Data synchronization
└── cacheManager.ts    # Caching utilities
```

## Key Features

### Resource Management
- **Inventory Tracking**: Complete resource catalog with categories (vehicles, medical, equipment, communication, personnel, tools, supplies)
- **Borrowing System**: Track resource loans with borrower profiles and return management
- **External Resources**: Integration with external agencies and their resources
- **Maintenance Tracking**: Schedule and track resource maintenance
- **Image Support**: Photo documentation for resources

### Operations Management
- **Interactive Map**: Davao Oriental municipality map with operation tracking
- **Operation Creation**: Add and manage emergency operations by location
- **Status Tracking**: Monitor active and concluded operations
- **Resource Allocation**: Assign resources to specific operations

### Situation Reports (SitRep)
- **Document Upload**: Support for multiple file types (PDF, DOC, images, etc.)
- **Category Management**: Organize documents by type (reports, assessments, etc.)
- **Search & Filter**: Find documents quickly with search functionality
- **Bulk Operations**: Multi-select and bulk delete capabilities
- **Offline Access**: Download and view documents offline

### User Management
- **Multi-User Support**: Manage multiple users with different roles
- **Profile Management**: User profiles with contact information
- **Search & Filter**: Find users by name, department, or type

## Architecture

### Technology Stack
- **Frontend**: React Native with Expo Router
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **State Management**: React Context with custom hooks
- **Offline Storage**: AsyncStorage and Expo SecureStore
- **Image Processing**: Cloudinary integration
- **Maps**: Expo Maps with custom SVG maps

### Data Flow
1. **Authentication**: Firebase Auth with persistent sessions
2. **Data Sync**: Real-time Firestore updates with offline fallback
3. **File Storage**: Firebase Storage for documents and images
4. **Offline Queue**: Failed operations queued for later sync
5. **Caching**: Intelligent caching for improved performance

## Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
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
   npx expo start
   ```

3. **Run on specific platforms:**
   ```bash
   npx expo start --android    # Android
   npx expo start --ios        # iOS
   npx expo start --web        # Web
   ```

### Firebase Setup
The app is pre-configured with Firebase. The following services are enabled:
- **Authentication**: User login/signup
- **Firestore**: Real-time database
- **Storage**: File and image storage
- **Security Rules**: Configured for authenticated users

### Cloudinary Setup (Optional)
For full image optimization features:
1. Create a Cloudinary account
2. Set environment variables in `.env`:
   ```env
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
   EXPO_PUBLIC_CLOUDINARY_API_SECRET=your-api-secret
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

## Usage

### Resource Management
1. Navigate to Resources tab
2. Add new resources (PDRRMO or External)
3. Track borrowing and returns
4. Manage maintenance schedules

### Operations
1. Go to Operations tab
2. View interactive map of Davao Oriental
3. Click municipalities to see operations
4. Create new operations and assign resources

### Situation Reports
1. Access SitRep tab
2. Upload documents with metadata
3. Search and filter documents
4. Download for offline access

## Development

### Adding New Features
- **Screens**: Add to `app/` directory following Expo Router conventions
- **Components**: Add to `components/` directory with proper TypeScript types
- **Hooks**: Add to `hooks/` directory for reusable logic
- **Contexts**: Add to `contexts/` directory for state management
- **Firebase Services**: Add to `firebase/` directory

### Code Organization
- **Components**: Reusable UI components with proper styling
- **Hooks**: Business logic and state management
- **Contexts**: Global state management
- **Utils**: Helper functions and utilities
- **Types**: TypeScript type definitions

## Dependencies

### Core
- **Expo**: Cross-platform development framework
- **React Native**: Mobile app development
- **TypeScript**: Type safety and development experience
- **Expo Router**: File-based navigation

### Firebase
- **Firebase Auth**: User authentication
- **Firestore**: Real-time database
- **Firebase Storage**: File storage

### UI & UX
- **React Native Reanimated**: Smooth animations
- **Expo Vector Icons**: Icon library
- **React Native SVG**: Vector graphics support

### Utilities
- **AsyncStorage**: Local data persistence
- **Expo SecureStore**: Secure data storage
- **Expo Document Picker**: File selection
- **Expo Image Picker**: Camera and gallery access

## License

This project is developed for disaster response management and emergency coordination.
