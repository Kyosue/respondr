/**
 * Firebase service for Memo Documents
 * Separate from DocumentService to maintain independence from SitRep
 */

import { MemoDocument, MemoFilter, MemoUploadOptions } from '@/types/MemoDocument';
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
import { db, storage } from './config';

export class MemoService {
  private static instance: MemoService;
  private readonly collectionName = 'memo_documents';
  
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

  public static getInstance(): MemoService {
    if (!MemoService.instance) {
      MemoService.instance = new MemoService();
    }
    return MemoService.instance;
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
   * Get file extension from file name
   */
  private getFileExtension(file: File | Blob | any): string {
    const fileName = file.name || (file as any).name || '';
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.substring(lastDot);
  }

  /**
   * Convert Firestore timestamp to Date
   */
  private timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  }

  /**
   * Upload a memo document to Firebase Storage and save metadata to Firestore
   */
  async uploadMemoDocument(
    file: File | Blob | any,
    metadata: {
      title: string;
      description?: string;
      uploadedBy: string;
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
    },
    options?: MemoUploadOptions
  ): Promise<MemoDocument> {
    try {
      // Check if user is authenticated
      const { auth } = await import('./config');
      
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to upload documents');
      }
      
      // Validate file before upload
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileName = file.name || (file as any).name || 'document';
      const fileExtension = this.getFileExtension(file);
      const safeFileName = generateUniqueId() + fileExtension;
      const storagePath = `memos/${safeFileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file to Firebase Storage
      if (options?.onProgress) {
        options.onProgress({ progress: 0, status: 'uploading' });
      }

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (options?.onProgress) {
              options.onProgress({ progress, status: 'uploading' });
            }
          },
          (error) => {
            if (options?.onProgress) {
              options.onProgress({ 
                progress: 0, 
                status: 'error', 
                error: error.message 
              });
            }
            reject(error);
          },
          async () => {
            try {
              // Get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // Create document metadata
              const mimeType = file.type || 'application/octet-stream';
              
              // Prepare data for Firestore (removing undefined values)
              const firestoreData: any = {
                title: metadata.title,
                fileName: fileName,
                fileSize: file.size || (file as any).size || 0,
                fileType: file.type || 'application/octet-stream',
                mimeType: mimeType,
                downloadUrl: downloadUrl,
                storagePath: storagePath,
                uploadedBy: metadata.uploadedBy,
                
                // Memo-specific fields
                issuingAgency: metadata.issuingAgency,
                agencyLevel: metadata.agencyLevel,
                effectiveDate: metadata.effectiveDate,
                priority: metadata.priority,
                distributionList: metadata.distributionList || [],
                acknowledgmentRequired: metadata.acknowledgmentRequired || false,
                acknowledgments: [],
                relatedOperations: [],
                tags: metadata.tags || [],
                isPublic: metadata.isPublic !== undefined ? metadata.isPublic : true,
              };

              // Only add optional fields if they have values
              if (metadata.description) {
                firestoreData.description = metadata.description;
              }

              // Only add memoNumber if it exists (Firestore doesn't support undefined)
              if (metadata.memoNumber) {
                firestoreData.memoNumber = metadata.memoNumber;
              }

              // Only add expirationDate if it exists (Firestore doesn't support undefined)
              if (metadata.expirationDate !== undefined) {
                firestoreData.expirationDate = metadata.expirationDate;
              }

              // Remove any undefined values from firestoreData
              Object.keys(firestoreData).forEach(key => {
                if (firestoreData[key] === undefined) {
                  delete firestoreData[key];
                }
              });

              const memoDocument: Omit<MemoDocument, 'id'> = firestoreData as Omit<MemoDocument, 'id'>;

              // Save metadata to Firestore
              const docRef = await addDoc(
                collection(db, this.collectionName),
                {
                  ...firestoreData,
                  uploadedAt: new Date(),
                  lastModified: new Date(),
                }
              );

              const createdDoc: MemoDocument = {
                ...memoDocument,
                id: docRef.id,
              };

              if (options?.onProgress) {
                options.onProgress({ progress: 100, status: 'completed' });
              }
              if (options?.onSuccess) {
                options.onSuccess(createdDoc);
              }

              resolve(createdDoc);
            } catch (error) {
              if (options?.onProgress) {
                options.onProgress({ 
                  progress: 0, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }
              
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a memo document by ID
   */
  async getMemoDocument(id: string): Promise<MemoDocument | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.documentSnapshotToMemoDocument(docSnap);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert Firestore document snapshot to MemoDocument
   */
  private documentSnapshotToMemoDocument(docSnap: DocumentSnapshot): MemoDocument {
    const data = docSnap.data();
    if (!data) {
      throw new Error('Document has no data');
    }

    // Helper function to safely convert dates
    const safeDateConvert = (dateField: any): Date => {
      if (!dateField) return new Date();
      try {
        return this.timestampToDate(dateField);
      } catch (e) {
        return new Date();
      }
    };

    return {
      id: docSnap.id,
      title: data.title || '',
      description: data.description,
      fileName: data.fileName || '',
      fileSize: data.fileSize || 0,
      fileType: data.fileType || '',
      mimeType: data.mimeType || '',
      downloadUrl: data.downloadUrl || '',
      storagePath: data.storagePath || '',
      uploadedBy: data.uploadedBy || '',
      uploadedAt: safeDateConvert(data.uploadedAt),
      lastModified: safeDateConvert(data.lastModified),
      
      memoNumber: data.memoNumber,
      issuingAgency: data.issuingAgency || '',
      agencyLevel: data.agencyLevel || 'national',
      documentType: data.documentType,
      effectiveDate: safeDateConvert(data.effectiveDate),
      expirationDate: data.expirationDate ? safeDateConvert(data.expirationDate) : undefined,
      priority: data.priority || 'normal',
      distributionList: data.distributionList || [],
      acknowledgmentRequired: data.acknowledgmentRequired || false,
      acknowledgments: (data.acknowledgments || []).map((ack: any) => ({
        userId: ack.userId,
        userName: ack.userName,
        acknowledgedAt: safeDateConvert(ack.acknowledgedAt),
        comments: ack.comments,
      })),
      relatedOperations: data.relatedOperations || [],
      supersedes: data.supersedes,
      supersededBy: data.supersededBy,
      tags: data.tags || [],
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
    };
  }

  /**
   * Get all memo documents with optional filtering and pagination
   */
  async getMemoDocuments(
    filters?: MemoFilter,
    limitCount?: number,
    lastDoc?: DocumentSnapshot
  ): Promise<{ documents: MemoDocument[]; lastDoc?: DocumentSnapshot }> {
    try {
      // Check if user is authenticated
      const { auth } = await import('./config');
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to access documents');
      }

      const constraints: QueryConstraint[] = [];

      // Apply filters first if they exist
      if (filters) {
        if (filters.agencyLevel) {
          constraints.push(where('agencyLevel', '==', filters.agencyLevel));
        }
        if (filters.issuingAgency) {
          constraints.push(where('issuingAgency', '==', filters.issuingAgency));
        }
        if (filters.priority) {
          constraints.push(where('priority', '==', filters.priority));
        }
        if (filters.uploadedBy) {
          constraints.push(where('uploadedBy', '==', filters.uploadedBy));
        }
      }

      // Note: Removed orderBy temporarily to avoid index requirements
      // We'll sort in memory instead
      // if (!filters || Object.keys(filters).length === 0) {
      //   constraints.push(orderBy('uploadedAt', 'desc'));
      // }

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      let documents = [];
      for (const doc of querySnapshot.docs) {
        try {
          const converted = this.documentSnapshotToMemoDocument(doc);
          documents.push(converted);
        } catch (error) {
          // Log conversion errors for debugging, but don't throw to prevent blocking other documents
          console.error(`Error converting document ${doc.id}:`, error);
          if (process.env.NODE_ENV === 'production') {
            console.error('Document conversion error details:', {
              docId: doc.id,
              docData: doc.data(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Sort in memory by uploadedAt (most recent first)
      documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      const lastDocument = querySnapshot.docs.length > 0 
        ? querySnapshot.docs[querySnapshot.docs.length - 1] 
        : undefined;

      // Log query results for debugging in production
      if (process.env.NODE_ENV === 'production' && querySnapshot.docs.length === 0 && documents.length === 0) {
        console.warn('No documents found in query:', {
          collection: this.collectionName,
          filters,
          limitCount,
          hasLastDoc: !!lastDoc
        });
      }

      return {
        documents,
        lastDoc: lastDocument
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a memo document (metadata only, not the file)
   */
  async updateMemoDocument(id: string, updates: Partial<MemoDocument>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        lastModified: new Date(),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add acknowledgment to a memo document
   */
  async acknowledgeMemoDocument(
    memoId: string,
    userId: string,
    userName: string,
    comments?: string
  ): Promise<void> {
    try {
      const memo = await this.getMemoDocument(memoId);
      if (!memo) {
        throw new Error('Memo document not found');
      }

      // Check if already acknowledged
      const existingAck = memo.acknowledgments.find(ack => ack.userId === userId);
      if (existingAck) {
        // Update existing acknowledgment
        const updatedAcks = memo.acknowledgments.map(ack =>
          ack.userId === userId
            ? { ...ack, comments, acknowledgedAt: new Date() }
            : ack
        );
        await this.updateMemoDocument(memoId, { acknowledgments: updatedAcks });
      } else {
        // Add new acknowledgment
        const newAck = {
          userId,
          userName,
          acknowledgedAt: new Date(),
          comments,
        };
        await this.updateMemoDocument(memoId, {
          acknowledgments: [...memo.acknowledgments, newAck],
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a memo document and its file
   */
  async deleteMemoDocument(id: string): Promise<void> {
    try {
      const memo = await this.getMemoDocument(id);
      if (!memo) {
        throw new Error('Document not found');
      }

      // Delete file from Storage
      const storageRef = ref(storage, memo.storagePath);
      await deleteObject(storageRef);

      // Delete document from Firestore
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }
}

