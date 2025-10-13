export interface SitRep {
  id: string;
  title: string;
  description: string;
  status: SitRepStatus;
  priority: SitRepPriority;
  category: SitRepCategory;
  location: string;
  reporter: string;
  reporterContact?: string;
  images: string[]; // URLs or local paths to images
  attachments: SitRepAttachment[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  updatedBy: string; // User ID
  isDraft: boolean;
  isArchived: boolean;
}

export interface SitRepAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  size: number;
  uploadedAt: Date;
}

export type SitRepStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export type SitRepPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type SitRepCategory = 
  | 'emergency'
  | 'disaster'
  | 'security'
  | 'infrastructure'
  | 'personnel'
  | 'logistics'
  | 'medical'
  | 'communication'
  | 'other';

export type AttachmentType = 
  | 'image'
  | 'document'
  | 'video'
  | 'audio'
  | 'other';

export interface SitRepFilters {
  status?: SitRepStatus;
  priority?: SitRepPriority;
  category?: SitRepCategory;
  search?: string;
  isDraft?: boolean;
  isArchived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SitRepStats {
  totalSitReps: number;
  draftSitReps: number;
  submittedSitReps: number;
  approvedSitReps: number;
  criticalSitReps: number;
  categories: Record<SitRepCategory, number>;
  priorities: Record<SitRepPriority, number>;
}
