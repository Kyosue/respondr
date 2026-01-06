import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ImageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onLibraryPress: () => void;
  maxImages?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function ImageSelectionModal({ 
  visible, 
  onClose, 
  onCameraPress, 
  onLibraryPress,
  maxImages = 1 
}: ImageSelectionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);

  const handleCameraPress = async () => {
    try {
      setLoading(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      onClose();
      onCameraPress();
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Failed to access camera');
    } finally {
      setLoading(false);
    }
  };

  const handleLibraryPress = async () => {
    try {
      setLoading(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Photo library permission is required to select images');
        return;
      }

      onClose();
      onLibraryPress();
    } catch (error) {
      console.error('Library permission error:', error);
      Alert.alert('Error', 'Failed to access photo library');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...Platform.select({
        web: {
          // @ts-ignore - web-specific prop
          presentationStyle: 'overFullScreen',
        },
      })}
    >
      <View 
        style={styles.overlay}
        {...Platform.select({
          web: {
            // @ts-ignore - web-specific style
            onClick: (e: any) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            },
          },
        })}
      >
        <ThemedView 
          style={[styles.modal, { backgroundColor: colors.background }]}
          {...Platform.select({
            web: {
              // @ts-ignore - web-specific style
              onClick: (e: any) => {
                e.stopPropagation();
              },
            },
          })}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.title}>Select Image</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ThemedText style={[styles.description, { color: colors.text + '80' }]}>
              Choose how you want to add {maxImages > 1 ? 'images' : 'an image'}
            </ThemedText>

            {/* Camera Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={handleCameraPress}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>Take Photo</ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '70' }]}>
                  Use your camera to take a new photo
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
            </TouchableOpacity>

            {/* Library Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={handleLibraryPress}
              disabled={loading}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="images" size={28} color={colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <ThemedText style={styles.optionTitle}>
                  Choose from Library
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: colors.text + '70' }]}>
                  Select from your photo library
                  {maxImages > 1 && ` (up to ${maxImages} images)`}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
            </TouchableOpacity>

            {/* Additional Info */}
            <View style={[styles.infoContainer, { backgroundColor: colors.background + '50' }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <ThemedText style={[styles.infoText, { color: colors.text + '70' }]}>
                {maxImages > 1 
                  ? `You can select up to ${maxImages} images at once`
                  : 'Only one image will be selected'
                }
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
      } as any,
      default: {
        zIndex: 10000,
      },
    }),
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        zIndex: 1000000,
        position: 'relative' as any,
        margin: 'auto',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
      } as any,
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});


