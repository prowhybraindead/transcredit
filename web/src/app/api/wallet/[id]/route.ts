import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/wallet/[id]
 * Returns wallet info for a user by their UID.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { db } = getFirebaseAdmin();
        const walletDoc = await db.collection('wallets').doc(id).get();

        if (!walletDoc.exists) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        const wallet = walletDoc.data()!;
        return NextResponse.json({
            balance: wallet.balance,
            accountNumber: wallet.accountNumber || '',
            bankName: wallet.bankName || '',
            displayName: wallet.displayName || '',
            points: wallet.points || 0,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[wallet] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
