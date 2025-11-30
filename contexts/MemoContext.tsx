import { auth } from '@/firebase/config';
import { MemoService } from '@/firebase/memos';
import { MemoDocument, MemoFilter, MemoUploadOptions } from '@/types/MemoDocument';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface MemoContextType {
  documents: MemoDocument[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  selectedDocuments: Set<string>;
  uploadProgress: Map<string, number>;
  currentUploadProgress: number;
  
  // Actions
  uploadDocument: (
    file: File | Blob | any,
    metadata: {
      title: string;
      description?: string;
      memoNumber: string;
      issuingAgency: string;
      agencyLevel: 'national' | 'regional' | 'provincial' | 'municipal' | 'barangay';
      documentType: 'memorandum' | 'circular' | 'advisory' | 'directive' | 'executive-order' | 'ordinance' | 'policy';
      effectiveDate: Date;
      expirationDate?: Date;
      priority: 'urgent' | 'high' | 'normal' | 'low';
      distributionList: string[];
      acknowledgmentRequired: boolean;
      tags?: string[];
      isPublic?: boolean;
    }
  ) => Promise<MemoDocument>;
  
  fetchDocuments: (filters?: MemoFilter, refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  getDocumentById: (id: string) => Promise<MemoDocument | null>;
  updateDocument: (id: string, updates: Partial<MemoDocument>) => Promise<void>;
  updateDistribution: (id: string, userIds: string[]) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  acknowledgeDocument: (id: string, userId: string, userName: string, comments?: string) => Promise<void>;
  selectDocument: (id: string) => void;
  deselectDocument: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelected: () => Promise<void>;
}

const MemoContext = createContext<MemoContextType | undefined>(undefined);

interface MemoProviderProps {
  children: ReactNode;
}

export function MemoProvider({ children }: MemoProviderProps) {
  const [documents, setDocuments] = useState<MemoDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<MemoFilter | undefined>();
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [currentUploadProgress, setCurrentUploadProgress] = useState(0);

  const memoService = MemoService.getInstance();
  const { isAuthenticated, isLoading } = useAuth();

  // Fetch documents after authentication is ready
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      fetchDocuments();
    }
  }, [isLoading, isAuthenticated]);

  const fetchDocuments = async (filters?: MemoFilter, refresh: boolean = false) => {
    try {
      // Guard: only attempt when authenticated
      if (!isAuthenticated) {
        setDocuments([]);
        setError(null);
        setHasMore(true);
        setLastDoc(null);
        return;
      }
      setLoading(true);
      setError(null);

      const pageSize = 20;
      const { documents: newDocuments, lastDoc: newLastDoc } = await memoService.getMemoDocuments(
        filters,
        pageSize,
        refresh ? undefined : lastDoc
      );

      if (refresh) {
        setDocuments(newDocuments);
        setLastDoc(newLastDoc);
      } else {
        setDocuments(prev => [...prev, ...newDocuments]);
        setLastDoc(newLastDoc);
      }

      setHasMore(newDocuments.length === pageSize);
      setCurrentFilters(filters);
    } catch (err) {
      // Suppress noisy unauthenticated logs; surface other errors
      if (!(err instanceof Error && err.message.includes('User must be authenticated'))) {
        console.error('Error fetching documents:', err);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchDocuments(currentFilters, false);
    }
  };

  const refresh = async () => {
    setLastDoc(null);
    setHasMore(true);
    await fetchDocuments(currentFilters, true);
  };

  const uploadDocument = async (
    file: File | Blob | any,
    metadata: {
      title: string;
      description?: string;
      memoNumber?: string;
      issuingAgency: string;
      agencyLevel: 'national' | 'regional' | 'provincial' | 'municipal' | 'barangay';
      effectiveDate: Date;
      expirationDate?: Date;
      priority: 'urgent' | 'high' | 'normal' | 'low';
      distributionList: string[];
      acknowledgmentRequired: boolean;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<MemoDocument> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      setError(null);
      
      const options: MemoUploadOptions = {
        onProgress: (progress) => {
          setCurrentUploadProgress(progress.progress);
          const newProgress = new Map(uploadProgress);
          newProgress.set(file.name, progress.progress);
          setUploadProgress(newProgress);
        },
      };

      const doc = await memoService.uploadMemoDocument(
        file,
        {
          ...metadata,
          uploadedBy: currentUser.uid,
        },
        options
      );

      // Refresh documents list
      await refresh();

      return doc;
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      throw err;
    } finally {
      // Clear upload progress after completion
      setUploadProgress(new Map());
    }
  };

  const getDocumentById = async (id: string): Promise<MemoDocument | null> => {
    try {
      return await memoService.getMemoDocument(id);
    } catch (err) {
      console.error('Error getting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to get document');
      return null;
    }
  };

  const updateDocument = async (id: string, updates: Partial<MemoDocument>) => {
    try {
      setError(null);
      await memoService.updateMemoDocument(id, updates);
      await refresh();
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setError(null);
      await memoService.deleteMemoDocument(id);
      await refresh();
      
      // Remove from selected if selected
      const newSelected = new Set(selectedDocuments);
      newSelected.delete(id);
      setSelectedDocuments(newSelected);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    }
  };

  const updateDistribution = async (id: string, userIds: string[]) => {
    try {
      setError(null);
      await memoService.updateMemoDocument(id, { distributionList: userIds });
      await refresh();
    } catch (err) {
      console.error('Error updating distribution:', err);
      setError(err instanceof Error ? err.message : 'Failed to update distribution');
      throw err;
    }
  };

  const acknowledgeDocument = async (id: string, userId: string, userName: string, comments?: string) => {
    try {
      setError(null);
      await memoService.acknowledgeMemoDocument(id, userId, userName, comments);
      await refresh();
    } catch (err) {
      console.error('Error acknowledging document:', err);
      setError(err instanceof Error ? err.message : 'Failed to acknowledge document');
      throw err;
    }
  };

  const selectDocument = (id: string) => {
    setSelectedDocuments(new Set([...selectedDocuments, id]));
  };

  const deselectDocument = (id: string) => {
    const newSelected = new Set(selectedDocuments);
    newSelected.delete(id);
    setSelectedDocuments(newSelected);
  };

  const selectAll = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc.id)));
  };

  const deselectAll = () => {
    setSelectedDocuments(new Set());
  };

  const deleteSelected = async () => {
    try {
      setError(null);
      const deletePromises = Array.from(selectedDocuments).map(id => 
        memoService.deleteMemoDocument(id)
      );
      await Promise.all(deletePromises);
      setSelectedDocuments(new Set());
      await refresh();
    } catch (err) {
      console.error('Error deleting selected documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete documents');
      throw err;
    }
  };

  const value: MemoContextType = {
    documents,
    loading,
    error,
    hasMore,
    selectedDocuments,
    uploadProgress,
    currentUploadProgress,
    uploadDocument,
    fetchDocuments,
    loadMore,
    refresh,
    getDocumentById,
    updateDocument,
    updateDistribution,
    deleteDocument,
    acknowledgeDocument,
    selectDocument,
    deselectDocument,
    selectAll,
    deselectAll,
    deleteSelected,
  };

  return (
    <MemoContext.Provider value={value}>
      {children}
    </MemoContext.Provider>
  );
}

export function useMemo() {
  const context = useContext(MemoContext);
  if (context === undefined) {
    throw new Error('useMemo must be used within a MemoProvider');
  }
  return context;
}

