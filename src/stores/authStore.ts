// stores/authStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserData = {
    _id: string;
    firstName: string;
    lastName: string;
    role: string[];
    emailId: string;
    isVerified?: boolean;
    organization?: string;
    // Add other fields you need
};

type AuthState = {
    user: UserData | null;
    isAuthenticated: boolean;
    sessionId: string | null;
    login: (userData: UserData, token?: string, sessionId?: string | null) => void;
    setSession: (params: { token?: string | null; sessionId?: string | null }) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            sessionId: null,
            login: (userData, token, sessionId) => {
                if (typeof window !== 'undefined') {
                    if (token) {
                        localStorage.setItem('token', token);
                    }
                    if (sessionId) {
                        localStorage.setItem('sessionId', sessionId);
                    }
                }
                set({
                    user: userData,
                    isAuthenticated: true,
                    sessionId: sessionId ?? null,
                });
            },
            setSession: ({ token, sessionId }) => {
                if (typeof window !== 'undefined') {
                    if (token) {
                        localStorage.setItem('token', token);
                    }
                    if (sessionId) {
                        localStorage.setItem('sessionId', sessionId);
                    } else {
                        localStorage.removeItem('sessionId');
                    }
                }
                set((state) => ({
                    ...state,
                    sessionId: sessionId ?? null,
                }));
            },
            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('sessionId');
                }
                set({
                    user: null,
                    isAuthenticated: false,
                    sessionId: null,
                });
            },
        }),
        {
            name: 'auth-storage', // LocalStorage key
            storage: createJSONStorage(() => localStorage), // or sessionStorage
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                sessionId: state.sessionId
            }),
        }
    )
);
