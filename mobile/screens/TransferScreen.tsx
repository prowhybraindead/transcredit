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
    Modal,
    FlatList,
} from 'react-native';
import { api, P2PTransferPayload } from '../lib/api';
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

interface TransferScreenProps {
    userUid: string;
    currentBalance: number;
    onBack: () => void;
    onSuccess: (newBalance: number) => void;
}

export default function TransferScreen({
    userUid,
    currentBalance,
    onBack,
    onSuccess,
}: TransferScreenProps) {
    const [selectedBank, setSelectedBank] = useState(BANKS[0].name);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showBankPicker, setShowBankPicker] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; receiverName?: string; newBalance?: number } | null>(null);

    const amountNum = parseInt(amount.replace(/\D/g, '') || '0', 10);

    const formatAmount = (text: string) => {
        const digits = text.replace(/\D/g, '');
        if (!digits) return '';
        return parseInt(digits, 10).toLocaleString('vi-VN');
    };

    const handleTransfer = async () => {
        if (!accountNumber.trim()) return setError('Please enter account number');
        if (amountNum <= 0) return setError('Please enter a valid amount');
        if (amountNum > currentBalance) return setError('Insufficient funds');

        setLoading(true);
        setError(null);
        try {
            const payload: P2PTransferPayload = {
                senderUid: userUid,
                receiverAccountNumber: accountNumber.trim(),
                amount: amountNum,
                message: message.trim() || undefined,
            };
            const res = await api.p2pTransfer(payload);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setResult(res);
        } catch (e: any) {
            const msg = e?.message || 'Transfer failed';
            setError(msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <View style={styles.container}>
                <View style={styles.resultContent}>
                    <View style={[styles.resultIcon, result.success ? styles.resultIconSuccess : styles.resultIconFail]}>
                        <Text style={{ fontSize: 48 }}>{result.success ? '✅' : '❌'}</Text>
                    </View>
                    <Text style={[styles.resultTitle, { color: result.success ? '#22c55e' : '#ef4444' }]}>
                        {result.success ? 'Transfer Successful!' : 'Transfer Failed'}
                    </Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>

                    {result.success && result.newBalance !== undefined && (
                        <View style={styles.resultBalance}>
                            <Text style={styles.resultBalanceLabel}>Remaining Balance</Text>
                            <Text style={styles.resultBalanceValue}>
                                ₫{result.newBalance.toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={() => {
                            if (result.success && result.newBalance !== undefined) {
                                onSuccess(result.newBalance);
                            } else {
                                onBack();
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitText}>
                            {result.success ? 'Done' : 'Try Again'}
                        </Text>
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
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.header}>
                    <Text style={styles.title}>Transfer Money</Text>
                    <Text style={styles.subtitle}>Send funds to another account</Text>
                </View>

                {/* Balance card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>
                        ₫{currentBalance.toLocaleString('vi-VN')}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Bank Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Receiver&apos;s Bank</Text>
                        <TouchableOpacity
                            style={styles.bankSelector}
                            onPress={() => setShowBankPicker(true)}
                        >
                            <View style={styles.bankSelectorInner}>
                                <View
                                    style={[
                                        styles.bankDot,
                                        { backgroundColor: BANKS.find((b) => b.name === selectedBank)?.color },
                                    ]}
                                />
                                <Text style={styles.bankSelectorText}>{selectedBank}</Text>
                            </View>
                            <Text style={styles.chevron}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Account Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Number</Text>
                        <TextInput
                            style={styles.input}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="Enter receiver's account number"
                            placeholderTextColor="#475569"
                            keyboardType="number-pad"
                        />
                    </View>

                    {/* Amount */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount (VND)</Text>
                        <View style={styles.amountInput}>
                            <Text style={styles.currencySymbol}>₫</Text>
                            <TextInput
                                style={styles.amountField}
                                value={amount}
                                onChangeText={(text) => setAmount(formatAmount(text))}
                                placeholder="0"
                                placeholderTextColor="#475569"
                                keyboardType="number-pad"
                            />
                        </View>
                        {/* Quick amounts */}
                        <View style={styles.quickAmounts}>
                            {[50000, 100000, 200000, 500000].map((a) => (
                                <TouchableOpacity
                                    key={a}
                                    style={styles.quickBtn}
                                    onPress={() => {
                                        setAmount(a.toLocaleString('vi-VN'));
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={styles.quickBtnText}>
                                        {a >= 1000000 ? `${a / 1000000}M` : `${a / 1000}K`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Message */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message (Optional)</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Transfer for..."
                            placeholderTextColor="#475569"
                            multiline
                        />
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitBtn, (loading || amountNum <= 0) && styles.submitBtnDisabled]}
                        onPress={handleTransfer}
                        disabled={loading || amountNum <= 0}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>
                                Confirm Transfer ₫{amountNum.toLocaleString('vi-VN')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Bank Picker Modal */}
            <Modal visible={showBankPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Bank</Text>
                        <FlatList
                            data={BANKS}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalBankRow,
                                        selectedBank === item.name && styles.modalBankRowActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedBank(item.name);
                                        setShowBankPicker(false);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <View style={[styles.bankDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.modalBankName}>{item.name}</Text>
                                    {selectedBank === item.name && (
                                        <Text style={{ color: '#6366f1', marginLeft: 'auto' }}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowBankPicker(false)}
                        >
                            <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 56,
    },
    headerRow: {
        marginBottom: 8,
    },
    backBtn: {
        alignSelf: 'flex-start',
    },
    backText: {
        fontSize: 15,
        color: '#6366f1',
        fontWeight: '600',
    },
    header: {
        marginBottom: 24,
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
    balanceCard: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1e293b',
        marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#22c55e',
        marginTop: 4,
    },
    form: {
        gap: 18,
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
    bankSelector: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bankSelectorInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    bankDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    bankSelectorText: {
        fontSize: 16,
        color: '#f1f5f9',
        fontWeight: '500',
    },
    chevron: {
        fontSize: 12,
        color: '#64748b',
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 14,
        paddingHorizontal: 16,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '700',
        color: '#6366f1',
        marginRight: 8,
    },
    amountField: {
        flex: 1,
        fontSize: 22,
        fontWeight: '600',
        color: '#f1f5f9',
        paddingVertical: 14,
    },
    quickAmounts: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    quickBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        alignItems: 'center',
    },
    quickBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
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
        opacity: 0.5,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    // Result
    resultContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    resultIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    resultIconSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    resultIconFail: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    resultMessage: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    resultBalance: {
        backgroundColor: '#111827',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1e293b',
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    resultBalanceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resultBalanceValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#22c55e',
        marginTop: 4,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111827',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f1f5f9',
        marginBottom: 16,
    },
    modalBankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    modalBankRowActive: {
        backgroundColor: '#1e293b',
    },
    modalBankName: {
        fontSize: 15,
        color: '#f1f5f9',
        fontWeight: '500',
    },
    modalClose: {
        marginTop: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#1e293b',
    },
    modalCloseText: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '600',
    },
});
