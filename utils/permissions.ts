import { UserType } from '@/types/UserType';

/**
 * Permission definitions for different user roles
 */
export const PERMISSIONS = {
  // User Management
  USER_MANAGEMENT_VIEW: 'user_management_view',
  USER_MANAGEMENT_CREATE: 'user_management_create',
  USER_MANAGEMENT_EDIT: 'user_management_edit',
  USER_MANAGEMENT_DELETE: 'user_management_delete',
  USER_MANAGEMENT_TOGGLE_STATUS: 'user_management_toggle_status',
  
  // Resource Management
  RESOURCE_MANAGEMENT_VIEW: 'resource_management_view',
  RESOURCE_MANAGEMENT_CREATE: 'resource_management_create',
  RESOURCE_MANAGEMENT_EDIT: 'resource_management_edit',
  RESOURCE_MANAGEMENT_DELETE: 'resource_management_delete',
  RESOURCE_MANAGEMENT_BORROW: 'resource_management_borrow',
  RESOURCE_MANAGEMENT_RETURN: 'resource_management_return',
  
  // Operations
  OPERATIONS_VIEW: 'operations_view',
  OPERATIONS_CREATE: 'operations_create',
  OPERATIONS_EDIT: 'operations_edit',
  OPERATIONS_DELETE: 'operations_delete',
  
  // SitRep
  SITREP_VIEW: 'sitrep_view',
  SITREP_CREATE: 'sitrep_create',
  SITREP_EDIT: 'sitrep_edit',
  SITREP_DELETE: 'sitrep_delete',
  SITREP_UPLOAD: 'sitrep_upload',
  
  // Reports
  REPORTS_VIEW: 'reports_view',
  REPORTS_GENERATE: 'reports_generate',
  REPORTS_EXPORT: 'reports_export',
  
  // Settings
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_EDIT: 'settings_edit',
  
  // System Administration
  SYSTEM_ADMIN: 'system_admin',
} as const;

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserType, string[]> = {
  admin: [
    // Full access to everything
    PERMISSIONS.USER_MANAGEMENT_VIEW,
    PERMISSIONS.USER_MANAGEMENT_CREATE,
    PERMISSIONS.USER_MANAGEMENT_EDIT,
    PERMISSIONS.USER_MANAGEMENT_DELETE,
    PERMISSIONS.USER_MANAGEMENT_TOGGLE_STATUS,
    PERMISSIONS.RESOURCE_MANAGEMENT_VIEW,
    PERMISSIONS.RESOURCE_MANAGEMENT_CREATE,
    PERMISSIONS.RESOURCE_MANAGEMENT_EDIT,
    PERMISSIONS.RESOURCE_MANAGEMENT_DELETE,
    PERMISSIONS.RESOURCE_MANAGEMENT_BORROW,
    PERMISSIONS.RESOURCE_MANAGEMENT_RETURN,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.OPERATIONS_CREATE,
    PERMISSIONS.OPERATIONS_EDIT,
    PERMISSIONS.OPERATIONS_DELETE,
    PERMISSIONS.SITREP_VIEW,
    PERMISSIONS.SITREP_CREATE,
    PERMISSIONS.SITREP_EDIT,
    PERMISSIONS.SITREP_DELETE,
    PERMISSIONS.SITREP_UPLOAD,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SYSTEM_ADMIN,
  ],
  
  supervisor: [
    // Same as admin - full access to everything
    PERMISSIONS.USER_MANAGEMENT_VIEW,
    PERMISSIONS.USER_MANAGEMENT_CREATE,
    PERMISSIONS.USER_MANAGEMENT_EDIT,
    PERMISSIONS.USER_MANAGEMENT_DELETE,
    PERMISSIONS.USER_MANAGEMENT_TOGGLE_STATUS,
    PERMISSIONS.RESOURCE_MANAGEMENT_VIEW,
    PERMISSIONS.RESOURCE_MANAGEMENT_CREATE,
    PERMISSIONS.RESOURCE_MANAGEMENT_EDIT,
    PERMISSIONS.RESOURCE_MANAGEMENT_DELETE,
    PERMISSIONS.RESOURCE_MANAGEMENT_BORROW,
    PERMISSIONS.RESOURCE_MANAGEMENT_RETURN,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.OPERATIONS_CREATE,
    PERMISSIONS.OPERATIONS_EDIT,
    PERMISSIONS.OPERATIONS_DELETE,
    PERMISSIONS.SITREP_VIEW,
    PERMISSIONS.SITREP_CREATE,
    PERMISSIONS.SITREP_EDIT,
    PERMISSIONS.SITREP_DELETE,
    PERMISSIONS.SITREP_UPLOAD,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  
  operator: [
    // Limited access - no user management, limited other features
    PERMISSIONS.RESOURCE_MANAGEMENT_VIEW,
    PERMISSIONS.RESOURCE_MANAGEMENT_BORROW,
    PERMISSIONS.RESOURCE_MANAGEMENT_RETURN,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.SITREP_VIEW,
    PERMISSIONS.SITREP_CREATE,
    PERMISSIONS.SITREP_UPLOAD,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (userType: UserType, permission: string): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userType] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if a user can manage users (create, edit, delete)
 */
export const canManageUsers = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_CREATE) &&
         hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_EDIT) &&
         hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_DELETE);
};

/**
 * Check if a user can view user management
 */
export const canViewUserManagement = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_VIEW);
};

/**
 * Check if a user can create resources
 */
export const canCreateResources = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_CREATE);
};

/**
 * Check if a user can edit resources
 */
export const canEditResources = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_EDIT);
};

/**
 * Check if a user can delete resources
 */
export const canDeleteResources = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_DELETE);
};

/**
 * Check if a user can manage operations
 */
export const canManageOperations = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.OPERATIONS_CREATE) &&
         hasPermission(userType, PERMISSIONS.OPERATIONS_EDIT) &&
         hasPermission(userType, PERMISSIONS.OPERATIONS_DELETE);
};

/**
 * Check if a user can manage SitRep
 */
export const canManageSitRep = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.SITREP_CREATE) &&
         hasPermission(userType, PERMISSIONS.SITREP_EDIT) &&
         hasPermission(userType, PERMISSIONS.SITREP_DELETE);
};

/**
 * Check if a user can generate reports
 */
export const canGenerateReports = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.REPORTS_GENERATE);
};

/**
 * Check if a user can access settings
 */
export const canAccessSettings = (userType: UserType): boolean => {
  return hasPermission(userType, PERMISSIONS.SETTINGS_VIEW);
};

/**
 * Get all permissions for a user type
 */
export const getUserPermissions = (userType: UserType): string[] => {
  return ROLE_PERMISSIONS[userType] || [];
};

/**
 * Check if user type is admin or supervisor
 */
export const isAdminOrSupervisor = (userType: UserType): boolean => {
  return userType === 'admin' || userType === 'supervisor';
};

/**
 * Check if user type is operator
 */
export const isOperator = (userType: UserType): boolean => {
  return userType === 'operator';
};
