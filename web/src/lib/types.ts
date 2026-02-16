// ===== Firestore Document Types =====

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

export interface LedgerLog {
    id: string;
    orderId: string;
    fromWallet: string;
    toWallet: string;
    amount: number;
    type: 'payment' | 'reward';
    timestamp: string;
}

// ===== API Request / Response types =====

export interface CreateOrderRequest {
    merchantId: string;
    amount: number;
    type: 'payment' | 'reward';
}

export interface CreateOrderResponse {
    orderId: string;
    status: 'PENDING';
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

// ===== QR Code Payload =====

export interface QRPayload {
    orderId: string;
    action: 'pay';
}
