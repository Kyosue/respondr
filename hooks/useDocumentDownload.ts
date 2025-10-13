import { DocumentService } from '@/firebase/documents';
import { DocumentFilter, SitRepDocument } from '@/types/Document';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

interface UseDocumentDownloadReturn {
  documents: SitRepDocument[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadDocuments: (filters?: DocumentFilter, refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  searchDocuments: (query: string, filters?: Omit<DocumentFilter, 'searchQuery'>) => Promise<void>;
  getDocumentById: (id: string) => Promise<SitRepDocument | null>;
  downloadDocument: (doc: SitRepDocument) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocument: (
    id: string, 
    updates: Partial<Pick<SitRepDocument, 'title' | 'description' | 'tags' | 'category' | 'isPublic'>>
  ) => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useDocumentDownload = (): UseDocumentDownloadReturn => {
  const [documents, setDocuments] = useState<SitRepDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<DocumentFilter | undefined>();

  const documentService = DocumentService.getInstance();

  const loadDocuments = useCallback(async (filters?: DocumentFilter, refresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const { documents: newDocuments, lastDoc: newLastDoc } = await documentService.getDocuments(
        filters,
        20,
        refresh ? undefined : lastDoc
      );

      if (refresh) {
        setDocuments(newDocuments);
        setLastDoc(newLastDoc);
      } else {
        setDocuments(prev => [...prev, ...newDocuments]);
        setLastDoc(newLastDoc);
      }

      setHasMore(newDocuments.length === 20);
      setCurrentFilters(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [documentService, lastDoc]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await loadDocuments(currentFilters, false);
    }
  }, [isLoading, hasMore, loadDocuments, currentFilters]);

  const searchDocuments = useCallback(async (query: string, filters?: Omit<DocumentFilter, 'searchQuery'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { documents: searchResults } = await documentService.searchDocuments(query, filters);
      setDocuments(searchResults);
      setHasMore(false); // Search results don't support pagination in this implementation
      setCurrentFilters({ ...filters, searchQuery: query });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [documentService]);

  const getDocumentById = useCallback(async (id: string): Promise<SitRepDocument | null> => {
    try {
      return await documentService.getDocumentById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document';
      setError(errorMessage);
      return null;
    }
  }, [documentService]);

  const downloadDocument = useCallback(async (doc: SitRepDocument) => {
    try {
       console.log('Starting download for document:', doc.title);
       console.log('Download URL:', doc.downloadUrl);
       console.log('Platform:', Platform.OS);

       // Check if download URL exists
       if (!doc.downloadUrl) {
         throw new Error('Download URL not available for this document');
       }

       // Test if the URL is accessible
       try {
         const testResponse = await fetch(doc.downloadUrl, { method: 'HEAD' });
         if (!testResponse.ok) {
           console.log('Download URL not accessible, attempting to refresh...');
           // Try to refresh the download URL
           const refreshedUrl = await documentService.refreshDownloadUrl(doc.id);
           doc.downloadUrl = refreshedUrl;
           console.log('Download URL refreshed successfully');
         } else {
           console.log('Download URL is accessible');
         }
       } catch (urlError) {
         console.error('URL accessibility test failed:', urlError);
         // Try to refresh the download URL as a fallback
         try {
           console.log('Attempting to refresh download URL...');
           const refreshedUrl = await documentService.refreshDownloadUrl(doc.id);
           doc.downloadUrl = refreshedUrl;
           console.log('Download URL refreshed successfully');
         } catch (refreshError) {
           console.error('Failed to refresh download URL:', refreshError);
           throw new Error(`Download URL is not accessible: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
         }
       }

      if (Platform.OS === 'web') {
        // For web, fetch the file and create a blob download
        if (typeof window !== 'undefined') {
          console.log('Creating download for web');
          
          try {
             // Fetch the file with proper headers
             const response = await fetch(doc.downloadUrl, {
               method: 'GET',
               headers: {
                 'Accept': '*/*',
               },
             });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            console.log('File fetched successfully, size:', blob.size);
            console.log('Blob type:', blob.type);
            
            // Ensure we have a valid blob
            if (blob.size === 0) {
              throw new Error('Downloaded file is empty');
            }
            
             // Check if browser supports download attribute
             const supportsDownload = 'download' in window.document.createElement('a');
             console.log('Browser supports download attribute:', supportsDownload);
             
             // Create download link with proper attributes
             const url = window.URL.createObjectURL(blob);
             const link = window.document.createElement('a');
            link.href = url;
            link.download = doc.fileName;
            link.style.display = 'none';
            
            // Add additional attributes for better browser support
            link.setAttribute('download', doc.fileName);
            link.setAttribute('target', '_blank');
            
             // Add to DOM and trigger
             window.document.body.appendChild(link);
            
            // Use a more reliable click method
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            link.dispatchEvent(clickEvent);
            
             // Clean up after a delay
             setTimeout(() => {
               if (window.document.body.contains(link)) {
                 window.document.body.removeChild(link);
               }
               window.URL.revokeObjectURL(url);
             }, 1000);
            
            console.log('Download initiated successfully');
            Alert.alert(
              'Download Started!', 
              'The file should automatically download to your Downloads folder. If it doesn\'t appear, check your browser\'s download settings or try the download again.',
              [{ text: 'OK', style: 'default' }]
            );
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            
            // Enhanced fallback with better error handling
            try {
              console.log('Trying enhanced fallback method');
              
               // Create a new window/tab for download
               const newWindow = window.open(doc.downloadUrl, '_blank');
               
               if (newWindow) {
                 // Try to trigger download after a short delay
                 setTimeout(() => {
                   const link = window.document.createElement('a');
                   link.href = doc.downloadUrl;
                   link.download = doc.fileName;
                   link.target = '_blank';
                   link.style.display = 'none';
                   window.document.body.appendChild(link);
                   link.click();
                   window.document.body.removeChild(link);
                 }, 1000);
                
                console.log('Fallback download initiated');
                Alert.alert(
                  'Download Started!', 
                  'The file should automatically download to your Downloads folder. If it doesn\'t appear, check your browser\'s download settings.',
                  [{ text: 'OK', style: 'default' }]
                );
              } else {
                throw new Error('Popup blocked');
              }
            } catch (fallbackError) {
              console.error('Fallback error:', fallbackError);
              
               // Final fallback - try direct download with iframe
               try {
                 console.log('Trying iframe download method');
                 const iframe = window.document.createElement('iframe');
                 iframe.style.display = 'none';
                 iframe.src = doc.downloadUrl;
                 window.document.body.appendChild(iframe);
                 
                 setTimeout(() => {
                   window.document.body.removeChild(iframe);
                 }, 5000);
                
                Alert.alert(
                  'Download Started!', 
                  'The file should automatically download to your Downloads folder.',
                  [{ text: 'OK', style: 'default' }]
                );
              } catch (iframeError) {
                console.error('Iframe error:', iframeError);
                
                 // Ultimate fallback - just open the URL
                 window.open(doc.downloadUrl, '_blank');
                Alert.alert(
                  'Download Started', 
                  'The file should download automatically. If not, right-click the link and select "Save link as..."'
                );
              }
            }
          }
        }
      } else {
        // For mobile, try sharing first, then fallback to web download
        console.log('Starting mobile download process');
        
         // First try to open the download URL directly in browser
         try {
           console.log('Attempting to open download URL in browser');
           const canOpen = await Linking.canOpenURL(doc.downloadUrl);
           if (canOpen) {
             await Linking.openURL(doc.downloadUrl);
             Alert.alert('Success', 'File opened in browser. You can download it from there.');
             return;
           }
         } catch (linkingError) {
           console.log('Linking failed, trying file download:', linkingError);
         }
        
        const isSharingAvailable = await Sharing.isAvailableAsync();
        console.log('Sharing available:', isSharingAvailable);
        
        if (!isSharingAvailable) {
          console.log('Sharing not available');
          Alert.alert('Error', 'Sharing is not available on this device');
          return;
        }

         // Create a temporary file path with safe filename
         const safeFileName = doc.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
         // Use document directory for better compatibility
         const fileUri = FileSystem.documentDirectory + safeFileName;
         
         console.log('Downloading to:', fileUri);
         console.log('From URL:', doc.downloadUrl);
         
         // Download the file using the new API
         const downloadResult = await FileSystem.downloadAsync(doc.downloadUrl, fileUri);
        
        console.log('Download result:', downloadResult);
        
        // Verify the file was actually downloaded
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        console.log('Downloaded file info:', fileInfo);
        
        if (downloadResult.status === 200 && fileInfo.exists && fileInfo.size > 0) {
          console.log('Download successful, starting share');
          
          // Try to copy to a more accessible location if possible
          let finalUri = downloadResult.uri;
          try {
            // Check if we can access the Downloads directory
            const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
            const downloadsExists = await FileSystem.getInfoAsync(downloadsDir);
            
            if (!downloadsExists.exists) {
              await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
            }
            
            const accessibleUri = downloadsDir + safeFileName;
            await FileSystem.copyAsync({
              from: downloadResult.uri,
              to: accessibleUri
            });
            
            finalUri = accessibleUri;
            console.log('File copied to accessible location:', accessibleUri);
          } catch (copyError) {
            console.log('Could not copy to accessible location, using original:', copyError);
            // Continue with original URI
          }
          
           // Share the downloaded file with better options
           console.log('Attempting to share file:', finalUri);
           console.log('MIME type:', doc.fileType);
           console.log('File exists:', await FileSystem.getInfoAsync(finalUri));
           
           try {
             await Sharing.shareAsync(finalUri, {
               mimeType: doc.fileType,
               dialogTitle: `Save ${doc.title}`,
               UTI: doc.fileType, // Universal Type Identifier for better file handling
             });
            console.log('Share dialog opened successfully');
          } catch (shareError) {
            console.error('Share error:', shareError);
            // Try without UTI
             try {
               await Sharing.shareAsync(finalUri, {
                 mimeType: doc.fileType,
                 dialogTitle: `Save ${doc.title}`,
               });
              console.log('Share dialog opened (without UTI)');
            } catch (shareError2) {
              console.error('Share error (without UTI):', shareError2);
              // Try with minimal options
              try {
                await Sharing.shareAsync(finalUri);
                console.log('Share dialog opened (minimal options)');
              } catch (shareError3) {
                console.error('All share methods failed:', shareError3);
                 // Fallback: Show the download URL for manual download
                 Alert.alert(
                   'Download Complete',
                   `File downloaded but sharing failed. You can manually download the file from this URL:\n\n${doc.downloadUrl}`,
                   [
                     { text: 'Copy URL', onPress: () => {
                       // Copy to clipboard if available
                       if (navigator && navigator.clipboard) {
                         navigator.clipboard.writeText(doc.downloadUrl);
                         Alert.alert('URL Copied', 'Download URL copied to clipboard');
                       }
                     }},
                    { text: 'OK', style: 'default' }
                  ]
                );
                return;
              }
            }
          }
          Alert.alert(
            'File Downloaded Successfully!', 
            'The file has been downloaded. In the share dialog that opened, you can:\n\n• Tap "Save to Files" to save to your device\n• Choose a specific app to open the file\n• Share with other apps\n\nLook for "Save to Files" or "Files" option in the share menu.',
            [{ text: 'Got it!', style: 'default' }]
          );
        } else {
          console.error('Download failed or file is empty');
          console.error('Status:', downloadResult.status);
          console.error('File exists:', fileInfo.exists);
          console.error('File size:', fileInfo.size);
          throw new Error(`Download failed with status: ${downloadResult.status} or file is empty`);
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      Alert.alert('Download Failed', errorMessage);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
    }
  }, [documentService]);

  const updateDocument = useCallback(async (
    id: string,
    updates: Partial<Pick<SitRepDocument, 'title' | 'description' | 'tags' | 'category' | 'isPublic'>>
  ) => {
    try {
      await documentService.updateDocument(id, updates);
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id 
            ? { ...doc, ...updates, lastModified: new Date() }
            : doc
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
    }
  }, [documentService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLastDoc(null);
    setHasMore(true);
    await loadDocuments(currentFilters, true);
  }, [loadDocuments, currentFilters]);

  return {
    documents,
    isLoading,
    error,
    hasMore,
    loadDocuments,
    loadMore,
    searchDocuments,
    getDocumentById,
    downloadDocument,
    deleteDocument,
    updateDocument,
    clearError,
    refresh
  };
};
