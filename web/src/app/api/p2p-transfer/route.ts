import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { P2PTransferRequest, P2PTransferResponse, LedgerLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/p2p-transfer
 *
 * Atomic peer-to-peer transfer. Finds receiver by account number,
 * validates balance, and transfers funds in a single Firestore transaction.
 */
export async function POST(request: NextRequest) {
    try {
        const body: P2PTransferRequest = await request.json();
        const { senderUid, receiverAccountNumber, amount, message } = body;

        // ── Validation ────────────────────────────────────────
        if (!senderUid || !receiverAccountNumber || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields: senderUid, receiverAccountNumber, amount' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            );
        }

        const { db } = getFirebaseAdmin();

        // ── Find receiver by account number ───────────────────
        const receiverQuery = await db
            .collection('wallets')
            .where('accountNumber', '==', receiverAccountNumber)
            .limit(1)
            .get();

        if (receiverQuery.empty) {
            return NextResponse.json(
                { success: false, message: 'Receiver account not found' },
                { status: 404 }
            );
        }

        const receiverDoc = receiverQuery.docs[0];
        const receiverUid = receiverDoc.id;

        // ── Prevent self-transfer ─────────────────────────────
        if (receiverUid === senderUid) {
            return NextResponse.json(
                { success: false, message: 'Cannot transfer to your own account' },
                { status: 400 }
            );
        }

        // ── Atomic transaction ────────────────────────────────
        const senderWalletRef = db.collection('wallets').doc(senderUid);
        const receiverWalletRef = db.collection('wallets').doc(receiverUid);

        const result = await db.runTransaction(async (transaction) => {
            const senderWalletDoc = await transaction.get(senderWalletRef);
            const receiverWalletDoc = await transaction.get(receiverWalletRef);

            if (!senderWalletDoc.exists) {
                throw new TransferError('SENDER_NOT_FOUND', 'Sender wallet not found', 404);
            }
            if (!receiverWalletDoc.exists) {
                throw new TransferError('RECEIVER_NOT_FOUND', 'Receiver wallet not found', 404);
            }

            const senderWallet = senderWalletDoc.data()!;
            const receiverWallet = receiverWalletDoc.data()!;

            if (senderWallet.balance < amount) {
                throw new TransferError(
                    'INSUFFICIENT_FUNDS',
                    `Insufficient funds. Balance: ${senderWallet.balance.toLocaleString()} VND`,
                    402
                );
            }

            const now = new Date().toISOString();

            // Decrement sender
            transaction.update(senderWalletRef, {
                balance: senderWallet.balance - amount,
            });

            // Increment receiver
            transaction.update(receiverWalletRef, {
                balance: receiverWallet.balance + amount,
            });

            // Create ledger log
            const ledgerLogId = uuidv4();
            const ledgerLog: LedgerLog = {
                id: ledgerLogId,
                orderId: `p2p-${ledgerLogId.slice(0, 8)}`,
                fromWallet: senderUid,
                toWallet: receiverUid,
                amount,
                type: 'p2p',
                message: message || '',
                timestamp: now,
            };
            transaction.set(db.collection('ledger_logs').doc(ledgerLogId), ledgerLog);

            return {
                newBalance: senderWallet.balance - amount,
                receiverName: receiverWallet.displayName,
            };
        });

        const response: P2PTransferResponse = {
            success: true,
            message: `Successfully transferred ₫${amount.toLocaleString()} to ${result.receiverName}`,
            newBalance: result.newBalance,
            receiverName: result.receiverName,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        if (error instanceof TransferError) {
            return NextResponse.json(
                { success: false, error: error.code, message: error.message },
                { status: error.httpStatus }
            );
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error('[p2p-transfer] Error:', message);
        return NextResponse.json(
            { success: false, error: 'INTERNAL_ERROR', message },
            { status: 500 }
        );
    }
}

class TransferError extends Error {
    code: string;
    httpStatus: number;
    constructor(code: string, message: string, httpStatus: number) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }
}
