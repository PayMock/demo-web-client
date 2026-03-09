export class ApiError extends Error {
    public status: number;
    public data?: any;

    constructor(status: number, message: string, data?: any) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const apiKey = sessionStorage.getItem('paymock_api_key');

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    if (apiKey) {
        headers.set('Authorization', `Bearer ${apiKey}`);
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(response.status, data.message || 'An error occurred', data);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, data?: any, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'POST', body: JSON.stringify(data) }),
    put: <T>(path: string, data?: any, options?: RequestInit) =>
        request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
