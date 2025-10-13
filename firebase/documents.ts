import { DocumentFilter, DocumentUploadOptions, SitRepDocument } from '@/types/Document';
import { generateUniqueId } from '@/utils/idGenerator';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { Platform } from 'react-native';
import { db, storage } from './config';

export class DocumentService {
  private static instance: DocumentService;
  private readonly collectionName = 'sitrep_documents';
  
  // File validation constants
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_FILE_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];
  
  private readonly ALLOWED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.zip', '.rar', '.7z'
  ];

  private constructor() {}

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File | Blob | any): { isValid: boolean; error?: string } {
    try {
      // Check file size
      const fileSize = file.size || (file as any).size || 0;
      if (fileSize === 0) {
        return { isValid: false, error: 'File is empty or corrupted' };
      }
      
      if (fileSize > this.MAX_FILE_SIZE) {
        const maxSizeMB = this.MAX_FILE_SIZE / (1024 * 1024);
        return { 
          isValid: false, 
          error: `File size exceeds maximum limit of ${maxSizeMB}MB` 
        };
      }
      
      // Check file type
      const fileType = file.type || (file as any).type || 'application/octet-stream';
      if (!this.ALLOWED_FILE_TYPES.includes(fileType)) {
        return { 
          isValid: false, 
          error: `File type '${fileType}' is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}` 
        };
      }
      
      // Check file extension
      const fileName = file.name || (file as any).name || '';
      const fileExtension = this.getFileExtension(file);
      if (!this.ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
        return { 
          isValid: false, 
          error: `File extension '${fileExtension}' is not allowed. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}` 
        };
      }
      
      // Additional security checks
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return { 
          isValid: false, 
          error: 'File name contains invalid characters' 
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Upload a document to Firebase Storage and save metadata to Firestore
   */
  async uploadDocument(
    file: File | Blob | any, // Allow any type for mobile compatibility
    metadata: {
      title: string;
      description?: string;
      uploadedBy: string;
      category?: SitRepDocument['category'];
      tags?: string[];
      isPublic?: boolean;
    },
    options?: DocumentUploadOptions
  ): Promise<SitRepDocument> {
    try {
      // Check if user is authenticated
      const { auth } = await import('./config');
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to upload documents');
      }
      
      // Validate file before upload
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'File validation failed');
      }
      
      const fileId = generateUniqueId();
      const fileExtension = this.getFileExtension(file);
      const fileName = `${fileId}${fileExtension}`;
      const storagePath = `sitrep/documents/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Handle mobile file properties
      const fileSize = file.size || (file as any).size || 0;
      const fileType = file.type || (file as any).type || 'application/octet-stream';
      
      // Create document metadata
      const documentData: Omit<SitRepDocument, 'id' | 'downloadUrl' | 'uploadedAt' | 'lastModified'> = {
        title: metadata.title,
        description: metadata.description,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileExtension, // File extension (e.g., .pdf, .docx)
        mimeType: fileType, // MIME type (e.g., application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
        storagePath: storagePath,
        uploadedBy: metadata.uploadedBy,
        tags: metadata.tags || [],
        category: metadata.category || 'other',
        isPublic: metadata.isPublic || false,
      };

      // Upload file to storage
      let uploadTask;
      
      if (Platform.OS === 'web') {
        // Web: Use File/Blob directly
        uploadTask = uploadBytesResumable(storageRef, file, {
          customMetadata: {
            title: metadata.title,
            description: metadata.description || '',
            uploadedBy: metadata.uploadedBy,
            category: metadata.category || 'other',
            tags: metadata.tags?.join(',') || '',
            isPublic: metadata.isPublic?.toString() || 'false',
            ...options?.metadata,
          }
        });
      } else {
        // Mobile: Use fetch to upload file from URI
        const response = await fetch((file as any).uri);
        const blob = await response.blob();
        
        uploadTask = uploadBytesResumable(storageRef, blob, {
          customMetadata: {
            title: metadata.title,
            description: metadata.description || '',
            uploadedBy: metadata.uploadedBy,
            category: metadata.category || 'other',
            tags: metadata.tags?.join(',') || '',
            isPublic: metadata.isPublic?.toString() || 'false',
            ...options?.metadata,
          }
        });
      }

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options?.onProgress?.({
              progress,
              status: 'uploading'
            });
          },
          (error) => {
            console.error('Upload error:', error);
            const errorMessage = this.getErrorMessage(error);
            options?.onError?.(errorMessage);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              // Get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Save document metadata to Firestore
              const docRef = await addDoc(collection(db, this.collectionName), {
                ...documentData,
                downloadUrl,
                uploadedAt: new Date(),
                lastModified: new Date(),
              });

              const document: SitRepDocument = {
                id: docRef.id,
                ...documentData,
                downloadUrl,
                uploadedAt: new Date(),
                lastModified: new Date(),
              };

              options?.onSuccess?.(document);
              options?.onProgress?.({
                progress: 100,
                status: 'completed'
              });

              resolve(document);
            } catch (error) {
              console.error('Error saving document metadata:', error);
              options?.onError?.(error instanceof Error ? error.message : 'Failed to save document metadata');
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Document upload error:', error);
      options?.onError?.(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    }
  }

  /**
   * Get all documents with optional filtering and pagination
   */
  async getDocuments(
    filters?: DocumentFilter,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ documents: SitRepDocument[]; lastDoc?: DocumentSnapshot }> {
    try {
      // Check if user is authenticated
      const { auth } = await import('./config');
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to access documents');
      }
      
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters?.fileType) {
        constraints.push(where('fileType', '==', filters.fileType));
      }
      
      if (filters?.uploadedBy) {
        constraints.push(where('uploadedBy', '==', filters.uploadedBy));
      }
      
      if (filters?.dateRange) {
        constraints.push(where('uploadedAt', '>=', filters.dateRange.start));
        constraints.push(where('uploadedAt', '<=', filters.dateRange.end));
      }

      // Order by upload date (newest first)
      constraints.push(orderBy('uploadedAt', 'desc'));
      
      // Pagination
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const documents: SitRepDocument[] = [];
      
      // Process documents and generate fresh download URLs
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const document = {
          id: docSnapshot.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date(),
        } as SitRepDocument;
        
        // Generate fresh download URL
        if (data.storagePath) {
          try {
            const storageRef = ref(storage, data.storagePath);
            document.downloadUrl = await getDownloadURL(storageRef);
          } catch (urlError) {
            console.error('Error generating download URL for document:', docSnapshot.id, urlError);
            // Keep the existing downloadUrl if generation fails
          }
        }
        
        documents.push(document);
      }

      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return {
        documents,
        lastDoc: lastDocument
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(documentId: string): Promise<SitRepDocument | null> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const document = {
          id: docSnap.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          lastModified: data.lastModified?.toDate() || new Date(),
        } as SitRepDocument;
        
        // Generate fresh download URL
        if (data.storagePath) {
          try {
            const storageRef = ref(storage, data.storagePath);
            document.downloadUrl = await getDownloadURL(storageRef);
          } catch (urlError) {
            console.error('Error generating download URL:', urlError);
            // Keep the existing downloadUrl if generation fails
          }
        }
        
        return document;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string, 
    updates: Partial<Pick<SitRepDocument, 'title' | 'description' | 'tags' | 'category' | 'isPublic'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await updateDoc(docRef, {
        ...updates,
        lastModified: new Date(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document and its file from storage
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get document metadata first
      const document = await this.getDocumentById(documentId);
      if (!document) {
        console.warn(`Document ${documentId} not found, may have been already deleted`);
        return; // Don't throw error, just return successfully
      }

      // Delete file from storage
      if (document.storagePath) {
        try {
          const storageRef = ref(storage, document.storagePath);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn(`Failed to delete file from storage for document ${documentId}:`, storageError);
          // Continue with Firestore deletion even if storage deletion fails
        }
      }

      // Delete document metadata from Firestore
      const docRef = doc(db, this.collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(documentId: string): Promise<string> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }
      return document.downloadUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  }

  /**
   * Refresh download URL for a document
   */
  async refreshDownloadUrl(documentId: string): Promise<string> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const data = docSnap.data();
      if (!data.storagePath) {
        throw new Error('Storage path not found for document');
      }
      
      const storageRef = ref(storage, data.storagePath);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update the document with the new download URL
      await updateDoc(docRef, { downloadUrl });
      
      return downloadUrl;
    } catch (error) {
      console.error('Error refreshing download URL:', error);
      throw error;
    }
  }

  /**
   * Search documents by title or description
   */
  async searchDocuments(
    searchQuery: string,
    filters?: Omit<DocumentFilter, 'searchQuery'>,
    pageSize: number = 20
  ): Promise<{ documents: SitRepDocument[]; lastDoc?: DocumentSnapshot }> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const { documents } = await this.getDocuments(filters, pageSize);
      
      const filteredDocuments = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      return { documents: filteredDocuments };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Get file extension from file
   */
  private getFileExtension(file: File | Blob | any): string {
    // Handle both File objects and simple file objects
    if (file.name) {
      const name = file.name;
      const lastDot = name.lastIndexOf('.');
      return lastDot !== -1 ? name.substring(lastDot) : '';
    }
    
    return '';
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          return 'You do not have permission to upload files. Please check your authentication.';
        case 'storage/canceled':
          return 'Upload was canceled. Please try again.';
        case 'storage/unknown':
          return 'An unknown error occurred during upload. Please try again.';
        case 'storage/invalid-format':
          return 'Invalid file format. Please check the file type.';
        case 'storage/invalid-checksum':
          return 'File appears to be corrupted. Please try uploading again.';
        case 'storage/quota-exceeded':
          return 'Storage quota exceeded. Please contact administrator.';
        case 'storage/unauthenticated':
          return 'Authentication required. Please log in and try again.';
        case 'storage/retry-limit-exceeded':
          return 'Upload failed after multiple attempts. Please check your connection and try again.';
        default:
          return `Upload failed: ${error.message || 'Unknown error'}`;
      }
    }
    
    return error.message || 'Upload failed due to an unknown error';
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ totalSize: number; documentCount: number }> {
    try {
      const { documents } = await this.getDocuments({}, 1000); // Get all documents
      const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
      return {
        totalSize,
        documentCount: documents.length
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}
