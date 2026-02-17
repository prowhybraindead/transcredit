import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as Haptics from 'expo-haptics';
import {
    GoogleSignin,
    isSuccessResponse,
    isErrorWithCode,
    statusCodes,
} from '@react-native-google-signin/google-signin';

// Configure Google Sign-In with Web Client ID
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
});

interface AuthScreenProps {
    onAuthSuccess: (uid: string, email: string, isNewUser: boolean) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Validation ────────────────────────────────────────
    const validate = () => {
        if (!email.includes('@')) return 'Please enter a valid email';
        if (password.length < 6) return 'Password must be at least 6 characters';
        if (mode === 'register' && password !== confirmPassword)
            return 'Passwords do not match';
        return null;
    };

    // ── Email/Password Submit ─────────────────────────────
    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (mode === 'login') {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAuthSuccess(cred.user.uid, cred.user.email || email, false);
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAuthSuccess(cred.user.uid, cred.user.email || email, true);
            }
        } catch (e: any) {
            console.error('[Auth] Error code:', e?.code, '| Message:', e?.message);

            const errorMap: Record<string, string> = {
                'auth/invalid-email': 'Invalid email address',
                'auth/user-disabled': 'This account has been disabled',
                'auth/user-not-found': 'No account found with this email',
                'auth/wrong-password': 'Incorrect password',
                'auth/email-already-in-use': 'An account with this email already exists',
                'auth/weak-password': 'Password is too weak (min 6 characters)',
                'auth/network-request-failed': 'Network error — check your connection',
                'auth/too-many-requests': 'Too many attempts. Please try again later',
                'auth/invalid-credential': 'Invalid email or password',
                'auth/operation-not-allowed': 'This sign-in method is not enabled',
            };

            const friendly = errorMap[e?.code || ''];
            setError(friendly || e?.message || 'Authentication failed');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    // ── Native Google Sign-In ─────────────────────────────
    const handleGoogleSignIn = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            // Check if Google Play Services are available
            await GoogleSignin.hasPlayServices();

            // Trigger native Google Sign-In
            const response = await GoogleSignin.signIn();

            if (isSuccessResponse(response)) {
                const idToken = response.data?.idToken;
                if (!idToken) {
                    throw new Error('No ID token received from Google');
                }

                // Exchange Google token for Firebase credential
                const credential = GoogleAuthProvider.credential(idToken);
                const result = await signInWithCredential(auth, credential);
                const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAuthSuccess(result.user.uid, result.user.email || '', isNew);
            }
        } catch (e: any) {
            console.error('[Auth] Google Sign-In error:', e?.code, e?.message);

            if (isErrorWithCode(e)) {
                switch (e.code) {
                    case statusCodes.SIGN_IN_CANCELLED:
                        // User cancelled — don't show error
                        break;
                    case statusCodes.IN_PROGRESS:
                        setError('Google Sign-In is already in progress');
                        break;
                    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                        setError('Google Play Services not available');
                        break;
                    default:
                        setError('Google sign-in failed. Please try again.');
                }
            } else {
                setError(e?.message || 'Google sign-in failed');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Anonymous Sign-In ─────────────────────────────────
    const handleAnonymousSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const cred = await signInAnonymously(auth);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAuthSuccess(cred.user.uid, '', true);
        } catch (e: any) {
            console.error('[Auth] Anonymous error:', e?.code, e?.message);
            setError(e?.message || 'Anonymous sign-in failed');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const isAnyLoading = loading || googleLoading;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>TC</Text>
                    </View>
                    <Text style={styles.appName}>TransCredit</Text>
                    <Text style={styles.tagline}>Secure Digital Payments</Text>
                </View>

                {/* Tab Toggle */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'login' && styles.activeTab]}
                        onPress={() => { setMode('login'); setError(null); }}
                    >
                        <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                            Login
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'register' && styles.activeTab]}
                        onPress={() => { setMode('register'); setError(null); }}
                    >
                        <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                            Register
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Email/Password Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor="#475569"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min 6 characters"
                            placeholderTextColor="#475569"
                            secureTextEntry
                        />
                    </View>

                    {mode === 'register' && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter password"
                                placeholderTextColor="#475569"
                                secureTextEntry
                            />
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    )}

                    {/* Email/Password Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, isAnyLoading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={isAnyLoading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>
                                {mode === 'login' ? '✉️  Sign In with Email' : '✉️  Create Account'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign-In */}
                    <TouchableOpacity
                        style={[styles.socialBtn, styles.googleBtn, isAnyLoading && styles.submitBtnDisabled]}
                        onPress={handleGoogleSignIn}
                        disabled={isAnyLoading}
                        activeOpacity={0.8}
                    >
                        {googleLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.socialBtnText}>
                                🔵  Continue with Google
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Anonymous Sign-In */}
                    <TouchableOpacity
                        style={[styles.socialBtn, styles.anonBtn, isAnyLoading && styles.submitBtnDisabled]}
                        onPress={handleAnonymousSignIn}
                        disabled={isAnyLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.socialBtnText}>
                            👤  Try as Guest
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e17',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#f1f5f9',
    },
    tagline: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#1e293b',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: '#f1f5f9',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#f1f5f9',
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        textAlign: 'center',
    },
    submitBtn: {
        backgroundColor: '#6366f1',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1e293b',
    },
    dividerText: {
        fontSize: 13,
        color: '#475569',
        marginHorizontal: 12,
    },
    socialBtn: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    googleBtn: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    anonBtn: {
        backgroundColor: 'transparent',
        borderColor: '#1e293b',
    },
    socialBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e2e8f0',
    },
});
