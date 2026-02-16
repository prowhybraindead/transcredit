import { Order, ExecuteTransactionRequest, ExecuteTransactionResponse } from './types';

// ── Configuration ─────────────────────────────────────
const API_BASE_URL = __DEV__
    ? 'http://10.52.101.166:3000'
    : 'https://your-production-url.vercel.app';

// ── Types for new endpoints ───────────────────────────
export interface RegisterPayload {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    bankName: string;
}

export interface RegisterResponse {
    success: boolean;
    user: {
        uid: string;
        email: string;
        displayName: string;
        phoneNumber: string;
        bankName: string;
        accountNumber: string;
    };
    wallet: {
        balance: number;
        accountNumber: string;
    };
}

export interface P2PTransferPayload {
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

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`[API] ${options?.method || 'GET'} ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        clearTimeout(timeout);

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                data.error || data.message || 'Request failed',
                response.status,
                data.code
            );
        }

        return data;
    }

    // ── Orders ────────────────────────────────────────────
    async getOrder(orderId: string): Promise<Order> {
        return this.request<Order>(`/api/orders/${orderId}`);
    }

    // ── Payment ───────────────────────────────────────────
    async executeTransaction(
        payload: ExecuteTransactionRequest
    ): Promise<ExecuteTransactionResponse> {
        return this.request<ExecuteTransactionResponse>('/api/execute-transaction', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // ── Auth / Register ───────────────────────────────────
    async register(payload: RegisterPayload): Promise<RegisterResponse> {
        return this.request<RegisterResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // ── P2P Transfer ──────────────────────────────────────
    async p2pTransfer(payload: P2PTransferPayload): Promise<P2PTransferResponse> {
        return this.request<P2PTransferResponse>('/api/p2p-transfer', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // ── Wallet ────────────────────────────────────────────
    async getWallet(userId: string): Promise<{ balance: number; accountNumber: string; bankName: string; displayName: string }> {
        return this.request(`/api/wallet/${userId}`);
    }
}

class ApiError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

export const api = new ApiClient(API_BASE_URL);
export { ApiError };
