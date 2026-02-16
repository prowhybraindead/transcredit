import React, { useState } from 'react';
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as Haptics from 'expo-haptics';

interface AuthScreenProps {
    onAuthSuccess: (uid: string, email: string, isNewUser: boolean) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = () => {
        if (!email.includes('@')) return 'Please enter a valid email';
        if (password.length < 6) return 'Password must be at least 6 characters';
        if (mode === 'register' && password !== confirmPassword)
            return 'Passwords do not match';
        return null;
    };

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
            const msg = e?.message || 'Authentication failed';
            // Clean up Firebase error messages
            const cleaned = msg
                .replace('Firebase: ', '')
                .replace(/\(auth\/[\w-]+\)\.?/, '')
                .trim();
            setError(cleaned || msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

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

                {/* Form */}
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

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>
                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                            </Text>
                        )}
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
        marginTop: 8,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
