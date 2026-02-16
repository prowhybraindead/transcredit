// ===== Mirrors the web/src/lib/types.ts =====

export interface Wallet {
    userId: string;
    displayName: string;
    balance: number;
    points: number;
    currency: 'VND';
    createdAt: string;
}

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

export interface QRPayload {
    orderId: string;
    action: 'pay';
}
