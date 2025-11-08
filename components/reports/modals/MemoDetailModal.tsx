import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { MemoDocument } from '@/types/MemoDocument';

import { styles } from './MemoDetailModal.styles';

interface MemoDetailModalProps {
  visible: boolean;
  document: MemoDocument | null;
  onClose: () => void;
  onAssign: () => void;
  onAcknowledge: (documentId: string, comments?: string) => void;
  onDelete?: (document: MemoDocument) => void;
  isAssignedToMe: boolean;
  hasAcknowledged: boolean;
}

export function MemoDetailModal({
  visible,
  document,
  onClose,
  onAssign,
  onAcknowledge,
  onDelete,
  isAssignedToMe,
  hasAcknowledged,
}: MemoDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  // Check if user can assign documents (supervisor or admin only)
  const canAssignDocuments = user?.userType === 'supervisor' || user?.userType === 'admin';

  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

  const [showAcknowledge, setShowAcknowledge] = useState(false);
  const [acknowledgeComments, setAcknowledgeComments] = useState('');
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    if (!visible) {
      setShowAcknowledge(false);
      setAcknowledgeComments('');
    }
  }, [visible]);

  const handleAcknowledge = () => {
    if (document) {
      onAcknowledge(document.id, acknowledgeComments);
      setShowAcknowledge(false);
      setAcknowledgeComments('');
    }
  };


  const handleView = async () => {
    if (!document) return;
    
    try {
      setDownloading(true);
      
      if (Platform.OS === 'web') {
        // Web: Open in new tab for viewing/downloading
        if (typeof window !== 'undefined') {
          window.open(document.downloadUrl, '_blank');
        }
      } else {
        // Mobile: Open in external browser
        const canOpen = await Linking.canOpenURL(document.downloadUrl);
        if (canOpen) {
          await Linking.openURL(document.downloadUrl);
        } else {
          Alert.alert('Error', 'Cannot open this document');
        }
      }
    } catch (error) {
      console.error('Open error:', error);
      Alert.alert('Error', 'Failed to open document');
    } finally {
      setDownloading(false);
    }
  };

  if (!visible || !document) return null;

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="document-text" size={24} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {document.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
              {document.issuingAgency}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={rampHandleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Priority Badge */}
        <View style={styles.priorityContainer}>
          <View
            style={[
              styles.priorityBadge,
              {
                backgroundColor:
                  document.priority === 'urgent'
                    ? '#FF3B30'
                    : document.priority === 'high'
                    ? '#FF9500'
                    : document.priority === 'normal'
                    ? '#34C759'
                    : '#8E8E93',
              },
            ]}
          >
            <Ionicons name="flag" size={14} color="#fff" />
            <Text style={styles.priorityText}>{document.priority}</Text>
          </View>
          <Text style={[styles.memoNumber, { color: colors.text }]}>
            Memo #{document.memoNumber}
          </Text>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Agency:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{document.issuingAgency}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Level:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {document.agencyLevel.charAt(0).toUpperCase() + document.agencyLevel.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {document.documentType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Effective Date:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(document.effectiveDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.tabIconDefault} />
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Expiration:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {document.expirationDate 
                ? new Date(document.expirationDate).toLocaleDateString() 
                : 'None'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {document.description || 'No description'}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
          {document.tags && document.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {document.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.tagText, { color: colors.tint }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.description, { color: colors.tabIconDefault }]}>None</Text>
          )}
        </View>

        {/* Acknowledgment Status */}
        {document.acknowledgmentRequired && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Acknowledgment</Text>
            {hasAcknowledged ? (
              <View style={[styles.ackStatus, { backgroundColor: '#34C75910' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={[styles.ackStatusText, { color: '#34C759' }]}>You have acknowledged</Text>
              </View>
            ) : (
              <View style={[styles.ackStatus, { backgroundColor: '#FF950010' }]}>
                <Ionicons name="alert-circle" size={20} color="#FF9500" />
                <Text style={[styles.ackStatusText, { color: '#FF9500' }]}>Acknowledgment Required</Text>
              </View>
            )}

            {document.acknowledgments && document.acknowledgments.length > 0 && (
              <View style={styles.ackList}>
                <Text style={[styles.ackListTitle, { color: colors.text }]}>
                  Acknowledged ({document.acknowledgments.length})
                </Text>
                {document.acknowledgments.map((ack, index) => (
                  <View key={index} style={styles.ackItem}>
                    <View style={[styles.ackAvatar, { backgroundColor: colors.surface }]}>
                      <Ionicons name="person" size={14} color={colors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ackName, { color: colors.text }]}>{ack.userName}</Text>
                      {ack.comments ? (
                        <Text style={[styles.ackComment, { color: colors.text }]}>
                          {ack.comments}
                        </Text>
                      ) : (
                        <Text style={[styles.ackComment, { color: colors.tabIconDefault, fontStyle: 'italic' }]}>
                          No comment
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.ackDate, { color: colors.tabIconDefault }]}>
                      {new Date(ack.acknowledgedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {/* Download Button */}
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.tint }]}
          onPress={handleView}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>View / Download</Text>
            </>
          )}
        </TouchableOpacity>

        {onDelete && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={() => {
              if (document) {
                onDelete(document);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}

        {/* Acknowledge Section */}
        {document.acknowledgmentRequired && !hasAcknowledged && (
          <>
            {!showAcknowledge ? (
              <TouchableOpacity
                style={[styles.acknowledgeButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowAcknowledge(true)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.acknowledgeForm}>
                <TextInput
                  style={[
                    styles.commentInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="Add a comment (optional)"
                  placeholderTextColor={colors.tabIconDefault}
                  value={acknowledgeComments}
                  onChangeText={setAcknowledgeComments}
                  multiline
                  numberOfLines={2}
                />
                <View style={styles.acknowledgeActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowAcknowledge(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.tint }]}
                    onPress={handleAcknowledge}
                  >
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
        <TouchableOpacity style={[styles.closeButtonFooter, { backgroundColor: colors.surface }]} onPress={rampHandleClose}>
          <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Platform-specific modal rendering
  return (
    <>
      {/* Main Document Detail Modal */}
      {isWeb ? (
        <Modal
          visible={visible}
          animationType="fade"
          transparent={true}
          onRequestClose={rampHandleClose}
        >
          <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.overlayCloseButton}
              onPress={rampHandleClose}
              activeOpacity={0.7}
            />
            <Animated.View
              style={[
                styles.containerWeb,
                { backgroundColor: colors.background },
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                },
              ]}
            >
              {renderContent()}
            </Animated.View>
          </Animated.View>
        </Modal>
      ) : (
        <Modal visible={visible} animationType="slide" transparent={true}>
          <View style={styles.overlay}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              {renderContent()}
            </View>
          </View>
        </Modal>
      )}

    </>
  );
}

