// Navigation configuration for the app
import { UserType } from '@/types/UserType';

// Define all possible menu items
const ALL_MENU_ITEMS = [
  {
    id: 'user-management',
    title: 'User Management',
    icon: 'people-outline',
    requiredRole: ['admin'] as UserType[],
  },
  {
    id: 'weather-station',
    title: 'Weather Station',
    icon: 'partly-sunny-outline',
    requiredRole: ['admin', 'supervisor', 'operator'] as UserType[],
  },
  {
    id: 'reports',
    title: 'Documents',
    icon: 'document-text-outline',
    requiredRole: ['admin', 'supervisor', 'operator'] as UserType[],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings-outline',
    requiredRole: ['admin', 'supervisor', 'operator'] as UserType[],
  },
  {
    id: 'logout',
    title: 'Logout',
    icon: 'log-out-outline',
    requiredRole: ['admin', 'supervisor', 'operator'] as UserType[],
  },
];

// Function to get menu items based on user role
export const getMenuItems = (userType: UserType) => {
  return ALL_MENU_ITEMS.filter(item => 
    item.requiredRole.includes(userType)
  );
};

// Legacy export for backward compatibility
export const HAMBURGER_MENU_ITEMS = ALL_MENU_ITEMS;

// Define bottom navigation tabs
export const BOTTOM_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'grid-outline',
  },
  {
    id: 'operations',
    label: 'Operation',
    icon: 'flash-outline',
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: 'cube-outline',
  },
  {
    id: 'sitrep',
    label: 'SitRep',
    icon: 'reader-outline',
  },
];
