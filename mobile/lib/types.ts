// ── Mobile-side type definitions ──────────────────────

export interface Order {
    id: string;
    merchantId: string;
    merchantName: string;
    amount: number;
    type: 'payment' | 'reward';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    userId?: string;
    createdAt: string;
    completedAt?: string;
}

export interface ExecuteTransactionRequest {
    orderId: string;
    userId: string;
}

export interface ExecuteTransactionResponse {
    success: boolean;
    orderId: string;
    status: 'COMPLETED' | 'FAILED';
    message: string;
    newBalance?: number;
    pointsEarned?: number;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    createdAt: string;
}

export interface WalletData {
    balance: number;
    accountNumber: string;
    bankName: string;
    displayName: string;
    points: number;
}

// ── Admin Types ──────────────────────────────────────

export interface AdminUser {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    balance: number;
    points: number;
    currency: string;
    createdAt: string;
}

export interface AdjustBalanceRequest {
    targetUid: string;
    amount: number;
    reason?: string;
}

export interface AdjustBalanceResponse {
    success: boolean;
    message: string;
    newBalance?: number;
    previousBalance?: number;
}

