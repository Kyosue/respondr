/**
 * Types for Memo and Local Issuance Documents
 * This is separate from SitRep documents to maintain clear separation
 */

export interface MemoDocument {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  downloadUrl: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  
  // Memo-specific fields
  memoNumber: string;
  issuingAgency: string;
  agencyLevel: 'national' | 'regional' | 'provincial' | 'municipal' | 'barangay';
  documentType: 'memorandum' | 'circular' | 'advisory' | 'directive' | 'executive-order' | 'ordinance' | 'policy';
  effectiveDate: Date;
  expirationDate?: Date;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  
  // Distribution and tracking
  distributionList: string[]; // User IDs
  acknowledgmentRequired: boolean;
  acknowledgments: MemoAcknowledgment[];
  
  // Relationships
  relatedOperations?: string[];
  supersedes?: string;
  supersededBy?: string;
  
  // Metadata
  tags?: string[];
  isPublic: boolean;
}

export interface MemoAcknowledgment {
  userId: string;
  userName: string;
  acknowledgedAt: Date;
  comments?: string;
}

export interface MemoUploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface MemoFilter {
  agencyLevel?: 'national' | 'regional' | 'provincial' | 'municipal' | 'barangay';
  documentType?: string;
  issuingAgency?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  uploadedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  acknowledgedBy?: string;
}

export interface MemoUploadOptions {
  onProgress?: (progress: MemoUploadProgress) => void;
  onSuccess?: (document: MemoDocument) => void;
  onError?: (error: string) => void;
  metadata?: Record<string, string>;
}

