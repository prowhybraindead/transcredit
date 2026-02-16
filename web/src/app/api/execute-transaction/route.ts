import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import {
    ExecuteTransactionRequest,
    ExecuteTransactionResponse,
    LedgerLog,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/execute-transaction
 *
 * The CORE of the payment gateway. This executes an atomic Firestore
 * transaction that:
 *   1. Validates the order is still PENDING (prevents double-spend)
 *   2. Checks user has sufficient balance
 *   3. Decrements user wallet
 *   4. Increments merchant wallet
 *   5. Updates order status to COMPLETED
 *   6. Creates an immutable ledger log entry
 *
 * All of these happen inside a single Firestore runTransaction —
 * if ANY step fails, NOTHING is committed. This prevents race conditions.
 */
export async function POST(request: NextRequest) {
    try {
        const body: ExecuteTransactionRequest = await request.json();
        const { orderId, userId } = body;

        // ── Validation ────────────────────────────────────────
        if (!orderId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, userId' },
                { status: 400 }
            );
        }

        const { db } = getFirebaseAdmin();

        // ── Document references ───────────────────────────────
        const orderRef = db.collection('orders').doc(orderId);
        const userWalletRef = db.collection('wallets').doc(userId);

        // ── Atomic transaction ────────────────────────────────
        const result = await db.runTransaction(async (transaction) => {
            // ─── READ PHASE ─────────────────────────────────────
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) {
                throw new TransactionError('ORDER_NOT_FOUND', 'Order not found', 404);
            }

            const order = orderDoc.data()!;

            // Guard: prevent double-payment
            if (order.status !== 'PENDING') {
                throw new TransactionError(
                    'ORDER_ALREADY_PROCESSED',
                    `Order has already been ${order.status.toLowerCase()}`,
                    409
                );
            }

            const userWalletDoc = await transaction.get(userWalletRef);
            if (!userWalletDoc.exists) {
                throw new TransactionError(
                    'USER_WALLET_NOT_FOUND',
                    'User wallet not found',
                    404
                );
            }

            const userWallet = userWalletDoc.data()!;
            const merchantWalletRef = db.collection('wallets').doc(order.merchantId);
            const merchantWalletDoc = await transaction.get(merchantWalletRef);

            if (!merchantWalletDoc.exists) {
                throw new TransactionError(
                    'MERCHANT_WALLET_NOT_FOUND',
                    'Merchant wallet not found',
                    404
                );
            }

            const merchantWallet = merchantWalletDoc.data()!;
            const amount = order.amount;

            // Guard: insufficient funds
            if (userWallet.balance < amount) {
                throw new TransactionError(
                    'INSUFFICIENT_FUNDS',
                    `Insufficient funds. Balance: ${userWallet.balance.toLocaleString()} VND, Required: ${amount.toLocaleString()} VND`,
                    402
                );
            }

            // ─── WRITE PHASE ────────────────────────────────────
            // All writes happen AFTER all reads (Firestore requirement)

            const now = new Date().toISOString();

            // 1. Decrement user balance
            const newUserBalance = userWallet.balance - amount;
            transaction.update(userWalletRef, {
                balance: newUserBalance,
            });

            // 2. Increment merchant balance
            transaction.update(merchantWalletRef, {
                balance: merchantWallet.balance + amount,
            });

            // 3. Award loyalty points (1 point per 10,000 VND)
            const pointsEarned = Math.floor(amount / 10000);
            if (pointsEarned > 0) {
                transaction.update(userWalletRef, {
                    balance: newUserBalance,
                    points: (userWallet.points || 0) + pointsEarned,
                });
            }

            // 4. Update order status
            transaction.update(orderRef, {
                status: 'COMPLETED',
                userId,
                completedAt: now,
            });

            // 5. Create immutable ledger log
            const ledgerLogId = uuidv4();
            const ledgerLog: LedgerLog = {
                id: ledgerLogId,
                orderId,
                fromWallet: userId,
                toWallet: order.merchantId,
                amount,
                type: order.type,
                timestamp: now,
            };
            const ledgerRef = db.collection('ledger_logs').doc(ledgerLogId);
            transaction.set(ledgerRef, ledgerLog);

            return {
                newBalance: newUserBalance,
                pointsEarned,
            };
        });

        // ── Success response ──────────────────────────────────
        const response: ExecuteTransactionResponse = {
            success: true,
            orderId,
            status: 'COMPLETED',
            message: 'Payment completed successfully',
            newBalance: result.newBalance,
            pointsEarned: result.pointsEarned,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        // ── Structured error handling ──────────────────────────
        if (error instanceof TransactionError) {
            console.warn(`[execute-transaction] ${error.code}: ${error.message}`);
            return NextResponse.json(
                {
                    success: false,
                    error: error.code,
                    message: error.message,
                },
                { status: error.httpStatus }
            );
        }

        console.error('[execute-transaction] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again.',
            },
            { status: 500 }
        );
    }
}

// ── Custom error class for transaction failures ───────────
class TransactionError extends Error {
    code: string;
    httpStatus: number;

    constructor(code: string, message: string, httpStatus: number) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.name = 'TransactionError';
    }
}
