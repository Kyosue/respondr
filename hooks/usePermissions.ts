import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/UserType';
import {
    canAccessSettings,
    canCreateResources,
    canDeleteResources,
    canEditResources,
    canGenerateReports,
    canManageOperations,
    canManageSitRep,
    canManageUsers,
    canViewUserManagement,
    hasPermission,
    isAdminOrSupervisor,
    isOperator,
    PERMISSIONS
} from '@/utils/permissions';

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  const userType: UserType = user?.userType || 'operator';
  
  return {
    // User type checks
    userType,
    isAdmin: userType === 'admin',
    isSupervisor: userType === 'supervisor',
    isOperator: isOperator(userType),
    isAdminOrSupervisor: isAdminOrSupervisor(userType),
    
    // Permission checks
    hasPermission: (permission: string) => hasPermission(userType, permission),
    
    // User Management permissions
    canViewUserManagement: canViewUserManagement(userType),
    canManageUsers: canManageUsers(userType),
    canCreateUsers: hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_CREATE),
    canEditUsers: hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_EDIT),
    canDeleteUsers: hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_DELETE),
    canToggleUserStatus: hasPermission(userType, PERMISSIONS.USER_MANAGEMENT_TOGGLE_STATUS),
    
    // Resource Management permissions
    canViewResources: hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_VIEW),
    canCreateResources: canCreateResources(userType),
    canEditResources: canEditResources(userType),
    canDeleteResources: canDeleteResources(userType),
    canBorrowResources: hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_BORROW),
    canReturnResources: hasPermission(userType, PERMISSIONS.RESOURCE_MANAGEMENT_RETURN),
    
    // Operations permissions
    canViewOperations: hasPermission(userType, PERMISSIONS.OPERATIONS_VIEW),
    canManageOperations: canManageOperations(userType),
    canCreateOperations: hasPermission(userType, PERMISSIONS.OPERATIONS_CREATE),
    canEditOperations: hasPermission(userType, PERMISSIONS.OPERATIONS_EDIT),
    canDeleteOperations: hasPermission(userType, PERMISSIONS.OPERATIONS_DELETE),
    
    // SitRep permissions
    canViewSitRep: hasPermission(userType, PERMISSIONS.SITREP_VIEW),
    canManageSitRep: canManageSitRep(userType),
    canCreateSitRep: hasPermission(userType, PERMISSIONS.SITREP_CREATE),
    canEditSitRep: hasPermission(userType, PERMISSIONS.SITREP_EDIT),
    canDeleteSitRep: hasPermission(userType, PERMISSIONS.SITREP_DELETE),
    canUploadSitRep: hasPermission(userType, PERMISSIONS.SITREP_UPLOAD),
    
    // Reports permissions
    canViewReports: hasPermission(userType, PERMISSIONS.REPORTS_VIEW),
    canGenerateReports: canGenerateReports(userType),
    canExportReports: hasPermission(userType, PERMISSIONS.REPORTS_EXPORT),
    
    // Settings permissions
    canAccessSettings: canAccessSettings(userType),
    canEditSettings: hasPermission(userType, PERMISSIONS.SETTINGS_EDIT),
    
    // System permissions
    isSystemAdmin: hasPermission(userType, PERMISSIONS.SYSTEM_ADMIN),
  };
};
