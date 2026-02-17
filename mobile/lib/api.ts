import { Order, ExecuteTransactionRequest, ExecuteTransactionResponse } from './types';

// ── Configuration ─────────────────────────────────────
// Use EXPO_PUBLIC_API_URL env var, fallback to local dev IP
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.52.101.166:3000';

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

        let response: Response;
        try {
            response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });
        } catch (fetchError: any) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                throw new ApiError('Request timed out — is the server running?', 0);
            }
            throw new ApiError(
                `Network error: ${fetchError.message}. Check that your backend is running at ${this.baseUrl}`,
                0
            );
        }

        clearTimeout(timeout);

        // Safe JSON parsing — handle non-JSON responses (HTML error pages, etc.)
        const text = await response.text();
        let data: any;
        try {
            data = JSON.parse(text);
        } catch (_e) {
            console.error('[API] Non-JSON response:', text.substring(0, 200));
            throw new ApiError(
                `Server returned non-JSON response (status ${response.status}). Check API URL: ${this.baseUrl}`,
                response.status
            );
        }

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

    // ── Admin ─────────────────────────────────────────────
    async getAdminUsers(): Promise<{ success: boolean; users: any[] }> {
        return this.request('/api/admin/users');
    }

    async adjustBalance(payload: {
        targetUid: string;
        amount: number;
        reason?: string;
    }): Promise<{ success: boolean; message: string; newBalance?: number; previousBalance?: number }> {
        return this.request('/api/admin/adjust-balance', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
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
