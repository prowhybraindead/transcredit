import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Modal,
    ActivityIndicator,
    Alert,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { AdminUser } from '../lib/types';
import * as Haptics from 'expo-haptics';

interface AdminScreenProps {
    onBack: () => void;
}

export default function AdminScreen({ onBack }: AdminScreenProps) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const data = await api.getAdminUsers();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (e: any) {
            console.error('[Admin] Fetch users error:', e);
            Alert.alert('Error', e?.message || 'Failed to load users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const filteredUsers = users.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.displayName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.accountNumber.includes(q) ||
            u.phoneNumber.includes(q)
        );
    });

    const handleAdjust = async (amount: number) => {
        if (!selectedUser) return;
        setAdjusting(true);
        try {
            const result = await api.adjustBalance({
                targetUid: selectedUser.uid,
                amount,
                reason: adjustReason || undefined,
            });
            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('✅ Success', result.message);
                // Update local state
                setUsers((prev) =>
                    prev.map((u) =>
                        u.uid === selectedUser.uid
                            ? { ...u, balance: result.newBalance ?? u.balance }
                            : u
                    )
                );
                setSelectedUser((prev) =>
                    prev ? { ...prev, balance: result.newBalance ?? prev.balance } : null
                );
                setAdjustAmount('');
                setAdjustReason('');
            }
        } catch (e: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('❌ Error', e?.message || 'Adjustment failed');
        } finally {
            setAdjusting(false);
        }
    };

    const handleCustomAdjust = () => {
        const num = parseInt(adjustAmount.replace(/[^0-9-]/g, ''), 10);
        if (isNaN(num) || num === 0) {
            Alert.alert('Invalid', 'Enter a non-zero amount');
            return;
        }
        handleAdjust(num);
    };

    const formatVND = (n: number) => `₫${n.toLocaleString('vi-VN')}`;

    const renderUserCard = ({ item }: { item: AdminUser }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => {
                setSelectedUser(item);
                setAdjustAmount('');
                setAdjustReason('');
            }}
            activeOpacity={0.7}
        >
            <View style={styles.userCardLeft}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.displayName || 'No Name'}</Text>
                    <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
                    <Text style={styles.userBank}>
                        {item.bankName} • {item.accountNumber}
                    </Text>
                </View>
            </View>
            <View style={styles.userCardRight}>
                <Text style={styles.userBalance}>{formatVND(item.balance)}</Text>
                <Text style={styles.userPoints}>🏆 {item.points} pts</Text>
            </View>
        </TouchableOpacity>
    );

    // ── Loading ───────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.center}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🛡️ Admin Console</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Stats Bar */}
                <View style={styles.statsBar}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{users.length}</Text>
                        <Text style={styles.statLabel}>Users</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>
                            {formatVND(users.reduce((sum, u) => sum + u.balance, 0))}
                        </Text>
                        <Text style={styles.statLabel}>Total Balance</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name, email, account..."
                        placeholderTextColor="#475569"
                    />
                </View>

                {/* User List */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderUserCard}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#6366f1"
                            colors={['#6366f1']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {search ? 'No users match your search' : 'No users found'}
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* ── User Detail Modal ─────────────────────────── */}
            <Modal
                visible={!!selectedUser}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedUser(null)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {selectedUser && (
                                <>
                                    {/* Modal Header */}
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>User Details</Text>
                                        <TouchableOpacity
                                            onPress={() => setSelectedUser(null)}
                                        >
                                            <Text style={styles.modalClose}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Profile Info */}
                                    <View style={styles.profileSection}>
                                        <View style={styles.profileAvatar}>
                                            <Text style={styles.profileAvatarText}>
                                                {selectedUser.displayName?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <Text style={styles.profileName}>
                                            {selectedUser.displayName}
                                        </Text>
                                        <Text style={styles.profileEmail}>
                                            {selectedUser.email}
                                        </Text>
                                    </View>

                                    {/* Info Grid */}
                                    <View style={styles.infoGrid}>
                                        <InfoRow label="Phone" value={selectedUser.phoneNumber} />
                                        <InfoRow label="Bank" value={selectedUser.bankName} />
                                        <InfoRow label="Account" value={selectedUser.accountNumber} />
                                        <InfoRow label="Balance" value={formatVND(selectedUser.balance)} highlight />
                                        <InfoRow label="Points" value={`🏆 ${selectedUser.points}`} />
                                        <InfoRow label="UID" value={selectedUser.uid.slice(0, 16) + '...'} />
                                    </View>

                                    {/* Quick Top-up Buttons */}
                                    <Text style={styles.sectionLabel}>Quick Top-up</Text>
                                    <View style={styles.quickBtns}>
                                        {[1000000, 5000000, 10000000].map((amt) => (
                                            <TouchableOpacity
                                                key={amt}
                                                style={[styles.quickBtn, adjusting && styles.disabled]}
                                                onPress={() => handleAdjust(amt)}
                                                disabled={adjusting}
                                            >
                                                <Text style={styles.quickBtnText}>
                                                    +{formatVND(amt)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Custom Adjustment */}
                                    <Text style={styles.sectionLabel}>Custom Adjustment</Text>
                                    <TextInput
                                        style={styles.adjustInput}
                                        value={adjustAmount}
                                        onChangeText={setAdjustAmount}
                                        placeholder="Amount (e.g. 500000 or -200000)"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                    />
                                    <TextInput
                                        style={styles.adjustInput}
                                        value={adjustReason}
                                        onChangeText={setAdjustReason}
                                        placeholder="Reason (optional)"
                                        placeholderTextColor="#475569"
                                    />
                                    <TouchableOpacity
                                        style={[styles.adjustBtn, adjusting && styles.disabled]}
                                        onPress={handleCustomAdjust}
                                        disabled={adjusting}
                                    >
                                        {adjusting ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.adjustBtnText}>
                                                Apply Adjustment
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

// ── Helper Component ──────────────────────────────────────
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, highlight && { color: '#22c55e', fontWeight: '700' }]}>
                {value}
            </Text>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0e17' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#94a3b8', marginTop: 12 },
    content: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { paddingVertical: 4, paddingRight: 8 },
    backText: { color: '#6366f1', fontSize: 15, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },

    // Stats
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        marginHorizontal: 16,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
    statLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
    statDivider: { width: 1, backgroundColor: '#1e293b', marginHorizontal: 12 },

    // Search
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        marginHorizontal: 16,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#f1f5f9' },

    // User List
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    userCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#6366f120',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#6366f1' },
    userInfo: { flex: 1 },
    userName: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
    userEmail: { fontSize: 12, color: '#64748b', marginTop: 1 },
    userBank: { fontSize: 11, color: '#475569', marginTop: 1 },
    userCardRight: { alignItems: 'flex-end' },
    userBalance: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
    userPoints: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
    empty: { alignItems: 'center', paddingTop: 40 },
    emptyText: { color: '#64748b', fontSize: 14 },

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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
    modalClose: { fontSize: 22, color: '#94a3b8', fontWeight: '600' },

    // Profile
    profileSection: { alignItems: 'center', marginBottom: 20 },
    profileAvatar: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    profileAvatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
    profileName: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
    profileEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },

    // Info Grid
    infoGrid: {
        backgroundColor: '#0a0e17',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    infoValue: { fontSize: 13, color: '#f1f5f9', fontWeight: '500' },

    // Quick Buttons
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    quickBtns: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    quickBtn: {
        flex: 1,
        backgroundColor: '#22c55e15',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22c55e30',
    },
    quickBtnText: { fontSize: 13, fontWeight: '700', color: '#22c55e' },

    // Custom Adjust
    adjustInput: {
        backgroundColor: '#0a0e17',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#f1f5f9',
        marginBottom: 10,
    },
    adjustBtn: {
        backgroundColor: '#6366f1',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    adjustBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    disabled: { opacity: 0.5 },
});
