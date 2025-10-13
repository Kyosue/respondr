export interface SitRepDocument {
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
  tags?: string[];
  category?: 'report' | 'image' | 'spreadsheet' | 'presentation' | 'other';
  isPublic: boolean;
}

export interface DocumentUploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface DocumentFilter {
  category?: string;
  fileType?: string;
  uploadedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface DocumentUploadOptions {
  onProgress?: (progress: DocumentUploadProgress) => void;
  onSuccess?: (document: SitRepDocument) => void;
  onError?: (error: string) => void;
  metadata?: Record<string, string>;
}
