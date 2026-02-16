import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { CreateOrderRequest, CreateOrderResponse, Order } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body: CreateOrderRequest = await request.json();
        const { merchantId, amount, type } = body;

        // ── Validation ────────────────────────────────────────
        if (!merchantId || !amount || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: merchantId, amount, type' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            );
        }

        if (!['payment', 'reward'].includes(type)) {
            return NextResponse.json(
                { error: 'Type must be "payment" or "reward"' },
                { status: 400 }
            );
        }

        // ── Fetch merchant info ───────────────────────────────
        const { db } = getFirebaseAdmin();
        const merchantWalletRef = db.collection('wallets').doc(merchantId);
        const merchantWallet = await merchantWalletRef.get();

        if (!merchantWallet.exists) {
            return NextResponse.json(
                { error: 'Merchant not found' },
                { status: 404 }
            );
        }

        const merchantData = merchantWallet.data()!;

        // ── Create order ──────────────────────────────────────
        const orderId = uuidv4();
        const order: Order = {
            id: orderId,
            merchantId,
            merchantName: merchantData.displayName || 'Unknown Merchant',
            amount,
            type,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };

        await db.collection('orders').doc(orderId).set(order);

        const response: CreateOrderResponse = {
            orderId,
            status: 'PENDING',
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        console.error('[create-order] Error:', message, stack);
        return NextResponse.json(
            { error: message, stack: process.env.NODE_ENV === 'development' ? stack : undefined },
            { status: 500 }
        );
    }
}
