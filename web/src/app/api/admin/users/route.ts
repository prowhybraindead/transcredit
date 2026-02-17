import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(_req: NextRequest) {
    try {
        const { db } = getFirebaseAdmin();

        // Fetch all users
        const usersSnap = await db.collection('users').get();
        const users: any[] = [];

        for (const doc of usersSnap.docs) {
            const user = doc.data();
            // Fetch matching wallet
            const walletSnap = await db.collection('wallets').doc(doc.id).get();
            const wallet = walletSnap.exists ? walletSnap.data() : null;

            users.push({
                uid: doc.id,
                email: user.email || '',
                displayName: user.displayName || '',
                phoneNumber: user.phoneNumber || '',
                bankName: user.bankName || wallet?.bankName || '',
                accountNumber: user.accountNumber || wallet?.accountNumber || '',
                balance: wallet?.balance ?? 0,
                points: wallet?.points ?? 0,
                currency: wallet?.currency || 'VND',
                createdAt: user.createdAt || '',
            });
        }

        // Sort by creation date descending
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        console.error('Admin users error:', error);
        return NextResponse.json(
            { success: false, message: error?.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
