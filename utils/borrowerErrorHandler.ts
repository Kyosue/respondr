import { BorrowerProfile } from '@/types/Resource';
import { OfflineStorage } from './offlineStorage';

export interface BorrowerOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  borrowerId: string;
  data: Partial<BorrowerProfile>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface BorrowerError {
  code: string;
  message: string;
  operation?: BorrowerOperation;
  originalError?: Error;
  canRetry: boolean;
  shouldRollback: boolean;
}

export class BorrowerErrorHandler {
  private static instance: BorrowerErrorHandler;
  private offlineStorage: OfflineStorage;
  private operationHistory: Map<string, BorrowerOperation> = new Map();

  private constructor() {
    this.offlineStorage = OfflineStorage.getInstance();
  }

  static getInstance(): BorrowerErrorHandler {
    if (!BorrowerErrorHandler.instance) {
      BorrowerErrorHandler.instance = new BorrowerErrorHandler();
    }
    return BorrowerErrorHandler.instance;
  }

  // Register an operation for potential rollback
  registerOperation(operation: BorrowerOperation): void {
    this.operationHistory.set(operation.id, operation);
  }

  // Handle errors with appropriate recovery strategies
  async handleError(error: Error, operation: BorrowerOperation): Promise<BorrowerError> {
    const borrowerError = this.classifyError(error, operation);
    
    console.error(`Borrower operation error [${operation.type}]:`, {
      operationId: operation.id,
      borrowerId: operation.borrowerId,
      error: error.message,
      canRetry: borrowerError.canRetry,
      shouldRollback: borrowerError.shouldRollback
    });

    if (borrowerError.shouldRollback) {
      await this.performRollback(operation);
    }

    if (borrowerError.canRetry && operation.retryCount < operation.maxRetries) {
      await this.scheduleRetry(operation);
    }

    return borrowerError;
  }

  // Classify errors and determine recovery strategy
  private classifyError(error: Error, operation: BorrowerOperation): BorrowerError {
    const errorMessage = error.message.toLowerCase();
    
    // Network errors - can retry
    if (this.isNetworkError(errorMessage)) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Operation will be retried when connection is restored.',
        operation,
        originalError: error,
        canRetry: true,
        shouldRollback: false
      };
    }

    // Validation errors - don't retry, don't rollback
    if (this.isValidationError(errorMessage)) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed. Please check your input and try again.',
        operation,
        originalError: error,
        canRetry: false,
        shouldRollback: false
      };
    }

    // Authentication errors - don't retry, don't rollback
    if (this.isAuthenticationError(errorMessage)) {
      return {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed. Please log in again.',
        operation,
        originalError: error,
        canRetry: false,
        shouldRollback: false
      };
    }

    // Permission errors - don't retry, don't rollback
    if (this.isPermissionError(errorMessage)) {
      return {
        code: 'PERMISSION_ERROR',
        message: 'You do not have permission to perform this operation.',
        operation,
        originalError: error,
        canRetry: false,
        shouldRollback: false
      };
    }

    // Server errors - can retry, may need rollback
    if (this.isServerError(errorMessage)) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error occurred. Operation will be retried.',
        operation,
        originalError: error,
        canRetry: true,
        shouldRollback: operation.type === 'create' // Rollback creates on server error
      };
    }

    // Database errors - may retry, may need rollback
    if (this.isDatabaseError(errorMessage)) {
      return {
        code: 'DATABASE_ERROR',
        message: 'Database error occurred. Operation will be retried.',
        operation,
        originalError: error,
        canRetry: true,
        shouldRollback: operation.type === 'create' || operation.type === 'update'
      };
    }

    // Unknown errors - don't retry, may need rollback
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      operation,
      originalError: error,
      canRetry: false,
      shouldRollback: operation.type === 'create' // Rollback creates on unknown errors
    };
  }

  // Perform rollback for an operation
  private async performRollback(operation: BorrowerOperation): Promise<void> {
    try {
      console.log(`Performing rollback for operation ${operation.id} (${operation.type})`);
      
      switch (operation.type) {
        case 'create':
          // For create operations, remove the borrower from local storage
          await this.offlineStorage.deleteBorrower(operation.borrowerId);
          break;
          
        case 'update':
          // For update operations, restore the previous state
          // This would require storing the previous state before the update
          console.warn('Rollback for update operations not fully implemented');
          break;
          
        case 'delete':
          // For delete operations, restore the borrower
          if (operation.data) {
            await this.offlineStorage.saveBorrowerData(operation.data as BorrowerProfile);
          }
          break;
      }
      
      console.log(`Rollback completed for operation ${operation.id}`);
    } catch (rollbackError) {
      console.error(`Failed to perform rollback for operation ${operation.id}:`, rollbackError);
    }
  }

  // Schedule retry for an operation
  private async scheduleRetry(operation: BorrowerOperation): Promise<void> {
    try {
      operation.retryCount++;
      const delay = this.calculateRetryDelay(operation.retryCount);
      
      console.log(`Scheduling retry ${operation.retryCount}/${operation.maxRetries} for operation ${operation.id} in ${delay}ms`);
      
      setTimeout(async () => {
        try {
          // This would trigger the retry mechanism
          // The actual retry logic would be implemented in the service layer
          console.log(`Retrying operation ${operation.id}`);
        } catch (retryError) {
          console.error(`Retry failed for operation ${operation.id}:`, retryError);
        }
      }, delay);
    } catch (error) {
      console.error(`Failed to schedule retry for operation ${operation.id}:`, error);
    }
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount - 1), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  // Error classification methods
  private isNetworkError(message: string): boolean {
    const networkKeywords = [
      'network', 'connection', 'timeout', 'offline', 'unreachable',
      'fetch', 'request failed', 'no internet', 'dns'
    ];
    return networkKeywords.some(keyword => message.includes(keyword));
  }

  private isValidationError(message: string): boolean {
    const validationKeywords = [
      'validation', 'invalid', 'required', 'format', 'pattern',
      'length', 'range', 'type', 'constraint'
    ];
    return validationKeywords.some(keyword => message.includes(keyword));
  }

  private isAuthenticationError(message: string): boolean {
    const authKeywords = [
      'auth', 'unauthorized', 'forbidden', 'token', 'login',
      'permission denied', 'access denied'
    ];
    return authKeywords.some(keyword => message.includes(keyword));
  }

  private isPermissionError(message: string): boolean {
    const permissionKeywords = [
      'permission', 'access', 'denied', 'forbidden', 'unauthorized',
      'insufficient', 'privilege'
    ];
    return permissionKeywords.some(keyword => message.includes(keyword));
  }

  private isServerError(message: string): boolean {
    const serverKeywords = [
      'server', 'internal', '500', '502', '503', '504',
      'service unavailable', 'bad gateway'
    ];
    return serverKeywords.some(keyword => message.includes(keyword));
  }

  private isDatabaseError(message: string): boolean {
    const databaseKeywords = [
      'database', 'firestore', 'firebase', 'query', 'transaction',
      'constraint', 'duplicate', 'not found', 'already exists'
    ];
    return databaseKeywords.some(keyword => message.includes(keyword));
  }

  // Get operation history
  getOperationHistory(): BorrowerOperation[] {
    return Array.from(this.operationHistory.values());
  }

  // Clear operation history
  clearOperationHistory(): void {
    this.operationHistory.clear();
  }

  // Get error statistics
  getErrorStatistics(): { totalErrors: number; errorsByType: Record<string, number> } {
    const operations = this.getOperationHistory();
    const errorsByType: Record<string, number> = {};
    
    operations.forEach(operation => {
      if (operation.retryCount > 0) {
        errorsByType[operation.type] = (errorsByType[operation.type] || 0) + 1;
      }
    });

    return {
      totalErrors: operations.reduce((sum, op) => sum + op.retryCount, 0),
      errorsByType
    };
  }
}
