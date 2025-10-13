import { usePlatform } from '@/hooks/usePlatform';
import { Image, ImageProps } from 'expo-image';

interface WebOptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: ImageProps['source'];
  webSrc?: string;
  fallbackSrc?: string;
}

export function WebOptimizedImage({ 
  source, 
  webSrc, 
  fallbackSrc,
  ...props 
}: WebOptimizedImageProps) {
  const { isWeb } = usePlatform();

  // For web, use webSrc if provided, otherwise use original source
  const imageSource = isWeb && webSrc ? { uri: webSrc } : source;

  return (
    <Image
      source={imageSource}
      {...props}
      // Web-specific optimizations
      {...(isWeb && {
        contentFit: 'cover',
        transition: 200,
      })}
    />
  );
}
