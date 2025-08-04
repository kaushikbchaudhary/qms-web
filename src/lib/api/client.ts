// lib/api/client.ts
import axios, {AxiosInstance} from 'axios';
import { toast } from "sonner";

// Your existing client (unchanged)
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

// New client specifically for file downloads
const apiFileClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 10000,
    responseType: 'blob',
    withCredentials: true,
});

// Shared request interceptor
const setupInterceptors = ({client, directResponse = false
}:{client:  AxiosInstance,directResponse?:boolean}) => {
    client.interceptors.request.use(
        (config: any) => {
            const token = localStorage.getItem('token');
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
            if(error.status === 401){
                toast.error('Unauthorized access. Please log in again.');
                window.location.href = '/auth/login' + '?t=' + Date.now();
                return Promise.reject(new Error('Unauthorized access'));
            }
            return Promise.reject(error);
        }
    );
};

setupInterceptors({client:apiClient});
setupInterceptors({client:apiFileClient,directResponse: true});

export { apiClient, apiFileClient };