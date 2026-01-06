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
      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Getting Started</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8 }]}>
          Welcome to Respondr, the disaster response management system for PDRRMO Davao Oriental. This application helps coordinate emergency resources, track operations, and manage situation reports during disasters.
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginTop: 8 }]}>
          <ThemedText style={{ fontWeight: '600' }}>Key Features:</ThemedText>
          {'\n'}• Resource Management - Track vehicles, equipment, and supplies
          {'\n'}• Operations Tracking - Monitor emergency operations on interactive maps
          {'\n'}• Situation Reports - Upload and manage emergency documentation
          {'\n'}• Offline Support - Continue working without internet connection
        </ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8 }]}>
          For technical assistance, account issues, or feature requests, please contact:
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginTop: 4 }]}>
          <ThemedText style={{ fontWeight: '600' }}>IT Support Team</ThemedText>
          {'\n'}Email: it-support@pdrrmo.davaooriental.gov.ph
          {'\n'}Phone: (087) 388-3000
          {'\n'}Office Hours: Monday - Friday, 8:00 AM - 5:00 PM
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginTop: 12 }]}>
          <ThemedText style={{ fontWeight: '600' }}>Emergency Support</ThemedText>
          {'\n'}For urgent issues during active emergencies, contact the Operations Center:
          {'\n'}Hotline: (087) 388-3001
          {'\n'}Available 24/7 during disaster operations
        </ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Q: Can I use the app without internet?
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 12 }]}>
          A: Yes, after your first login, the app works offline. All actions are queued and automatically sync when connectivity is restored.
        </ThemedText>

        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Q: Why can't I log in for the first time offline?
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 12 }]}>
          A: Initial authentication requires an internet connection to verify your credentials with Firebase. Subsequent logins can work offline if your session is still valid.
        </ThemedText>

        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Q: How do I upload documents or images?
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 12 }]}>
          A: Navigate to the SitRep section, tap the upload button, and select files from your device. Supported formats include PDF, DOC, DOCX, and images (JPG, PNG).
        </ThemedText>

        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Q: What should I do if data isn't syncing?
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          A: Check your internet connection. If online, wait a few moments for automatic retry. If issues persist, restart the app or contact IT support.
        </ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Troubleshooting</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Connection Issues
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 12 }]}>
          • Slow network: Wait for automatic retries or try again later
          {'\n'}• No connection: App continues working offline; data syncs when online
          {'\n'}• Connection timeout: Check network settings and try again
        </ThemedText>

        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          App Performance
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 12 }]}>
          • App is slow: Close and restart the app, clear cache if needed
          {'\n'}• Images not loading: Check internet connection or wait for sync
          {'\n'}• Data not updating: Pull down to refresh or restart the app
        </ThemedText>

        <ThemedText style={[styles.paragraph, { color: colors.text, marginBottom: 8, fontWeight: '600' }]}>
          Account Issues
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          • Can't log in: Verify credentials, ensure internet connection for first login
          {'\n'}• Permission errors: Contact your administrator to verify account permissions
          {'\n'}• Session expired: Log out and log back in
        </ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>System Requirements</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          <ThemedText style={{ fontWeight: '600' }}>Mobile Devices:</ThemedText>
          {'\n'}• Android 8.0 (Oreo) or later
          {'\n'}• iOS 13.0 or later
          {'\n'}• Minimum 2GB RAM recommended
          {'\n'}• 100MB free storage space
        </ThemedText>
        <ThemedText style={[styles.paragraph, { color: colors.text, marginTop: 12 }]}>
          <ThemedText style={{ fontWeight: '600' }}>Web Browser:</ThemedText>
          {'\n'}• Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
          {'\n'}• JavaScript enabled
          {'\n'}• Modern browser with WebGL support
        </ThemedText>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Additional Resources</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.davaooriental.gov.ph')} style={{ marginBottom: 8 }}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>Davao Oriental Provincial Government</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://ndrrmc.gov.ph')} style={{ marginBottom: 8 }}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>NDRRMC Official Website</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://pagasa.dost.gov.ph')} style={{ marginBottom: 8 }}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>PAGASA Weather Updates</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://phivolcs.dost.gov.ph')}>
          <ThemedText style={[styles.link, { color: colors.tint }]}>PHIVOLCS Earthquake & Volcano Updates</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Security</ThemedText>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.paragraph, { color: colors.text }]}>
          Your data is securely stored and encrypted. All communications use secure protocols. Access is restricted to authorized PDRRMO personnel only. For security concerns, contact IT support immediately.
        </ThemedText>
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


