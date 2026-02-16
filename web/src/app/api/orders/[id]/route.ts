import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const { db } = getFirebaseAdmin();
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const order = orderDoc.data();

        return NextResponse.json({
            id: order!.id,
            merchantId: order!.merchantId,
            merchantName: order!.merchantName,
            amount: order!.amount,
            type: order!.type,
            status: order!.status,
            createdAt: order!.createdAt,
            completedAt: order!.completedAt || null,
        });
    } catch (error) {
        console.error('[orders/id] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
