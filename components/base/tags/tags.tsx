import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Image, StyleSheet, View } from 'react-native';

type TagSize = 'sm' | 'md';

interface TagGroupProps {
  label?: string;
  size?: TagSize;
  children: React.ReactNode;
}

interface TagListProps {
  children: React.ReactNode;
}

interface TagProps {
  children: React.ReactNode;
  dot?: boolean;
  dotColor?: string;
  avatarSrc?: string;
  size?: TagSize;
}

export function TagGroup({ label, children }: TagGroupProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.group}>
      {label ? <ThemedText style={[styles.groupLabel, { color: colors.text }]}>{label}</ThemedText> : null}
      {children}
    </View>
  );
}

export function TagList({ children }: TagListProps) {
  return <View style={styles.list}>{children}</View>;
}

export function Tag({ children, dot = false, dotColor, avatarSrc, size = 'md' }: TagProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isSmall = size === 'sm';
  const dotSize = isSmall ? 6 : 7;
  const avatarSize = isSmall ? 14 : 16;

  return (
    <View
      style={[
        styles.tag,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 3 : 4,
          borderRadius: 8,
        },
      ]}
    >
      {dot ? <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: dotColor || '#22C55E' }} /> : null}
      {avatarSrc ? <Image source={{ uri: avatarSrc }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} /> : null}
      <ThemedText style={[styles.tagText, { color: colors.text, fontSize: isSmall ? 11 : 12 }]}>{children}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontWeight: '600',
    lineHeight: 14,
  },
});
