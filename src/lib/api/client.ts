import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config:any) => {
        // Add auth token if exists
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // if (config.data instanceof FormData) {
        //     config.headers['Content-Type'] = 'multipart/form-data';
        // }
        return config;
    },
    (error:any) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response:any) => response.data,
    (error:any) => {
        const errorMessage = error.response?.data?.message ||
            error.message ||
            'Unknown error occurred';
        return Promise.reject(new Error(errorMessage));
    }
);

export default apiClient;