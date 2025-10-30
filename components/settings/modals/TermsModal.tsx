import { Ionicons } from '@expo/vector-icons';
import {
    Animated,
    Modal,
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';

import { styles } from './TermsModal.styles';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsModal({ visible, onClose }: TermsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });

  if (!visible) return null;

  const Content = (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <ThemedText style={[styles.heading, { color: colors.text }]}>Terms and Conditions</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        These Terms and Conditions govern the internal use of the Respondr application by Davao Oriental PDRRMO staff and authorized personnel. By using the app, you agree to these terms.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>1. Purpose and Scope</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Respondr is an internal coordination tool for rain‑induced disaster operations (e.g., floods, landslides). It supports logging operations, managing resources, documenting memos and SitReps, and monitoring basic weather data.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>2. User Accounts and Roles</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Accounts are restricted to authorized Admin, Supervisor, and Operator roles. Users are responsible for safeguarding credentials and actions taken under their accounts. New signups may require activation by administrators.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>3. Data Entry and Accuracy</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Users must ensure that SitReps, operations logs, and resource updates are accurate and timely. Uploaded documents must be official or authorized communications. The app may track basic metadata and audit information for accountability.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>4. Documents and Intellectual Property</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Documents stored in the app (memos, circulars, reports) are for internal use only. Do not redistribute outside PDRRMO without proper authorization.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>5. Connectivity and Offline Use</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        The app provides offline-first features and queueing; however, certain actions (e.g., first-time login, file downloads) may require connectivity. Data will sync automatically when the network is available.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>6. Privacy</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        User data is processed for coordination and operational purposes only. The system uses Firebase services; storage and authentication are subject to Firebase policies and the organization’s internal data handling standards.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>7. Limitations and Disclaimers</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Respondr does not automate physical response or guarantee real-time accuracy of external feeds. Weather readings and predictive features may use thresholds and simulated datasets for decision support and should be validated by qualified staff.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>8. Security and Acceptable Use</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        Do not share credentials, attempt unauthorized access, or upload malicious content. The organization may audit access and activity logs to ensure compliance.
      </ThemedText>

      <ThemedText style={[styles.subheading, { color: colors.text }]}>9. Changes to Terms</ThemedText>
      <ThemedText style={[styles.paragraph, { color: colors.text }]}>
        These terms may be updated to reflect operational or policy changes. Continued use of the app signifies acceptance of the updated terms.
      </ThemedText>

      <ThemedText style={[styles.paragraph, { color: colors.text, marginTop: 12 }]}>
        For questions, contact the PDRRMO system administrator.
      </ThemedText>
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
                <Ionicons name="document-text-outline" size={22} color={colors.tint} />
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Terms and Conditions</ThemedText>
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
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Terms and Conditions</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          {Content}
        </View>
      </View>
    </Modal>
  );
}


