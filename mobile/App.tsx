import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { api, ApiError } from './lib/api';
import PinPad from './components/PinPad';
import PaymentResult from './components/PaymentResult';
import type { Order, ExecuteTransactionResponse } from './lib/types';

// ── Navigation state (no router needed for this flow) ────
type Screen = 'home' | 'scan' | 'checkout' | 'pin' | 'result';

// ── Hardcoded user for demo ──────────────────────────────
const DEMO_USER_ID = 'user-001';
const DEMO_USER_NAME = 'Nguyen Van A';
const DEMO_USER_BALANCE = 5_000_000;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [order, setOrder] = useState<Order | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<ExecuteTransactionResponse | null>(null);
  const [txError, setTxError] = useState<string>('');
  const [balance, setBalance] = useState(DEMO_USER_BALANCE);

  const [permission, requestPermission] = useCameraPermissions();

  const formatVND = (value: number) => '₫' + value.toLocaleString('vi-VN');

  // ── Handle QR scan ───────────────────────────────────────
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const parsed = JSON.parse(data);

      if (!parsed.orderId || parsed.action !== 'pay') {
        Alert.alert('Invalid QR', 'This QR code is not a valid payment request.');
        setScanning(false);
        return;
      }

      setLoading(true);
      const orderData = await api.getOrder(parsed.orderId);
      setOrder(orderData);
      setScreen('checkout');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not read QR code';
      Alert.alert('Error', message);
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle PIN completion → execute transaction ──────────
  const handlePinComplete = async (_pin: string) => {
    if (!order) return;

    setLoading(true);
    setScreen('home'); // Briefly show loading

    try {
      // Simulate processing delay (like a real bank)
      await new Promise((res) => setTimeout(res, 1500));

      const result = await api.executeTransaction({
        orderId: order.id,
        userId: DEMO_USER_ID,
      });

      setTxResult(result);
      if (result.newBalance !== undefined) {
        setBalance(result.newBalance);
      }
      setTxError('');
      setScreen('result');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Transaction failed';
      setTxResult({
        success: false,
        orderId: order.id,
        status: 'FAILED',
        message,
      });
      setTxError(message);
      setScreen('result');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset to home ────────────────────────────────────────
  const handleDone = () => {
    setScreen('home');
    setOrder(null);
    setTxResult(null);
    setTxError('');
    setScanning(false);
  };

  // ── Navigate to scanner ──────────────────────────────────
  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to scan QR codes.');
        return;
      }
    }
    setScanning(false);
    setScreen('scan');
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* ═══════════ HOME SCREEN ═══════════ */}
      {screen === 'home' && !loading && (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.homeContainer}>
            {/* Header */}
            <View style={styles.homeHeader}>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{DEMO_USER_NAME}</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {DEMO_USER_NAME.charAt(0)}
                </Text>
              </View>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceGradient}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatVND(balance)}</Text>
                <View style={styles.balanceMeta}>
                  <View style={styles.balanceMetaItem}>
                    <Text style={styles.balanceMetaIcon}>⭐</Text>
                    <Text style={styles.balanceMetaText}>0 points</Text>
                  </View>
                  <View style={styles.balanceMetaItem}>
                    <Text style={styles.balanceMetaIcon}>💳</Text>
                    <Text style={styles.balanceMetaText}>VND</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={handleOpenScanner}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>📷</Text>
                </View>
                <Text style={styles.actionLabel}>Scan & Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, styles.actionIconAlt]}>
                  <Text style={styles.actionIconText}>📊</Text>
                </View>
                <Text style={styles.actionLabel}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, styles.actionIconAlt2]}>
                  <Text style={styles.actionIconText}>🎁</Text>
                </View>
                <Text style={styles.actionLabel}>Rewards</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Activity Placeholder */}
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Activity</Text>
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Scan a merchant QR code to make your first payment
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* ═══════════ LOADING OVERLAY ═══════════ */}
      {loading && screen === 'home' && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Processing payment...</Text>
            <Text style={styles.loadingSubtext}>Please wait</Text>
          </View>
        </View>
      )}

      {/* ═══════════ SCANNER SCREEN ═══════════ */}
      {screen === 'scan' && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanning ? undefined : handleBarCodeScanned}
          />

          {/* Scanner overlay */}
          <View style={styles.scannerOverlay}>
            <SafeAreaView style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.scannerBackBtn}
                onPress={() => setScreen('home')}
              >
                <Text style={styles.scannerBackText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 60 }} />
            </SafeAreaView>

            {/* Scanner frame */}
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCorner} />
              <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
              <Animated.View style={styles.scannerLine} />
            </View>

            <Text style={styles.scannerHint}>
              Point your camera at the merchant's QR code
            </Text>
          </View>
        </View>
      )}

      {/* ═══════════ CHECKOUT SCREEN ═══════════ */}
      {screen === 'checkout' && order && (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.checkoutContainer}>
            <TouchableOpacity
              style={styles.checkoutBackBtn}
              onPress={handleDone}
            >
              <Text style={styles.checkoutBackText}>← Cancel</Text>
            </TouchableOpacity>

            <View style={styles.checkoutCard}>
              <View style={styles.merchantAvatar}>
                <Text style={styles.merchantAvatarText}>
                  {order.merchantName.charAt(0)}
                </Text>
              </View>

              <Text style={styles.checkoutMerchant}>{order.merchantName}</Text>

              <Text style={styles.checkoutLabel}>AMOUNT</Text>
              <Text style={styles.checkoutAmount}>{formatVND(order.amount)}</Text>

              <View style={styles.checkoutDivider} />

              <View style={styles.checkoutDetails}>
                <View style={styles.checkoutDetailRow}>
                  <Text style={styles.checkoutDetailLabel}>Order ID</Text>
                  <Text style={styles.checkoutDetailValue}>
                    {order.id.slice(0, 8)}...
                  </Text>
                </View>
                <View style={styles.checkoutDetailRow}>
                  <Text style={styles.checkoutDetailLabel}>Type</Text>
                  <Text style={styles.checkoutDetailValue}>{order.type}</Text>
                </View>
                <View style={styles.checkoutDetailRow}>
                  <Text style={styles.checkoutDetailLabel}>Your Balance</Text>
                  <Text style={styles.checkoutDetailValue}>
                    {formatVND(balance)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  balance < order.amount && styles.confirmBtnDisabled,
                ]}
                onPress={() => setScreen('pin')}
                disabled={balance < order.amount}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>
                  {balance < order.amount
                    ? 'Insufficient Balance'
                    : 'Confirm Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* ═══════════ PIN SCREEN ═══════════ */}
      {screen === 'pin' && (
        <PinPad
          onComplete={handlePinComplete}
          onCancel={() => setScreen('checkout')}
        />
      )}

      {/* ═══════════ RESULT SCREEN ═══════════ */}
      {screen === 'result' && txResult && order && (
        <PaymentResult
          success={txResult.success}
          amount={order.amount}
          merchantName={order.merchantName}
          newBalance={txResult.newBalance}
          pointsEarned={txResult.pointsEarned}
          errorMessage={txError}
          onDone={handleDone}
        />
      )}
    </SafeAreaProvider>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },

  // ── Home ──────────────────────────────────────────────
  homeContainer: {
    flex: 1,
    padding: 20,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#9ca3af',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Balance Card ──────────────────────────────────────
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  balanceGradient: {
    padding: 28,
    backgroundColor: '#1a1f3a',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#f9fafb',
    letterSpacing: -1,
    marginBottom: 16,
  },
  balanceMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  balanceMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceMetaIcon: {
    fontSize: 14,
  },
  balanceMetaText: {
    fontSize: 13,
    color: '#9ca3af',
  },

  // ── Quick Actions ─────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconAlt: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  actionIconAlt2: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  actionIconText: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },

  // ── Recent Activity ───────────────────────────────────
  recentSection: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 16,
  },
  emptyActivity: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    maxWidth: 240,
  },

  // ── Loading ───────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },

  // ── Scanner ───────────────────────────────────────────
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 80,
  },
  scannerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 12,
  },
  scannerBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  scannerBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#6366f1',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
    borderTopLeftRadius: 8,
  },
  scannerCornerTR: {
    borderTopWidth: 3,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    left: undefined,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
  },
  scannerCornerBL: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    top: undefined,
    bottom: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 8,
  },
  scannerCornerBR: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 8,
  },
  scannerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#6366f1',
    top: '50%',
    opacity: 0.6,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Checkout ──────────────────────────────────────────
  checkoutContainer: {
    flex: 1,
    padding: 20,
  },
  checkoutBackBtn: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  checkoutBackText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  checkoutCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  merchantAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },
  checkoutMerchant: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 24,
  },
  checkoutLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  checkoutAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#f9fafb',
    letterSpacing: -1,
    marginBottom: 24,
  },
  checkoutDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  checkoutDetails: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
  },
  checkoutDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkoutDetailLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  checkoutDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f9fafb',
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
