import axios from 'axios';
import {toast} from "sonner";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
    (config:any) => {
        // Add auth token if exists
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(),')))' ,config.url, config.data);
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        }
        return config;
    },
    (error:any) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response:any) => response.data,
    (error:any) => {
        if (error?.code === 'ERR_NETWORK') {
            toast.error('No Internet Connection!');
            return Promise.reject(new Error('No Internet Connection!'));
        }
        return Promise.reject(error);
    }
);

export default apiClient;