export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  totalQuantity: number;
  availableQuantity: number;
  images: string[]; // URLs or local paths to images
  location: string;
  status: ResourceStatus;
  condition: ResourceCondition;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  updatedBy: string; // User ID
  // External resource fields
  resourceType?: 'pdrrmo' | 'external';
  isBorrowable?: boolean;
  agencyId?: string;
  agencyName?: string;
  agencyAddress?: string;
  agencyContactNumbers?: string[];
  notes?: string;
  maintenanceNotes?: string;
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  isActive?: boolean;
}

export interface ResourceTransaction {
  id: string;
  resourceId: string;
  userId: string;
  type: TransactionType;
  quantity: number;
  status: TransactionStatus;
  notes?: string;
  dueDate?: Date;
  returnedDate?: Date;
  returnedQuantity?: number; // For partial returns
  returnedCondition?: ResourceCondition; // Condition when returned
  returnNotes?: string; // Notes specific to the return
  borrowerName: string;
  borrowerPicture?: string; // URL or local path to borrower's picture
  borrowerContact?: string; // Phone number or email
  borrowerDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiResourceTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  notes?: string;
  borrowerName: string;
  borrowerPicture?: string;
  borrowerContact?: string;
  borrowerDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
  items: MultiResourceTransactionItem[];
}

export interface MultiResourceTransactionItem {
  id: string;
  resourceId: string;
  quantity: number;
  dueDate?: Date;
  returnedDate?: Date;
  returnedQuantity?: number; // For partial returns
  returnedCondition?: ResourceCondition; // Condition when returned
  returnNotes?: string; // Notes specific to the return
  status: TransactionStatus;
  notes?: string;
}

export interface BorrowerProfile {
  id: string;
  name: string;
  contact?: string;
  department?: string;
  picture?: string;
  lastBorrowDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Removed all calculated fields - will be calculated in real-time
}

export interface Agency {
  id: string;
  name: string;
  address: string;
  contactNumbers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceHistory {
  id: string;
  resourceId: string;
  action: HistoryAction;
  userId: string;
  details: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ResourceMaintenance {
  id: string;
  resourceId: string;
  type: MaintenanceType;
  description: string;
  performedBy: string;
  performedAt: Date;
  nextDue?: Date;
  cost?: number;
  notes?: string;
}

export type ResourceCategory = 
  | 'vehicles'
  | 'medical'
  | 'equipment'
  | 'communication'
  | 'personnel'
  | 'tools'
  | 'supplies'
  | 'other';

export type ResourceStatus = 
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'retired';

export type ResourceCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'needs_repair';

export type TransactionType = 
  | 'borrow'
  | 'return'
  | 'checkout'
  | 'checkin'
  | 'transfer';

export type TransactionStatus = 
  | 'pending'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export type HistoryAction = 
  | 'created'
  | 'updated'
  | 'borrowed'
  | 'returned'
  | 'maintenance'
  | 'transferred'
  | 'deleted'
  | 'status_changed';

export type MaintenanceType = 
  | 'routine'
  | 'repair'
  | 'inspection'
  | 'cleaning'
  | 'calibration';

export interface ResourceFilters {
  category?: ResourceCategory;
  status?: ResourceStatus;
  condition?: ResourceCondition;
  search?: string;
  available?: boolean;
}

export interface ResourceStats {
  totalResources: number;
  availableResources: number;
  borrowedResources: number;
  maintenanceDue: number;
  categories: Record<ResourceCategory, number>;
}
