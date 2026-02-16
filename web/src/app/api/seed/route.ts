import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Wallet } from '@/lib/types';

/**
 * POST /api/seed
 *
 * Dev helper: creates sample wallets for testing the payment flow.
 * Creates:
 *   - merchant-001: "TransCredit Coffee" with 0 VND (merchant starts at 0)
 *   - user-001: "Nguyen Van A" with 5,000,000 VND
 *   - user-002: "Tran Thi B" with 2,000,000 VND
 */
export async function POST() {
    try {
        const { db } = getFirebaseAdmin();
        const batch = db.batch();

        const seedWallets: Wallet[] = [
            {
                userId: 'merchant-001',
                displayName: 'TransCredit Coffee',
                balance: 0,
                points: 0,
                currency: 'VND',
                createdAt: new Date().toISOString(),
            },
            {
                userId: 'user-001',
                displayName: 'Nguyen Van A',
                balance: 5_000_000,
                points: 0,
                currency: 'VND',
                createdAt: new Date().toISOString(),
            },
            {
                userId: 'user-002',
                displayName: 'Tran Thi B',
                balance: 2_000_000,
                points: 0,
                currency: 'VND',
                createdAt: new Date().toISOString(),
            },
        ];

        for (const wallet of seedWallets) {
            const ref = db.collection('wallets').doc(wallet.userId);
            batch.set(ref, wallet, { merge: true });
        }

        await batch.commit();

        return NextResponse.json({
            message: 'Seed data created successfully',
            wallets: seedWallets.map((w) => ({
                userId: w.userId,
                displayName: w.displayName,
                balance: w.balance,
            })),
        });
    } catch (error) {
        console.error('[seed] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create seed data' },
            { status: 500 }
        );
    }
}
