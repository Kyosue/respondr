import { ImageSelectionModal } from '@/components/resources/modals/ImageSelectionModal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export interface ImageUploadProps {
  onImageSelected: (imageUrl: string, publicId: string) => void;
  onImageRemoved?: () => void;
  currentImageUrl?: string;
  placeholder?: string;
  maxImages?: number;
  resourceId?: string;
  borrowerName?: string;
  folder?: string;
  tags?: string[];
  quality?: 'auto' | '80' | '90' | '100';
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  disabled?: boolean;
  style?: any;
}

export function ImageUpload({
  onImageSelected,
  onImageRemoved,
  currentImageUrl,
  placeholder = "Tap to add image",
  maxImages = 1,
  resourceId,
  borrowerName,
  folder,
  tags,
  quality = 'auto',
  format = 'auto',
  disabled = false,
  style,
}: ImageUploadProps) {
  const { uploadImage, uploading, error, clearError } = useImageUpload();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const handleImagePicker = () => {
    if (disabled || uploading) return;
    setShowImagePicker(true);
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageSelection(result.assets[0]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: maxImages > 1,
        selectionLimit: maxImages,
      });

      if (!result.canceled && result.assets.length > 0) {
        for (const asset of result.assets) {
          await handleImageSelection(asset);
        }
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const handleImageSelection = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      clearError();
      
      const uploadResult = await uploadImage(asset.uri, {
        resourceId,
        borrowerName,
        folder,
        tags,
        quality,
        format,
      });

      if (uploadResult) {
        const newImageUrl = uploadResult.url;
        setSelectedImages(prev => [...prev, newImageUrl]);
        onImageSelected(newImageUrl, uploadResult.publicId);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
    }
  };

  const removeImage = (imageUrl: string) => {
    setSelectedImages(prev => prev.filter(url => url !== imageUrl));
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  const displayImage = currentImageUrl || selectedImages[0];

  return (
    <>
      <View style={[styles.container, style]}>
        {displayImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: displayImage }} style={styles.image} />
            {!disabled && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(displayImage)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.placeholder, disabled && styles.disabled]}
            onPress={handleImagePicker}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Ionicons name="camera" size={32} color="#666" />
                <Text style={styles.placeholderText}>{placeholder}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {maxImages > 1 && selectedImages.length > 0 && (
          <View style={styles.multipleImagesContainer}>
            {selectedImages.map((imageUrl, index) => (
              <View key={index} style={styles.multipleImageItem}>
                <Image source={{ uri: imageUrl }} style={styles.multipleImage} />
                <TouchableOpacity
                  style={styles.multipleRemoveButton}
                  onPress={() => removeImage(imageUrl)}
                >
                  <Ionicons name="close" size={16} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <ImageSelectionModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCameraPress={openCamera}
        onLibraryPress={openImageLibrary}
        maxImages={maxImages}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  placeholder: {
    height: 200,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  disabled: {
    opacity: 0.5,
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  multipleImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  multipleImageItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  multipleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  multipleRemoveButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
});
