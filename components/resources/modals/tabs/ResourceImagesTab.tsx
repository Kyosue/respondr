import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { Resource } from '@/types/Resource';

interface ResourceImagesTabProps {
  resource: Resource;
}

export function ResourceImagesTab({ resource }: ResourceImagesTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Filter out invalid or broken image URLs
  const validImages = resource.images.filter(image => {
    return image && image.trim().length > 0 && image.startsWith('http');
  });

  // If we have images but they're all invalid, show empty state
  if (resource.images.length > 0 && validImages.length === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <ThemedText style={styles.emptyText}>Images are being cleaned up...</ThemedText>
        </View>
      </ScrollView>
    );
  }

  if (validImages.length === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Ionicons name="image-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <ThemedText style={styles.emptyText}>No images available</ThemedText>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
          <View style={styles.imagesGrid}>
            {validImages.map((image, index) => (
              <ImageWithErrorHandling 
                key={`${image}-${index}`} 
                imageUrl={image} 
                resourceId={resource.id}
                onPress={() => setSelectedImageIndex(index)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Full-screen image viewer modal */}
      <FullScreenImageViewer
        visible={selectedImageIndex !== null}
        images={validImages}
        currentIndex={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        onImageChange={setSelectedImageIndex}
      />
    </>
  );
}

interface ImageWithErrorHandlingProps {
  imageUrl: string;
  resourceId: string;
  onPress: () => void;
}

function ImageWithErrorHandling({ imageUrl, resourceId, onPress }: ImageWithErrorHandlingProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Check if this looks like a Cloudinary URL that might be deleted
  const isCloudinaryUrl = imageUrl.includes('cloudinary.com');
  const isLikelyDeleted = isCloudinaryUrl && (
    imageUrl.includes('image-not-found') || 
    imageUrl.includes('404') ||
    imageUrl.includes('not-found')
  );

  if (hasError || isLikelyDeleted) {
    return (
      <View style={[styles.imageContainer, styles.errorImageContainer]}>
        <Ionicons name="image-outline" size={32} color="#999" />
        <Ionicons name="close-circle" size={16} color="#ff4444" style={styles.errorIcon} />
      </View>
    );
  }

  const handleError = () => {
    console.log('Image failed to load:', imageUrl);
    setHasError(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  return (
    <TouchableOpacity 
      style={styles.imageContainer} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ 
          uri: imageUrl,
          cache: 'force-cache' // Use cached images for better performance
        }} 
        style={styles.image}
        onError={handleError}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
        resizeMode="cover"
        fadeDuration={150} // Smooth fade-in animation
        loadingIndicatorSource={undefined} // Disable default loading indicator
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Ionicons name="refresh" size={24} color="#666" />
        </View>
      )}
    </TouchableOpacity>
  );
}

interface FullScreenImageViewerProps {
  visible: boolean;
  images: string[];
  currentIndex: number | null;
  onClose: () => void;
  onImageChange: (index: number) => void;
}

function FullScreenImageViewer({ 
  visible, 
  images, 
  currentIndex, 
  onClose, 
  onImageChange 
}: FullScreenImageViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { width, height } = Dimensions.get('window');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const currentImage = currentIndex !== null ? images[currentIndex] : null;

  // Reset states when modal opens or image changes
  useEffect(() => {
    if (visible && currentIndex !== null) {
      setImageError(false);
      setImageLoading(true);
      
      // Preload adjacent images for better performance
      preloadAdjacentImages();
    }
  }, [visible, currentIndex]);

  // Preload adjacent images for smoother navigation
  const preloadAdjacentImages = () => {
    if (currentIndex === null) return;
    
    // Preload previous image
    if (currentIndex > 0) {
      Image.prefetch(images[currentIndex - 1]);
    }
    
    // Preload next image
    if (currentIndex < images.length - 1) {
      Image.prefetch(images[currentIndex + 1]);
    }
  };

  // Reset states when image changes
  const handleImageChange = (newIndex: number) => {
    setImageError(false);
    setImageLoading(true);
    onImageChange(newIndex);
    
    // Preload adjacent images after a short delay
    setTimeout(() => {
      preloadAdjacentImages();
    }, 100);
  };

  const goToPrevious = () => {
    if (currentIndex !== null && currentIndex > 0) {
      handleImageChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex !== null && currentIndex < images.length - 1) {
      handleImageChange(currentIndex + 1);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
  };

  // Early return after all hooks
  if (!visible || currentIndex === null) return null;

  const handleSwipe = (event: any) => {
    const { translationX } = event.nativeEvent;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(translationX) > threshold) {
      if (translationX > 0 && currentIndex !== null && currentIndex > 0) {
        // Swipe right - go to previous image
        goToPrevious();
      } else if (translationX < 0 && currentIndex !== null && currentIndex < images.length - 1) {
        // Swipe left - go to next image
        goToNext();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PanGestureHandler onGestureEvent={handleSwipe} onHandlerStateChange={handleSwipe}>
          <SafeAreaView style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.fullScreenHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.imageCounter, { color: colors.text }]}>
              {currentIndex + 1} of {images.length}
            </ThemedText>
            {images.length > 1 && (
              <ThemedText style={[styles.swipeHint, { color: colors.text }]}>
                Swipe to navigate
              </ThemedText>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Image Container */}
        <View style={styles.imageViewerContainer}>
          {imageError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={64} color={colors.text} style={{ opacity: 0.6 }} />
              <ThemedText style={[styles.errorText, { color: colors.text }]}>Failed to load image</ThemedText>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setImageError(false);
                  setImageLoading(true);
                }}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <ThemedText style={styles.retryText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fullScreenImageContainer}>
              <Image
                source={{ 
                  uri: currentImage!,
                  cache: 'force-cache' // Use cached images for better performance
                }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={handleImageError}
                onLoad={handleImageLoad}
                onLoadStart={handleImageLoadStart}
                fadeDuration={200} // Smooth fade-in animation
                loadingIndicatorSource={undefined} // Disable default loading indicator
              />
              {imageLoading && (
                <View style={[styles.fullScreenLoadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
                  <Ionicons name="refresh" size={32} color={colors.text} style={{ opacity: 0.8 }} />
                  <ThemedText style={[styles.loadingText, { color: colors.text }]}>Loading...</ThemedText>
                </View>
              )}
            </View>
          )}
        </View>

          </SafeAreaView>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorImageContainer: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  errorIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 12,
  },
  
  // Full-screen image viewer styles
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  imageCounter: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  swipeHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  placeholder: {
    width: 40, // Same width as close button for centering
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height * 0.7,
    maxWidth: Dimensions.get('window').width - 32,
    maxHeight: Dimensions.get('window').height * 0.7,
    // Optimize for performance
    resizeMode: 'contain',
  },
  
  // Error and loading states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  fullScreenLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    opacity: 0.8,
  },
});
