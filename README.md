# Respondr App

A clean React Native app with authentication built using Expo Router.

## Features

- **Authentication System**: Login/logout functionality with form validation
- **Clean Architecture**: Separated business logic and UI components
- **TypeScript**: Full type safety throughout the application
- **Theme Support**: Light and dark mode support
- **Responsive Design**: Works on iOS, Android, and Web

## Project Structure

```
app/
├── _layout.tsx          # Root layout with authentication provider
├── login.tsx            # Login screen
└── (tabs)/
    ├── _layout.tsx      # Tab navigation layout
    ├── index.tsx        # Home screen (requires authentication)
    └── explore.tsx      # Explore screen

components/
├── auth/
│   └── LoginForm.tsx   # Reusable login form component
├── ThemedText.tsx       # Themed text component
└── ThemedView.tsx       # Themed view component

contexts/
└── AuthContext.tsx      # Authentication context for state management

hooks/
└── useLogin.ts          # Custom hook for login business logic
```

## Architecture

### Separation of Concerns

- **UI Components**: Located in `components/` directory
- **Business Logic**: Handled in custom hooks (`hooks/useLogin.ts`)
- **State Management**: Managed through React Context (`contexts/AuthContext.tsx`)
- **Navigation**: Handled by Expo Router

### Authentication Flow

1. App starts at login screen
2. User enters credentials
3. Form validation occurs
4. Login API call (currently mocked)
5. On success, user is redirected to main app
6. User state is managed globally through AuthContext

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Use the following test credentials:
   - Email: any valid email format (e.g., `test@example.com`)
   - Password: at least 6 characters

## Development

### Adding New Features

- **New Screens**: Add to `app/` directory following Expo Router conventions
- **New Components**: Add to `components/` directory
- **New Hooks**: Add to `hooks/` directory
- **New Contexts**: Add to `contexts/` directory

### Styling

The app uses React Native StyleSheet for styling with a consistent design system. Components use themed variants for light/dark mode support.

## Dependencies

- Expo Router for navigation
- React Native for UI components
- TypeScript for type safety
- React Context for state management
