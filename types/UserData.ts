import { UserType } from './UserType';

export interface UserData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  userType: UserType;
  createdAt?: any;
  updatedAt?: any;
}
