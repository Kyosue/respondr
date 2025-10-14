import { UserType } from './UserType';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserData {
  id: string;
  fullName: string;
  displayName: string; // First + last name only
  email: string;
  userType: UserType;
  status?: UserStatus; // Made optional for backward compatibility
  lastLoginAt?: any;
  lastActivityAt?: any;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
  permissions?: string[];
  avatarUrl?: string;
}
