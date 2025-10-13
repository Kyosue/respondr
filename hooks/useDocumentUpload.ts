import { DocumentService } from '@/firebase/documents';
import { DocumentUploadOptions, DocumentUploadProgress, SitRepDocument } from '@/types/Document';
import { useCallback, useState } from 'react';

interface UseDocumentUploadReturn {
  uploadDocument: (
    file: File | Blob,
    metadata: {
      title: string;
      description?: string;
      uploadedBy: string;
      category?: SitRepDocument['category'];
      tags?: string[];
      isPublic?: boolean;
    }
  ) => Promise<SitRepDocument>;
  isUploading: boolean;
  uploadProgress: DocumentUploadProgress | null;
  error: string | null;
  clearError: () => void;
}

export const useDocumentUpload = (): UseDocumentUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documentService = DocumentService.getInstance();

  const uploadDocument = useCallback(async (
    file: File | Blob,
    metadata: {
      title: string;
      description?: string;
      uploadedBy: string;
      category?: SitRepDocument['category'];
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<SitRepDocument> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress({ progress: 0, status: 'uploading' });

    const options: DocumentUploadOptions = {
      onProgress: (progress) => {
        setUploadProgress(progress);
      },
      onSuccess: (document) => {
        setUploadProgress({ progress: 100, status: 'completed' });
        setIsUploading(false);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
        setIsUploading(false);
      }
    };

    try {
      const document = await documentService.uploadDocument(file, metadata, options);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      setIsUploading(false);
      throw err;
    }
  }, [documentService]);

  const clearError = useCallback(() => {
    setError(null);
    setUploadProgress(null);
  }, []);

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    error,
    clearError
  };
};
