import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface PinPadProps {
    onComplete: (pin: string) => void;
    onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PinPad({ onComplete, onCancel }: PinPadProps) {
    const [pin, setPin] = useState('');
    const [shakeAnim] = useState(new Animated.Value(0));

    const handlePress = useCallback(
        (digit: string) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (pin.length < 6) {
                const newPin = pin + digit;
                setPin(newPin);
                if (newPin.length === 6) {
                    // Simulate processing delay
                    setTimeout(() => {
                        onComplete(newPin);
                    }, 300);
                }
            }
        },
        [pin, onComplete]
    );

    const handleDelete = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPin((prev) => prev.slice(0, -1));
    }, []);

    const digits = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', '⌫'],
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter PIN</Text>
            <Text style={styles.subtitle}>Confirm your payment</Text>

            {/* PIN Dots */}
            <View style={styles.dotsContainer}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            i < pin.length && styles.dotFilled,
                            {
                                transform: [
                                    {
                                        scale: i < pin.length ? 1.2 : 1,
                                    },
                                ],
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                {digits.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.keypadRow}>
                        {row.map((digit, colIndex) => {
                            if (digit === '') {
                                return <View key={colIndex} style={styles.keyEmpty} />;
                            }

                            if (digit === '⌫') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={styles.key}
                                        onPress={handleDelete}
                                        activeOpacity={0.6}
                                    >
                                        <Text style={styles.keyTextSpecial}>⌫</Text>
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={styles.key}
                                    onPress={() => handlePress(digit)}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.keyText}>{digit}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e1a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#f9fafb',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#374151',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    keypad: {
        width: Math.min(SCREEN_WIDTH - 80, 300),
        gap: 12,
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    key: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyEmpty: {
        width: 76,
        height: 76,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#f9fafb',
    },
    keyTextSpecial: {
        fontSize: 24,
        color: '#9ca3af',
    },
    cancelBtn: {
        marginTop: 32,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '500',
    },
});
