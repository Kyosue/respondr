import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Animated,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';

import { styles } from './HelpSupportModal.styles';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpSupportModal({ visible, onClose }: HelpSupportModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });

  if (!visible) return null;

  const Content = (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Contact</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>For assistance, contact the PDRRMO systems team:</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>Email: it-support@pdrrmo.local</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>Hotline: (xxx) xxx-xxxx</ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Troubleshooting</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>- If offline, actions queue and sync when online.</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>- First-time login requires network.</ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>- For slow networks, wait for retries or try later.</ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Resources</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => Linking.openURL('https://firebase.google.com/docs')}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>Firebase Docs</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://expo.dev')}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>Expo Documentation</ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }] }>
          <TouchableOpacity style={styles.overlayCloseButton} onPress={handleClose} activeOpacity={0.7} />
          <Animated.View
            style={[
              styles.containerWeb,
              { backgroundColor: colors.background, opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
            ]}
          >
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <Ionicons name="help-circle-outline" size={22} color={colors.tint} />
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Help & Support</ThemedText>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            {Content}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Help & Support</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          {Content}
        </View>
      </View>
    </Modal>
  );
}


