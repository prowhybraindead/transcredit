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
import { api, RegisterPayload } from '../lib/api';
import * as Haptics from 'expo-haptics';

const BANKS = [
    { name: 'Techcombank', color: '#E4002B' },
    { name: 'MBBank', color: '#00529B' },
    { name: 'Vietcombank', color: '#006A4E' },
    { name: 'VPBank', color: '#00703C' },
    { name: 'ACB', color: '#003399' },
    { name: 'Sacombank', color: '#003B73' },
    { name: 'TPBank', color: '#6B21A8' },
    { name: 'BIDV', color: '#005BAA' },
];

interface OnboardingScreenProps {
    uid: string;
    email: string;
    onComplete: (profile: {
        displayName: string;
        phoneNumber: string;
        bankName: string;
        accountNumber: string;
        balance: number;
    }) => void;
}

export default function OnboardingScreen({ uid, email, onComplete }: OnboardingScreenProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [balance, setBalance] = useState(0);

    const handleSubmit = async () => {
        if (!displayName.trim()) return setError('Please enter your full name');
        if (!phoneNumber.trim() || phoneNumber.length < 10)
            return setError('Please enter a valid phone number');
        if (!selectedBank) return setError('Please select a bank');

        setLoading(true);
        setError(null);
        try {
            const payload: RegisterPayload = {
                uid,
                email,
                displayName: displayName.trim(),
                phoneNumber: phoneNumber.trim(),
                bankName: selectedBank,
            };
            const res = await api.register(payload);
            setAccountNumber(res.wallet.accountNumber);
            setBalance(res.wallet.balance);
            setStep('success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e: any) {
            setError(e?.message || 'Registration failed');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <View style={styles.container}>
                <View style={styles.successContent}>
                    <View style={styles.successIcon}>
                        <Text style={{ fontSize: 48 }}>🎉</Text>
                    </View>
                    <Text style={styles.successTitle}>Welcome, {displayName}!</Text>
                    <Text style={styles.successSubtitle}>Your account has been created</Text>

                    <View style={styles.cardContainer}>
                        <View style={[styles.virtualCard, { borderColor: BANKS.find(b => b.name === selectedBank)?.color || '#6366f1' }]}>
                            <Text style={styles.cardBank}>{selectedBank}</Text>
                            <Text style={styles.cardNumber}>
                                {accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
                            </Text>
                            <View style={styles.cardRow}>
                                <View>
                                    <Text style={styles.cardLabel}>Account Holder</Text>
                                    <Text style={styles.cardValue}>{displayName}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.cardLabel}>Balance</Text>
                                    <Text style={[styles.cardValue, { color: '#22c55e' }]}>
                                        ₫{balance.toLocaleString('vi-VN')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() =>
                            onComplete({
                                displayName,
                                phoneNumber,
                                bankName: selectedBank!,
                                accountNumber,
                                balance,
                            })
                        }
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueBtnText}>Start Using TransCredit →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>Set up your digital wallet</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Nguyen Van A"
                            placeholderTextColor="#475569"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="0901234567"
                            placeholderTextColor="#475569"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Select Your Bank</Text>
                        <View style={styles.bankGrid}>
                            {BANKS.map((bank) => (
                                <TouchableOpacity
                                    key={bank.name}
                                    style={[
                                        styles.bankChip,
                                        selectedBank === bank.name && {
                                            borderColor: bank.color,
                                            backgroundColor: `${bank.color}15`,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedBank(bank.name);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <View
                                        style={[styles.bankDot, { backgroundColor: bank.color }]}
                                    />
                                    <Text
                                        style={[
                                            styles.bankName,
                                            selectedBank === bank.name && { color: '#f1f5f9' },
                                        ]}
                                    >
                                        {bank.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

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
                            <Text style={styles.submitText}>Create Wallet 🚀</Text>
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 60,
    },
    header: {
        marginBottom: 32,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6366f1',
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#f1f5f9',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    form: {
        gap: 20,
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
    bankGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    bankChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#1e293b',
        backgroundColor: '#111827',
    },
    bankDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    bankName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
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
    // Success screen
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f1f5f9',
    },
    successSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 32,
    },
    cardContainer: {
        width: '100%',
        marginBottom: 32,
    },
    virtualCard: {
        backgroundColor: '#111827',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1.5,
    },
    cardBank: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 20,
    },
    cardNumber: {
        fontSize: 22,
        fontWeight: '600',
        color: '#f1f5f9',
        letterSpacing: 2,
        marginBottom: 24,
        fontVariant: ['tabular-nums'],
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f1f5f9',
    },
    continueBtn: {
        backgroundColor: '#6366f1',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 32,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
