import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './lib/api';
import { Order, WalletData } from './lib/types';
import PinPad from './components/PinPad';
import PaymentResult from './components/PaymentResult';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import TransferScreen from './screens/TransferScreen';
import AdminScreen from './screens/AdminScreen';

// Admin email(s) — users with these emails see the Admin console
const ADMIN_EMAILS = ['admin@transcredit.com'];

type Screen = 'loading' | 'auth' | 'onboarding' | 'home' | 'scan' | 'checkout' | 'pin' | 'result' | 'transfer' | 'admin';

const { width } = Dimensions.get('window');

export default function App() {
  // ── Auth state ────────────────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  // ── Screen state ──────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<{
    success: boolean;
    message: string;
    newBalance?: number;
    pointsEarned?: number;
  } | null>(null);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // ── Auth listener ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setScreen('auth');
        setWallet(null);
        setHasProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch wallet when user is authenticated ───────────
  useEffect(() => {
    if (!firebaseUser) return;
    fetchWallet(firebaseUser.uid);
  }, [firebaseUser]);

  const fetchWallet = async (uid: string) => {
    try {
      const data = await api.getWallet(uid);
      setWallet({ ...data, points: (data as any).points ?? 0 });
      setHasProfile(true);
      setScreen('home');
    } catch (e: any) {
      if (e?.status === 404) {
        setHasProfile(false);
        setScreen('onboarding');
      } else {
        console.log('Wallet fetch error:', e?.message);
        setHasProfile(false);
        setScreen('onboarding');
      }
    }
  };

  // ── Auth handlers ─────────────────────────────────────
  const handleAuthSuccess = (uid: string, email: string, isNewUser: boolean) => {
    if (isNewUser) {
      setScreen('onboarding');
    }
    // The onAuthStateChanged listener will handle the rest
  };

  const handleOnboardingComplete = (profile: {
    displayName: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    balance: number;
  }) => {
    setWallet({
      displayName: profile.displayName,
      balance: profile.balance,
      accountNumber: profile.accountNumber,
      bankName: profile.bankName,
      points: 0,
    });
    setHasProfile(true);
    setScreen('home');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // ── QR Scan ───────────────────────────────────────────
  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || loading) return;
      setScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoading(true);

      try {
        const parsed = JSON.parse(data);
        if (!parsed.orderId) throw new Error('Invalid QR');
        const orderData = await api.getOrder(parsed.orderId);
        setOrder(orderData);
        setScreen('checkout');
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Could not read QR code');
        setScanned(false);
      } finally {
        setLoading(false);
      }
    },
    [scanned, loading]
  );

  // ── PIN complete → execute transaction ────────────────
  const handlePinComplete = async (_pin: string) => {
    if (!order || !firebaseUser) return;
    setLoading(true);
    try {
      const result = await api.executeTransaction({
        orderId: order.id,
        userId: firebaseUser.uid,
      });
      setTxResult({
        success: result.status === 'COMPLETED',
        message: result.message,
        newBalance: result.newBalance,
        pointsEarned: result.pointsEarned,
      });
      if (result.newBalance !== undefined && wallet) {
        setWallet({ ...wallet, balance: result.newBalance });
      }
      setScreen('result');
    } catch (error: any) {
      setTxResult({
        success: false,
        message: error?.message || 'Transaction failed',
      });
      setScreen('result');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────
  const resetToHome = () => {
    setOrder(null);
    setTxResult(null);
    setScanned(false);
    setScreen('home');
  };

  // ── Loading ───────────────────────────────────────────
  if (authLoading || screen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>TC</Text>
        </View>
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ── Auth Screen ───────────────────────────────────────
  if (screen === 'auth' || !firebaseUser) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </SafeAreaProvider>
    );
  }

  // ── Onboarding ────────────────────────────────────────
  if (screen === 'onboarding' && firebaseUser) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen
          uid={firebaseUser.uid}
          email={firebaseUser.email || ''}
          onComplete={handleOnboardingComplete}
        />
      </SafeAreaProvider>
    );
  }

  // ── Transfer Screen ───────────────────────────────────
  if (screen === 'transfer') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TransferScreen
          userUid={firebaseUser.uid}
          currentBalance={wallet?.balance || 0}
          onBack={resetToHome}
          onSuccess={(newBalance) => {
            if (wallet) setWallet({ ...wallet, balance: newBalance });
            resetToHome();
          }}
        />
      </SafeAreaProvider>
    );
  }

  // ── Admin Screen ──────────────────────────────────────
  if (screen === 'admin') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AdminScreen onBack={resetToHome} />
      </SafeAreaProvider>
    );
  }

  // ── Scanner ───────────────────────────────────────────
  if (screen === 'scan') {
    if (!permission?.granted) {
      return (
        <SafeAreaProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.centerContent}>
              <Text style={styles.permTitle}>📷 Camera Permission</Text>
              <Text style={styles.permText}>
                We need camera access to scan payment QR codes
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
                <Text style={styles.primaryBtnText}>Grant Permission</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetToHome} style={{ marginTop: 16 }}>
                <Text style={styles.linkText}>← Back to Home</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      );
    }

    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          {/* Overlay */}
          <View style={styles.scanOverlay}>
            <SafeAreaView style={styles.scanHeader}>
              <TouchableOpacity onPress={resetToHome}>
                <Text style={styles.scanClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.scanTitle}>Scan QR Code</Text>
              <View style={{ width: 32 }} />
            </SafeAreaView>
            <View style={styles.scanFrame}>
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
            </View>
            <Text style={styles.scanHint}>
              Point camera at the merchant's QR code
            </Text>
          </View>
          {loading && (
            <View style={styles.scanLoading}>
              <ActivityIndicator color="#6366f1" size="large" />
              <Text style={styles.scanLoadingText}>Reading QR...</Text>
            </View>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Checkout ──────────────────────────────────────────
  if (screen === 'checkout' && order) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <SafeAreaView style={styles.checkoutContainer}>
            <Text style={styles.checkoutLabel}>PAYMENT REQUEST</Text>
            <View style={styles.checkoutCard}>
              <Text style={styles.merchantName}>{order.merchantName}</Text>
              <Text style={styles.checkoutAmount}>
                ₫{order.amount.toLocaleString('vi-VN')}
              </Text>
              <View style={styles.divider} />
              <View style={styles.checkoutRow}>
                <Text style={styles.rowLabel}>Order ID</Text>
                <Text style={styles.rowValue}>{order.id.slice(0, 12)}...</Text>
              </View>
              <View style={styles.checkoutRow}>
                <Text style={styles.rowLabel}>Your Balance</Text>
                <Text style={[styles.rowValue, { color: '#22c55e' }]}>
                  ₫{(wallet?.balance || 0).toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>

            <View style={styles.checkoutActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setScreen('pin')}
              >
                <Text style={styles.primaryBtnText}>Confirm Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetToHome} style={{ marginTop: 12 }}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    );
  }

  // ── PIN ───────────────────────────────────────────────
  if (screen === 'pin') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <PinPad
            onComplete={handlePinComplete}
            onCancel={resetToHome}
            loading={loading}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Result ────────────────────────────────────────────
  if (screen === 'result' && txResult) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <PaymentResult
            success={txResult.success}
            message={txResult.message}
            amount={order?.amount || 0}
            newBalance={txResult.newBalance}
            pointsEarned={txResult.pointsEarned}
            onDone={resetToHome}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  // ── Home Screen ───────────────────────────────────────
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.homeContainer}>
          {/* Header */}
          <View style={styles.homeHeader}>
            <View>
              <Text style={styles.greeting}>
                Hello, {wallet?.displayName || 'User'} 👋
              </Text>
              <Text style={styles.accountInfo}>
                {wallet?.bankName} • {wallet?.accountNumber}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceAmount}>
              ₫{(wallet?.balance || 0).toLocaleString('vi-VN')}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>
                  🏆 {wallet?.points || 0} points
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {
                setScanned(false);
                setScreen('scan');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#6366f120' }]}>
                <Text style={{ fontSize: 26 }}>📷</Text>
              </View>
              <Text style={styles.actionLabel}>Scan & Pay</Text>
              <Text style={styles.actionSub}>QR Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setScreen('transfer')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#22c55e20' }]}>
                <Text style={{ fontSize: 26 }}>💸</Text>
              </View>
              <Text style={styles.actionLabel}>Transfer</Text>
              <Text style={styles.actionSub}>P2P Transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
                <Text style={{ fontSize: 26 }}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>History</Text>
              <Text style={styles.actionSub}>Coming soon</Text>
            </TouchableOpacity>

            {ADMIN_EMAILS.includes(firebaseUser.email || '') && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => setScreen('admin')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
                  <Text style={{ fontSize: 26 }}>🛡️</Text>
                </View>
                <Text style={styles.actionLabel}>Admin</Text>
                <Text style={styles.actionSub}>Manage Users</Text>
              </TouchableOpacity>
            )}

            {!ADMIN_EMAILS.includes(firebaseUser.email || '') && (
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#a855f720' }]}>
                  <Text style={{ fontSize: 26 }}>🎁</Text>
                </View>
                <Text style={styles.actionLabel}>Rewards</Text>
                <Text style={styles.actionSub}>Coming soon</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Virtual Card */}
          <View style={styles.virtualCard}>
            <View style={styles.virtualCardHeader}>
              <Text style={styles.virtualCardBank}>{wallet?.bankName}</Text>
              <Text style={styles.virtualCardBrand}>TransCredit</Text>
            </View>
            <Text style={styles.virtualCardNumber}>
              {wallet?.accountNumber?.replace(/(\d{4})/g, '$1 ').trim()}
            </Text>
            <View style={styles.virtualCardFooter}>
              <View>
                <Text style={styles.virtualCardLabel}>CARDHOLDER</Text>
                <Text style={styles.virtualCardValue}>{wallet?.displayName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.virtualCardLabel}>STATUS</Text>
                <Text style={[styles.virtualCardValue, { color: '#22c55e' }]}>
                  Active
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e17',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  permText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  linkText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  accountInfo: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  logoutText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f1f5f9',
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  pointsBadge: {
    backgroundColor: '#f59e0b15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // ── Virtual Card ──────────────────────────────────────
  virtualCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#6366f130',
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  virtualCardBank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  virtualCardBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  virtualCardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    letterSpacing: 3,
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  virtualCardLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  virtualCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },

  // ── Scanner ───────────────────────────────────────────
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  scanClose: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scanCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#6366f1',
    borderTopLeftRadius: 12,
  },
  scanCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#6366f1',
    borderTopRightRadius: 12,
  },
  scanCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#6366f1',
    borderBottomLeftRadius: 12,
  },
  scanCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#6366f1',
    borderBottomRightRadius: 12,
  },
  scanHint: {
    fontSize: 14,
    color: '#ffffffcc',
    textAlign: 'center',
  },
  scanLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
  },

  // ── Checkout ──────────────────────────────────────────
  checkoutContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  checkoutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  checkoutCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    marginBottom: 32,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  checkoutAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 20,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#1e293b',
    marginBottom: 16,
  },
  checkoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  checkoutActions: {
    alignItems: 'center',
  },
});
