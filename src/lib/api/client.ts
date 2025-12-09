// lib/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const clearClientAuth = () => {
    try {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
    } catch {
        // ignore
    }
};

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

const shouldSkipUnauthorizedHandling = (error: any) => {
  return Boolean(error?.config?.skipAuthErrorHandling);
};

let refreshPromise: Promise<string | null> | null = null;
let logoutInProgress = false;
let transientAccessToken: string | null = null;

const forceLogout = () => {
    if (typeof window === 'undefined') return;
    if (logoutInProgress) return;
    logoutInProgress = true;
    const { logout } = useAuthStore.getState();
    logout();
    clearClientAuth();
    if (window.location.pathname !== '/auth/login') {
        window.location.replace('/auth/login');
    }
    setTimeout(() => {
        logoutInProgress = false;
    }, 1000);
};

const performRefresh = async () => {
    if (typeof window === 'undefined') return null;
    const { sessionId, setSession } = useAuthStore.getState();

    if (!refreshPromise) {
        refreshPromise = apiClient
            .post('/api/v1/auth/refresh', sessionId ? { sessionId } : {}, { skipAuthErrorHandling: true })
            .then((response: any) => {
                const data = response?.data ?? {};
                const newSessionId = data?.sessionId ?? sessionId ?? null;
                const token = data?.token ?? null;
                setSession({ sessionId: newSessionId, token });
                transientAccessToken = token;
                return token;
            })
            .catch(() => {
                forceLogout();
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
            const storeToken = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
            const bearer = transientAccessToken || storeToken;
            if (bearer) {
                config.headers.Authorization = `Bearer ${transientAccessToken}`;
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
                if ((originalRequest as any)?._retry || logoutInProgress) {
                    // forceLogout();
                    return Promise.reject(error);
                }

                (originalRequest as any)._retry = true;

                return performRefresh().then((token) => {
                    if (token) {
                        originalRequest.headers = {
                            ...(originalRequest.headers || {}),
                            Authorization: `Bearer ${token}`,
                        };
                        return client(originalRequest);
                    }
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
