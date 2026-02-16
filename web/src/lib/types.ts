// ===== Firestore Document Types =====

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    bankName: string;
    accountNumber: string;
    createdAt: string;
}

export interface Wallet {
    userId: string;
    displayName: string;
    balance: number;
    points: number;
    currency: 'VND';
    accountNumber: string;
    bankName: string;
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
    type: 'payment' | 'reward' | 'p2p';
    message?: string;
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

export interface RegisterRequest {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    bankName: string;
}

export interface RegisterResponse {
    success: boolean;
    user: UserProfile;
    wallet: {
        balance: number;
        accountNumber: string;
    };
}

export interface P2PTransferRequest {
    senderUid: string;
    receiverAccountNumber: string;
    amount: number;
    message?: string;
}

export interface P2PTransferResponse {
    success: boolean;
    message: string;
    newBalance?: number;
    receiverName?: string;
}

// ===== QR Code Payload =====

export interface QRPayload {
    orderId: string;
    action: 'pay';
}

// ===== Product Types =====

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    emoji: string;
}

export interface CartItem extends Product {
    quantity: number;
}

// ===== Bank List =====

export const BANK_LIST = [
    'Techcombank',
    'MBBank',
    'Vietcombank',
    'VPBank',
    'ACB',
    'Sacombank',
    'TPBank',
    'BIDV',
] as const;

export type BankName = (typeof BANK_LIST)[number];
