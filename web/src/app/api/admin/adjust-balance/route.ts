import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { db } = getFirebaseAdmin();
        const body = await req.json();
        const { targetUid, amount, reason } = body;

        if (!targetUid || amount === undefined || amount === 0) {
            return NextResponse.json(
                { success: false, message: 'targetUid and non-zero amount are required' },
                { status: 400 }
            );
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return NextResponse.json(
                { success: false, message: 'amount must be a number' },
                { status: 400 }
            );
        }

        // Atomic balance adjustment
        const result = await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
            const walletRef = db.collection('wallets').doc(targetUid);
            const walletSnap = await tx.get(walletRef);

            if (!walletSnap.exists) {
                throw new Error('Wallet not found for this user');
            }

            const wallet = walletSnap.data()!;
            const currentBalance = wallet.balance || 0;
            const newBalance = currentBalance + numAmount;

            if (newBalance < 0) {
                throw new Error(`Insufficient balance. Current: ₫${currentBalance.toLocaleString()}, Adjustment: ₫${numAmount.toLocaleString()}`);
            }

            // Update wallet balance
            tx.update(walletRef, { balance: newBalance });

            // Log to ledger
            const logRef = db.collection('ledger_logs').doc();
            tx.set(logRef, {
                id: logRef.id,
                orderId: `admin-${Date.now()}`,
                fromWallet: numAmount > 0 ? 'SYSTEM' : targetUid,
                toWallet: numAmount > 0 ? targetUid : 'SYSTEM',
                amount: Math.abs(numAmount),
                type: 'admin_adjustment',
                message: reason || `Admin balance adjustment: ${numAmount > 0 ? '+' : ''}₫${numAmount.toLocaleString()}`,
                timestamp: new Date().toISOString(),
            });

            return { newBalance, previousBalance: currentBalance };
        });

        return NextResponse.json({
            success: true,
            message: `Balance adjusted by ₫${numAmount.toLocaleString()}`,
            newBalance: result.newBalance,
            previousBalance: result.previousBalance,
        });
    } catch (error: any) {
        console.error('Admin adjust-balance error:', error);
        const status = error?.message?.includes('not found') ? 404 : 500;
        return NextResponse.json(
            { success: false, message: error?.message || 'Failed to adjust balance' },
            { status }
        );
    }
}
