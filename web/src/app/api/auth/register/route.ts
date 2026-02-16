import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { RegisterRequest, RegisterResponse, UserProfile, Wallet } from '@/lib/types';

function generateAccountNumber(): string {
    // Generate a 10-digit fake account number
    const prefix = '10'; // TransCredit prefix
    const random = Math.floor(Math.random() * 100_000_000)
        .toString()
        .padStart(8, '0');
    return prefix + random;
}

export async function POST(request: NextRequest) {
    try {
        const body: RegisterRequest = await request.json();
        const { uid, email, displayName, phoneNumber, bankName } = body;

        // ── Validation ────────────────────────────────────────
        if (!uid || !email || !displayName || !phoneNumber || !bankName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { db } = getFirebaseAdmin();

        // ── Check if user already exists ──────────────────────
        const existingUser = await db.collection('users').doc(uid).get();
        if (existingUser.exists) {
            const userData = existingUser.data() as UserProfile;
            const walletDoc = await db.collection('wallets').doc(uid).get();
            const walletData = walletDoc.data();
            return NextResponse.json({
                success: true,
                user: userData,
                wallet: {
                    balance: walletData?.balance || 0,
                    accountNumber: userData.accountNumber,
                },
            });
        }

        // ── Generate account number (unique) ──────────────────
        let accountNumber = generateAccountNumber();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await db
                .collection('wallets')
                .where('accountNumber', '==', accountNumber)
                .limit(1)
                .get();
            if (existing.empty) break;
            accountNumber = generateAccountNumber();
            attempts++;
        }

        const now = new Date().toISOString();

        // ── Create user profile ───────────────────────────────
        const userProfile: UserProfile = {
            uid,
            email,
            displayName,
            phoneNumber,
            bankName,
            accountNumber,
            createdAt: now,
        };

        // ── Create wallet with starting balance ───────────────
        const STARTING_BALANCE = 5_000_000; // 5M VND
        const wallet: Wallet = {
            userId: uid,
            displayName,
            balance: STARTING_BALANCE,
            points: 0,
            currency: 'VND',
            accountNumber,
            bankName,
            createdAt: now,
        };

        // ── Batch write ───────────────────────────────────────
        const batch = db.batch();
        batch.set(db.collection('users').doc(uid), userProfile);
        batch.set(db.collection('wallets').doc(uid), wallet);
        await batch.commit();

        const response: RegisterResponse = {
            success: true,
            user: userProfile,
            wallet: {
                balance: STARTING_BALANCE,
                accountNumber,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[auth/register] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
