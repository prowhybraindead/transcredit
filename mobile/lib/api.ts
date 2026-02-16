import { Order, ExecuteTransactionRequest, ExecuteTransactionResponse } from './types';

// ── Configuration ─────────────────────────────────────
// Change this to your Next.js dev server URL.
// For Expo Go on a physical device, use your machine's LAN IP (e.g. 192.168.x.x)
// For simulator/emulator, localhost works.
const API_BASE_URL = __DEV__
    ? 'http://10.52.101.166:3000' // Your machine's LAN IP (from Expo Metro output)
    : 'https://your-production-url.vercel.app';

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
        const timeout = setTimeout(() => controller.abort(), 10000);

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

    // ── Get order details ──────────────────────────────────
    async getOrder(orderId: string): Promise<Order> {
        return this.request<Order>(`/api/orders/${orderId}`);
    }

    // ── Execute payment transaction ────────────────────────
    async executeTransaction(
        payload: ExecuteTransactionRequest
    ): Promise<ExecuteTransactionResponse> {
        return this.request<ExecuteTransactionResponse>('/api/execute-transaction', {
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
