import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SitRepDocument } from '@/types/Document';

import { styles } from './UploadDocumentModal.styles';

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: () => void;
  onFileSelect: () => void;
  onFileChange: (event: any) => void;
  selectedFile: File | null;
  uploadTitle: string;
  onTitleChange: (title: string) => void;
  uploadDescription: string;
  onDescriptionChange: (description: string) => void;
  uploadCategory: SitRepDocument['category'];
  onCategoryChange: (category: SitRepDocument['category']) => void;
  uploadProgress: any;
  isUploading: boolean;
  error: string | null;
  onClearError: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function UploadDocumentModal({
  visible,
  onClose,
  onUpload,
  onFileSelect,
  onFileChange,
  selectedFile,
  uploadTitle,
  onTitleChange,
  uploadDescription,
  onDescriptionChange,
  uploadCategory,
  onCategoryChange,
  uploadProgress,
  isUploading,
  error,
  onClearError,
  fileInputRef
}: UploadDocumentModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();

  const categories: SitRepDocument['category'][] = ['report', 'image', 'spreadsheet', 'presentation', 'other'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: colors.surface,
            marginBottom: bottomNavHeight
          }
        ]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalTitle}>Upload Document</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

        <ScrollView 
          style={styles.modalContent} 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* File Selection */}
          <TouchableOpacity 
            style={[styles.fileSelectButton, { borderColor: colors.primary }]} 
            onPress={onFileSelect}
          >
            <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
            <ThemedText style={[styles.fileSelectText, { color: colors.primary }]}>
              {selectedFile ? selectedFile.name : 'Select File'}
            </ThemedText>
            <ThemedText style={[styles.fileSelectSubtext, { color: colors.text + '80' }]}>
              Tap to choose a document
            </ThemedText>
          </TouchableOpacity>
          
          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={onFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            />
          )}

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Document Title</ThemedText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter document title"
              placeholderTextColor={colors.text + '60'}
              value={uploadTitle}
              onChangeText={onTitleChange}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Description (Optional)</ThemedText>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="Enter document description"
              placeholderTextColor={colors.text + '60'}
              value={uploadDescription}
              onChangeText={onDescriptionChange}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Category</ThemedText>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    { 
                      backgroundColor: (uploadCategory ?? 'other') === category ? colors.primary : colors.background,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => onCategoryChange(category)}
                >
                  <ThemedText style={[
                    styles.categoryButtonText,
                    { color: (uploadCategory ?? 'other') === category ? '#fff' : colors.text }
                  ]}>
                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : ''}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Bar */}
          {uploadProgress && (
            <View style={styles.progressContainer}>
              <ThemedText style={styles.progressText}>
                Uploading... {Math.round(uploadProgress.progress)}%
              </ThemedText>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${uploadProgress.progress}%`,
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {error}
              </ThemedText>
              <TouchableOpacity onPress={onClearError}>
                <Ionicons name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.uploadButton, 
              { 
                backgroundColor: isUploading ? colors.border : colors.primary,
                opacity: isUploading ? 0.6 : 1
              }
            ]}
            onPress={onUpload}
            disabled={isUploading || !selectedFile || !uploadTitle}
          >
            <ThemedText style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </ThemedText>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
