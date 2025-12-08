// lib/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const trimTrailingSlashes = (value?: string | null) => value?.replace(/\/+$/, '') ?? '';

const resolveBaseUrl = () => {
  const browserBaseUrl = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (typeof window === 'undefined') {
    const serverBaseUrl = trimTrailingSlashes(process.env.SERVER_API_BASE_URL);
    const fallback = trimTrailingSlashes(process.env.NEXT_PUBLIC_API_BASE_URL) || 'http://localhost:8001';
    return serverBaseUrl || fallback;
  }
  return browserBaseUrl || '/api';
};

const baseURL = resolveBaseUrl();

// Shared HTTP client
const apiClient = axios.create({
  baseURL,
  timeout: 1000000,
  withCredentials: true,
});

// Dedicated client for file/binary downloads
const apiFileClient = axios.create({
  baseURL,
  timeout: 100000,
  responseType: 'blob',
  withCredentials: true,
});

// Shared request interceptor
const getAuthToken = () => {
    if (typeof window === 'undefined') return undefined;
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        return storedToken;
    }
    const cookieMatch = document.cookie.match(/jwt_qms=([^;]+)/);
    const cookieToken = cookieMatch?.[1];
    if (cookieToken) {
        localStorage.setItem('token', cookieToken);
    }
    return cookieToken ?? undefined;
};

const shouldSkipUnauthorizedHandling = (error: any) => {
  return Boolean(error?.config?.skipAuthErrorHandling);
};

let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async () => {
    if (typeof window === 'undefined') return null;
    const { sessionId, setSession, logout } = useAuthStore.getState();
    const cachedSessionId = sessionId ?? localStorage.getItem('sessionId') ?? undefined;
    if (!cachedSessionId) {
        logout();
        return null;
    }

    if (!refreshPromise) {
        refreshPromise = apiClient.post('/api/v1/auth/refresh', { sessionId: cachedSessionId }, { skipAuthErrorHandling: true })
            .then((response: any) => {
                const data = response?.data ?? {};
                const token = data?.token;
                const newSessionId = data?.sessionId ?? cachedSessionId;
                if (token) {
                    setSession({ token, sessionId: newSessionId });
                    return token;
                }
                return null;
            })
            .catch((error) => {
                logout();
                if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                    window.location.replace('/auth/login');
                }
                return null;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

const setupInterceptors = ({client, directResponse = false
}:{client:  AxiosInstance,directResponse?:boolean}) => {
    client.interceptors.request.use(
        (config) => {
            const token = getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            if (config.data instanceof FormData) {
                config.headers['Content-Type'] = 'multipart/form-data';
            }
            return config;
        },
        (error: any) => Promise.reject(error)
    );

    client.interceptors.response.use(
        (response: any) => directResponse ? response : response.data, // Return full response for file client
        (error: any) => {
            if (error?.code === 'ERR_NETWORK') {
                toast.error('No Internet Connection!');
                return Promise.reject(new Error('No Internet Connection!'));
            }
            if (error?.response?.status === 401 && !shouldSkipUnauthorizedHandling(error)) {
                const originalRequest = error.config;
                if ((originalRequest as any)?._retry) {
                    useAuthStore.getState().logout();
                    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                        window.location.replace('/auth/login');
                    }
                    return Promise.reject(error);
                }

                (originalRequest as any)._retry = true;

                return performRefresh()
                    .then((newToken) => {
                        if (newToken) {
                            originalRequest.headers = {
                                ...(originalRequest.headers || {}),
                                Authorization: `Bearer ${newToken}`,
                            };
                            return client(originalRequest);
                        }
                        return Promise.reject(error);
                    })
                    .catch(() => {
                        return Promise.reject(error);
                    });
            }
            return Promise.reject(error);
        }
    );
};

setupInterceptors({client:apiClient});
setupInterceptors({client:apiFileClient,directResponse: true});

export { apiClient, apiFileClient };
