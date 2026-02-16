import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Wallet, UserProfile } from '@/lib/types';

/**
 * POST /api/seed
 * Dev helper: creates sample wallets and user profiles for testing.
 */
export async function POST() {
    try {
        const { db } = getFirebaseAdmin();
        const batch = db.batch();
        const now = new Date().toISOString();

        // ── Merchant ──────────────────────────────────────────
        const merchantWallet: Wallet = {
            userId: 'merchant-001',
            displayName: 'TransCredit Coffee',
            balance: 0,
            points: 0,
            currency: 'VND',
            accountNumber: '1000000001',
            bankName: 'Techcombank',
            createdAt: now,
        };
        batch.set(db.collection('wallets').doc('merchant-001'), merchantWallet, { merge: true });

        const merchantUser: UserProfile = {
            uid: 'merchant-001',
            email: 'merchant@transcredit.vn',
            displayName: 'TransCredit Coffee',
            phoneNumber: '0901000001',
            bankName: 'Techcombank',
            accountNumber: '1000000001',
            createdAt: now,
        };
        batch.set(db.collection('users').doc('merchant-001'), merchantUser, { merge: true });

        // ── User 1 ────────────────────────────────────────────
        const user1Wallet: Wallet = {
            userId: 'user-001',
            displayName: 'Nguyen Van A',
            balance: 5_000_000,
            points: 0,
            currency: 'VND',
            accountNumber: '1000000002',
            bankName: 'MBBank',
            createdAt: now,
        };
        batch.set(db.collection('wallets').doc('user-001'), user1Wallet, { merge: true });

        const user1Profile: UserProfile = {
            uid: 'user-001',
            email: 'nguyenvana@example.com',
            displayName: 'Nguyen Van A',
            phoneNumber: '0901000002',
            bankName: 'MBBank',
            accountNumber: '1000000002',
            createdAt: now,
        };
        batch.set(db.collection('users').doc('user-001'), user1Profile, { merge: true });

        // ── User 2 ────────────────────────────────────────────
        const user2Wallet: Wallet = {
            userId: 'user-002',
            displayName: 'Tran Thi B',
            balance: 2_000_000,
            points: 0,
            currency: 'VND',
            accountNumber: '1000000003',
            bankName: 'Vietcombank',
            createdAt: now,
        };
        batch.set(db.collection('wallets').doc('user-002'), user2Wallet, { merge: true });

        const user2Profile: UserProfile = {
            uid: 'user-002',
            email: 'tranthib@example.com',
            displayName: 'Tran Thi B',
            phoneNumber: '0901000003',
            bankName: 'Vietcombank',
            accountNumber: '1000000003',
            createdAt: now,
        };
        batch.set(db.collection('users').doc('user-002'), user2Profile, { merge: true });

        await batch.commit();

        return NextResponse.json({
            message: 'Seed data created successfully',
            wallets: [
                { userId: 'merchant-001', displayName: 'TransCredit Coffee', balance: 0, accountNumber: '1000000001' },
                { userId: 'user-001', displayName: 'Nguyen Van A', balance: 5_000_000, accountNumber: '1000000002' },
                { userId: 'user-002', displayName: 'Tran Thi B', balance: 2_000_000, accountNumber: '1000000003' },
            ],
        });
    } catch (error) {
        console.error('[seed] Error:', error);
        return NextResponse.json({ error: 'Failed to create seed data' }, { status: 500 });
    }
}
