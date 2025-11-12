'use client';

import { ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { initializeSocket, disconnectSocket, getSocket } from '@/lib/socket/client';
import { useAuthStore } from '@/stores/authStore';

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const queryClient = useQueryClient();

    const resolveAuthToken = () => {
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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleNotification = async () => {
            await queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
            await queryClient.refetchQueries({ queryKey: ['notifications'], exact: false, type: 'active' });
        };

        const handleComplaintChange = (payload?: { complaintId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            queryClient.invalidateQueries({ queryKey: ['complaint-stats'] });
            if (payload?.complaintId) {
                queryClient.invalidateQueries({ queryKey: ['complaint', payload.complaintId] });
            }
        };

        const handleConnectError = (error: Error) => {
            console.error('Socket connection error:', error.message);
        };

        const handleDeviceIssueChange = (payload?: { requestId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
            queryClient.invalidateQueries({ queryKey: ['device-material-issues', 'queue', 'next'] });
            if (payload?.requestId) {
                queryClient.invalidateQueries({ queryKey: ['device-material-issue', payload.requestId] });
            }
        };

        let activeSocket = getSocket();

        const handleConnect = () => {
            if (process.env.NODE_ENV !== 'production') {
                console.info('[socket] connected');
            }
        };

        const handleDisconnect = (reason: string) => {
            if (process.env.NODE_ENV !== 'production') {
                console.info('[socket] disconnected:', reason);
            }
        };

        const detachListeners = (socket: ReturnType<typeof initializeSocket>) => {
            if (!socket) return;
            socket.off('notification:new', handleNotification);
            socket.off('complaint:created', handleComplaintChange);
            socket.off('complaint:updated', handleComplaintChange);
            socket.off('device-issue:created', handleDeviceIssueChange);
            socket.off('device-issue:updated', handleDeviceIssueChange);
            socket.off('device-issue:status-changed', handleDeviceIssueChange);
            socket.off('device-issue:issued', handleDeviceIssueChange);
            socket.off('connect_error', handleConnectError);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };

        const attachListeners = (socket: ReturnType<typeof initializeSocket>) => {
            if (!socket) return;
            socket.on('notification:new', handleNotification);
            socket.on('complaint:created', handleComplaintChange);
            socket.on('complaint:updated', handleComplaintChange);
            socket.on('device-issue:created', handleDeviceIssueChange);
            socket.on('device-issue:updated', handleDeviceIssueChange);
            socket.on('device-issue:status-changed', handleDeviceIssueChange);
            socket.on('device-issue:issued', handleDeviceIssueChange);
            socket.on('connect_error', handleConnectError);
            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
        };

        const cleanup = () => {
            if (activeSocket) {
                detachListeners(activeSocket);
            }
            disconnectSocket();
            activeSocket = null;
        };

        const ensureSocket = () => {
            const authState = useAuthStore.getState();
            const isReady = Boolean(authState.isAuthenticated && authState.user);

            if (!isReady) {
                cleanup();
                return;
            }

            const token = resolveAuthToken();
            const socket = initializeSocket({ token });
            if (!socket) {
                return;
            }

            if (socket !== activeSocket) {
                detachListeners(activeSocket);
                activeSocket = socket;
                attachListeners(socket);
            }
        };

        ensureSocket();

        const unsubscribe = useAuthStore.subscribe((state, prevState) => {
            if (
                state.isAuthenticated !== prevState.isAuthenticated ||
                state.user?._id !== prevState.user?._id
            ) {
                ensureSocket();
            }
        });

        return () => {
            unsubscribe();
            cleanup();
        };
    }, [queryClient]);

    return <>{children}</>;
}
