import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/customers
 * Admin view — returns all users with their wallet balances.
 */
export async function GET() {
    try {
        const { db } = getFirebaseAdmin();

        const usersSnapshot = await db.collection('users').get();
        const customers = [];

        for (const doc of usersSnapshot.docs) {
            const user = doc.data();
            // Fetch wallet balance
            const walletDoc = await db.collection('wallets').doc(doc.id).get();
            const wallet = walletDoc.exists ? walletDoc.data() : null;

            customers.push({
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                bankName: user.bankName,
                accountNumber: user.accountNumber,
                balance: wallet?.balance || 0,
                points: wallet?.points || 0,
                createdAt: user.createdAt,
            });
        }

        return NextResponse.json({ customers });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[customers] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
