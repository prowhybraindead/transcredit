import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';

interface PaymentResultProps {
    success: boolean;
    amount: number;
    merchantName: string;
    newBalance?: number;
    pointsEarned?: number;
    errorMessage?: string;
    onDone: () => void;
}

export default function PaymentResult({
    success,
    amount,
    merchantName,
    newBalance,
    pointsEarned,
    errorMessage,
    onDone,
}: PaymentResultProps) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const formatVND = (value: number) =>
        '₫' + value.toLocaleString('vi-VN');

    return (
        <View style={styles.container}>
            {/* Icon */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    success ? styles.iconSuccess : styles.iconError,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <Text style={styles.iconText}>{success ? '✓' : '✕'}</Text>
            </Animated.View>

            {/* Title */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={[styles.title, success ? styles.titleSuccess : styles.titleError]}>
                    {success ? 'Payment Successful!' : 'Payment Failed'}
                </Text>

                <Text style={styles.amount}>{formatVND(amount)}</Text>
                <Text style={styles.merchantName}>to {merchantName}</Text>

                {success && newBalance !== undefined && (
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Remaining Balance</Text>
                            <Text style={styles.detailValue}>{formatVND(newBalance)}</Text>
                        </View>
                        {pointsEarned !== undefined && pointsEarned > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Points Earned</Text>
                                <Text style={[styles.detailValue, styles.pointsValue]}>
                                    +{pointsEarned} ⭐
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {!success && errorMessage && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.8}>
                    <Text style={styles.doneBtnText}>
                        {success ? 'Done' : 'Try Again'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e1a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    iconSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 3,
        borderColor: '#10b981',
    },
    iconError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 3,
        borderColor: '#ef4444',
    },
    iconText: {
        fontSize: 44,
        fontWeight: '700',
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    titleSuccess: {
        color: '#10b981',
    },
    titleError: {
        color: '#ef4444',
    },
    amount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#f9fafb',
        textAlign: 'center',
        letterSpacing: -1,
    },
    merchantName: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 32,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 20,
        gap: 16,
        marginBottom: 32,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: '#9ca3af',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f9fafb',
    },
    pointsValue: {
        color: '#f59e0b',
    },
    errorCard: {
        width: '100%',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        padding: 16,
        marginBottom: 32,
    },
    errorText: {
        color: '#fca5a5',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    doneBtn: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#6366f1',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
