import { LoginForm } from '@/components/auth/LoginForm';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogin } from '@/hooks/useLogin';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login, isLoading, error } = useLogin();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // No animations - instant rendering

  const handleLogin = async (email: string, password: string) => {
    try {
      const success = await login(email, password);
      if (success) {
        // Navigate to the index screen instead of showing an alert
        router.replace('/');
      }
    } catch (err) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' ? 
          ['#121212', '#1E1E1E', '#121212'] : 
          [colors.background, '#f5f7fa', colors.background]}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationCircle, { backgroundColor: `${colors.primary}15` }]} />
        <View style={[styles.decorationCircle, styles.decorationCircle2, { backgroundColor: `${colors.secondary}10` }]} />
      </View>
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/logo-1.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Respondr
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Sign in to your Respondr account
                </ThemedText>
              </View>
              
              <View style={styles.formContainer}>
                <LoginForm 
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                  error={error}
                />
              </View>
              
              <View style={styles.footerContainer}>
                <ThemedText style={styles.footerText}>
                  Don&apos;t have an account?
                </ThemedText>
                <Link href="/signup" asChild>
                  <TouchableOpacity>
                    <ThemedText style={[styles.linkText, { color: colors.primary }]}>
                      Sign Up
                    </ThemedText>
                  </TouchableOpacity>
                </Link>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width * 0.35, 140);

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.8,
  },
  decorationCircle2: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.6,
    left: -width * 0.3,
    opacity: 0.6,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height * 0.9,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: logoSize,
    height: logoSize,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: -5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: 300,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.5)' : undefined,
    backdropFilter: Platform.OS === 'ios' ? 'blur(10px)' : undefined,
    borderRadius: 24,
    padding: Platform.OS === 'ios' ? 24 : 0,
    marginVertical: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 15,
    marginRight: 6,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  },

});