import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useMemo } from '@/contexts/MemoContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import DateTimePicker from '@react-native-community/datetimepicker';

import { styles } from './MemoUploadModal.styles';

interface MemoUploadModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MemoUploadModal({ visible, onClose }: MemoUploadModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { uploadDocument, currentUploadProgress } = useMemo();
  
  // Hybrid RAMP hook - handles animations and platform detection
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memoNumber, setMemoNumber] = useState('');
  const [issuingAgency, setIssuingAgency] = useState('');
  const [agencyLevel, setAgencyLevel] = useState<'national' | 'regional' | 'provincial' | 'municipal' | 'barangay'>('national');
  const [documentType, setDocumentType] = useState<'memorandum' | 'circular' | 'advisory' | 'directive' | 'executive-order' | 'ordinance' | 'policy'>('memorandum');
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showEffectiveDatePicker, setShowEffectiveDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [priority, setPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');
  const [acknowledgmentRequired, setAcknowledgmentRequired] = useState(false);
  const [tags, setTags] = useState('');

  const agencyLevels = [
    { value: 'national', label: 'National' },
    { value: 'regional', label: 'Regional' },
    { value: 'provincial', label: 'Provincial' },
    { value: 'municipal', label: 'Municipal' },
    { value: 'barangay', label: 'Barangay' },
  ];

  const documentTypes = [
    { value: 'memorandum', label: 'Memorandum' },
    { value: 'circular', label: 'Circular' },
    { value: 'advisory', label: 'Advisory' },
    { value: 'directive', label: 'Directive' },
    { value: 'executive-order', label: 'Executive Order' },
    { value: 'ordinance', label: 'Ordinance' },
    { value: 'policy', label: 'Policy' },
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: '#FF3B30' },
    { value: 'high', label: 'High', color: '#FF9500' },
    { value: 'normal', label: 'Normal', color: '#34C759' },
    { value: 'low', label: 'Low', color: '#8E8E93' },
  ];

  const handleFileSelect = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z';
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (file) {
            setSelectedFile(file);
            if (!title) {
              const base = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
              setTitle(base);
            }
          }
        };
        input.click();
      } else {
        // Mobile: Use DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          
          // Create a file-like object for mobile
          const file = {
            name: asset.name || 'document',
            size: asset.size || 0,
            type: asset.mimeType || 'application/octet-stream',
            uri: asset.uri,
          };
          
          setSelectedFile(file as any);
          if (!title) {
            const name = asset.name || 'document';
            const base = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
            setTitle(base);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file to upload');
      return;
    }

    if (!title || !memoNumber || !issuingAgency) {
      Alert.alert('Incomplete Information', 'Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);

      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const metadata = {
        title,
        description,
        memoNumber,
        issuingAgency,
        agencyLevel,
        documentType,
        effectiveDate: effectiveDate,
        expirationDate: expirationDate || undefined,
        priority,
        distributionList: [], // Will be implemented in Phase 4
        acknowledgmentRequired,
        tags: tagsArray,
        isPublic: true,
      };

      await uploadDocument(selectedFile, metadata);

      Alert.alert('Success', 'Document uploaded successfully');
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setMemoNumber('');
    setIssuingAgency('');
    setAgencyLevel('national');
    setDocumentType('memorandum');
    setEffectiveDate(new Date());
    setExpirationDate(null);
    setPriority('normal');
    setAcknowledgmentRequired(false);
    setTags('');
    setShowEffectiveDatePicker(false);
    setShowExpirationDatePicker(false);
    rampHandleClose();
  };

  const renderField = (
    label: string,
    required: boolean,
    component: React.ReactNode
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      {component}
    </View>
  );

  const renderSelectField = <T extends string>(
    value: T,
    options: { value: string; label: string; color?: string }[],
    onChange: (value: T) => void
  ) => (
    <View style={styles.selectContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.selectOption,
            {
              backgroundColor: value === option.value ? colors.tint : 'transparent',
              borderColor: colors.border,
            },
          ]}
          onPress={() => onChange(option.value as T)}
        >
          <Text
            style={[
              styles.selectOptionText,
              { color: value === option.value ? '#fff' : colors.text },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Return null if not visible
  if (!visible) return null;

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web with animations
    return (
      <Modal
        visible={visible}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[isWeb ? styles.overlayWeb : styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            isWeb ? styles.modalContainerWeb : styles.modalContainer,
            { 
              backgroundColor: colors.background,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="document" size={24} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Upload Memo Document
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
                  Add a new document to the library
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={uploading}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* File Selection */}
            <View style={styles.fileSection}>
              <TouchableOpacity
                style={[
                  styles.fileButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={handleFileSelect}
                disabled={uploading}
              >
                {selectedFile ? (
                  <View style={styles.fileInfo}>
                    <Ionicons name="document-text" size={32} color={colors.tint} />
                    <Text style={[styles.fileName, { color: colors.text }]}>
                      {selectedFile.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.tabIconDefault }]}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                ) : (
                  <View style={styles.filePlaceholder}>
                    <Ionicons name="cloud-upload" size={48} color={colors.tabIconDefault} />
                    <Text style={[styles.filePlaceholderText, { color: colors.text }]}>
                      Select File
                    </Text>
                    <Text style={[styles.filePlaceholderSubtext, { color: colors.tabIconDefault }]}>
                      PDF, DOC, DOCX, or Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Progress Bar */}
              {uploading && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${currentUploadProgress}%`, backgroundColor: colors.tint },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    {Math.round(currentUploadProgress)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Document Info */}
            {renderField(
              'Title',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter document title"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField(
              'Memo Number',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={memoNumber}
                onChangeText={setMemoNumber}
                placeholder="e.g., OM-2024-001"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField(
              'Issuing Agency',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={issuingAgency}
                onChangeText={setIssuingAgency}
                placeholder="e.g., DILG Central Office"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField('Agency Level', true, renderSelectField(agencyLevel, agencyLevels, setAgencyLevel))}

            {renderField('Document Type', true, renderSelectField(documentType, documentTypes, setDocumentType))}

            {renderField(
              'Effective Date',
              true,
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={effectiveDate.toISOString().split('T')[0]}
                  onChange={(e) => setEffectiveDate(new Date(e.target.value))}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowEffectiveDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.text} />
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {effectiveDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showEffectiveDatePicker && (
                    <DateTimePicker
                      value={effectiveDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowEffectiveDatePicker(false);
                        if (selectedDate) setEffectiveDate(selectedDate);
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )
            )}

            {renderField(
              'Expiration Date (Optional)',
              false,
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={expirationDate ? expirationDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setExpirationDate(e.target.value ? new Date(e.target.value) : null)}
                  min={effectiveDate.toISOString().split('T')[0]}
                  style={{
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <>
                  <View style={styles.dateInputContainer}>
                    <TouchableOpacity
                      style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setShowExpirationDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.text} />
                      <Text style={[styles.dateText, { color: expirationDate ? colors.text : colors.tabIconDefault }]}>
                        {expirationDate ? expirationDate.toLocaleDateString() : 'Select date (optional)'}
                      </Text>
                    </TouchableOpacity>
                    {expirationDate && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setExpirationDate(null)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {showExpirationDatePicker && (
                    <DateTimePicker
                      value={expirationDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowExpirationDatePicker(false);
                        if (selectedDate) setExpirationDate(selectedDate);
                      }}
                      minimumDate={effectiveDate}
                    />
                  )}
                </>
              )
            )}

            {renderField('Priority', true, renderSelectField(priority, priorities, setPriority))}

            {renderField(
              'Description (Optional)',
              false,
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={4}
              />
            )}

            {renderField(
              'Tags (Comma-separated)',
              false,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={tags}
                onChangeText={setTags}
                placeholder="e.g., disaster, preparedness, guidelines"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {/* Acknowledgment Required */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: colors.border }]}
                onPress={() => setAcknowledgmentRequired(!acknowledgmentRequired)}
              >
                {acknowledgmentRequired && (
                  <Ionicons name="checkmark" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Acknowledgment Required
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={handleClose}
              disabled={uploading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: colors.tint },
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile bottom sheet rendering (no complex animations needed)
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="document" size={24} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Upload Memo Document
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
                  Add a new document to the library
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={uploading}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* File Selection */}
            <View style={styles.fileSection}>
              <TouchableOpacity
                style={[
                  styles.fileButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={handleFileSelect}
                disabled={uploading}
              >
                {selectedFile ? (
                  <View style={styles.fileInfo}>
                    <Ionicons name="document-text" size={32} color={colors.tint} />
                    <Text style={[styles.fileName, { color: colors.text }]}>
                      {selectedFile.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.tabIconDefault }]}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </View>
                ) : (
                  <View style={styles.filePlaceholder}>
                    <Ionicons name="cloud-upload" size={48} color={colors.tabIconDefault} />
                    <Text style={[styles.filePlaceholderText, { color: colors.text }]}>
                      Select File
                    </Text>
                    <Text style={[styles.filePlaceholderSubtext, { color: colors.tabIconDefault }]}>
                      PDF, DOC, DOCX, or Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Progress Bar */}
              {uploading && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${currentUploadProgress}%`, backgroundColor: colors.tint },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    {Math.round(currentUploadProgress)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Document Info */}
            {renderField(
              'Title',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter document title"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField(
              'Memo Number',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={memoNumber}
                onChangeText={setMemoNumber}
                placeholder="e.g., OM-2024-001"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField(
              'Issuing Agency',
              true,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={issuingAgency}
                onChangeText={setIssuingAgency}
                placeholder="e.g., DILG Central Office"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {renderField('Agency Level', true, renderSelectField(agencyLevel, agencyLevels, setAgencyLevel))}

            {renderField('Document Type', true, renderSelectField(documentType, documentTypes, setDocumentType))}

            {renderField(
              'Effective Date',
              true,
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={effectiveDate.toISOString().split('T')[0]}
                  onChange={(e) => setEffectiveDate(new Date(e.target.value))}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowEffectiveDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.text} />
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {effectiveDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showEffectiveDatePicker && (
                    <DateTimePicker
                      value={effectiveDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowEffectiveDatePicker(false);
                        if (selectedDate) setEffectiveDate(selectedDate);
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )
            )}

            {renderField(
              'Expiration Date (Optional)',
              false,
              Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={expirationDate ? expirationDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setExpirationDate(e.target.value ? new Date(e.target.value) : null)}
                  min={effectiveDate.toISOString().split('T')[0]}
                  style={{
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 10,
                    padding: '12px',
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <>
                  <View style={styles.dateInputContainer}>
                    <TouchableOpacity
                      style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setShowExpirationDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.text} />
                      <Text style={[styles.dateText, { color: expirationDate ? colors.text : colors.tabIconDefault }]}>
                        {expirationDate ? expirationDate.toLocaleDateString() : 'Select date (optional)'}
                      </Text>
                    </TouchableOpacity>
                    {expirationDate && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setExpirationDate(null)}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {showExpirationDatePicker && (
                    <DateTimePicker
                      value={expirationDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowExpirationDatePicker(false);
                        if (selectedDate) setExpirationDate(selectedDate);
                      }}
                      minimumDate={effectiveDate}
                    />
                  )}
                </>
              )
            )}

            {renderField('Priority', true, renderSelectField(priority, priorities, setPriority))}

            {renderField(
              'Description (Optional)',
              false,
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={4}
              />
            )}

            {renderField(
              'Tags (Comma-separated)',
              false,
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                value={tags}
                onChangeText={setTags}
                placeholder="e.g., disaster, preparedness, guidelines"
                placeholderTextColor={colors.tabIconDefault}
              />
            )}

            {/* Acknowledgment Required */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: colors.border }]}
                onPress={() => setAcknowledgmentRequired(!acknowledgmentRequired)}
              >
                {acknowledgmentRequired && (
                  <Ionicons name="checkmark" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Acknowledgment Required
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={handleClose}
              disabled={uploading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: colors.tint },
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


