import { io, Socket } from 'socket.io-client';

interface InitializeSocketOptions {
    token?: string;
}

let socketInstance: Socket | null = null;
let lastToken: string | undefined;

const resolveBaseUrl = () => {
    if (typeof window === 'undefined') {
        return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? undefined;
    }

    const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
    return configured || window.location.origin;
};

export const initializeSocket = (options: InitializeSocketOptions = {}) => {
    const baseUrl = resolveBaseUrl();

    if (!baseUrl) {
        console.warn('Socket base URL is not configured. Skipping socket initialization.');
        return null;
    }

    const authToken = options.token || undefined;

    if (socketInstance) {
        const tokenChanged = authToken !== lastToken;

        if (tokenChanged) {
            socketInstance.auth = authToken ? { token: authToken } : {};
            lastToken = authToken;
            if (socketInstance.connected) {
                socketInstance.disconnect();
            }
        }

        if (!socketInstance.connected) {
            socketInstance.connect();
        }

        return socketInstance;
    }

    const socket = io(baseUrl, {
        path: '/socket.io',
        transports: ['websocket'],
        withCredentials: true,
        auth: authToken ? { token: authToken } : undefined,
    });

    socketInstance = socket;
    lastToken = authToken;

    return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
    if (!socketInstance) return;

    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    lastToken = undefined;
};

