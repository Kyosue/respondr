import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from './config';

// Type definitions for Cloud Function requests/responses
export interface CreateUserSelfSignupRequest {
  email: string;
  password: string;
  fullName: string;
  displayName: string;
}

export interface CreateUserSelfSignupResponse {
  success: boolean;
  message: string;
  userId: string;
  userData: {
    id: string;
    fullName: string;
    displayName: string;
    email: string;
    userType: 'operator';
    status: 'inactive';
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreateUserByAdminRequest {
  email: string;
  password: string;
  fullName: string;
  displayName: string;
  userType: 'admin' | 'supervisor' | 'operator';
  status?: 'active' | 'inactive';
}

export interface CreateUserByAdminResponse {
  success: boolean;
  userData: {
    id: string;
    fullName: string;
    displayName: string;
    email: string;
    userType: 'admin' | 'supervisor' | 'operator';
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface UpdateUserByAdminRequest {
  userId: string;
  updates: {
    fullName?: string;
    displayName?: string;
    email?: string;
    userType?: 'admin' | 'supervisor' | 'operator';
    status?: 'active' | 'inactive' | 'suspended';
  };
}

export interface UpdateUserByAdminResponse {
  success: boolean;
}

export interface DeleteUserByAdminRequest {
  userId: string;
  hardDelete?: boolean;
}

export interface DeleteUserByAdminResponse {
  success: boolean;
}

/**
 * Self-signup Cloud Function
 * Creates a new user account without signing them in
 * New accounts are created with 'inactive' status
 */
export const createUserSelfSignup = async (
  data: CreateUserSelfSignupRequest
): Promise<CreateUserSelfSignupResponse> => {
  try {
    const callable = httpsCallable<CreateUserSelfSignupRequest, CreateUserSelfSignupResponse>(
      functions,
      'createUserSelfSignup'
    );
    
    const result: HttpsCallableResult<CreateUserSelfSignupResponse> = await callable(data);
    
    if (!result.data.success) {
      throw new Error('Failed to create user account');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('Error calling createUserSelfSignup:', error);
    
    // Handle Firebase Functions errors
    if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Invalid input data');
    } else if (error.code === 'functions/already-exists') {
      throw new Error('An account with this email already exists');
    } else if (error.code === 'functions/internal') {
      throw new Error('An error occurred while creating your account. Please try again.');
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to create account. Please try again.');
  }
};

/**
 * Create user by admin Cloud Function
 * Only admins can call this function
 */
export const createUserByAdmin = async (
  data: CreateUserByAdminRequest
): Promise<CreateUserByAdminResponse> => {
  try {
    const callable = httpsCallable<CreateUserByAdminRequest, CreateUserByAdminResponse>(
      functions,
      'createUserByAdmin'
    );
    
    const result: HttpsCallableResult<CreateUserByAdminResponse> = await callable(data);
    
    if (!result.data.success) {
      throw new Error('Failed to create user');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('Error calling createUserByAdmin:', error);
    
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to create users');
    } else if (error.code === 'functions/already-exists') {
      throw new Error('A user with this email already exists');
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to create user. Please try again.');
  }
};

/**
 * Update user by admin Cloud Function
 * Only admins can call this function
 */
export const updateUserByAdmin = async (
  data: UpdateUserByAdminRequest
): Promise<UpdateUserByAdminResponse> => {
  try {
    const callable = httpsCallable<UpdateUserByAdminRequest, UpdateUserByAdminResponse>(
      functions,
      'updateUserByAdmin'
    );
    
    const result: HttpsCallableResult<UpdateUserByAdminResponse> = await callable(data);
    
    return result.data;
  } catch (error: any) {
    console.error('Error calling updateUserByAdmin:', error);
    
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to update users');
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to update user. Please try again.');
  }
};

/**
 * Delete user by admin Cloud Function
 * Only admins can call this function
 */
export const deleteUserByAdmin = async (
  data: DeleteUserByAdminRequest
): Promise<DeleteUserByAdminResponse> => {
  try {
    const callable = httpsCallable<DeleteUserByAdminRequest, DeleteUserByAdminResponse>(
      functions,
      'deleteUserByAdmin'
    );
    
    const result: HttpsCallableResult<DeleteUserByAdminResponse> = await callable(data);
    
    return result.data;
  } catch (error: any) {
    console.error('Error calling deleteUserByAdmin:', error);
    
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to delete users');
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to delete user. Please try again.');
  }
};

