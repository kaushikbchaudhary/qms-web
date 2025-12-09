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
    permissions?: string[];
    // Add other fields you need
};

type AuthState = {
    user: UserData | null;
    isAuthenticated: boolean;
    sessionId: string | null;
    token: string | null;
    login: (userData: UserData, token?: string | null, sessionId?: string | null) => void;
    setSession: (params: { sessionId?: string | null; token?: string | null }) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            sessionId: null,
            token: null,
            login: (userData, token, sessionId) => {
                set({
                    user: userData,
                    isAuthenticated: true,
                    sessionId: sessionId ?? null,
                    token: token ?? null,
                });
            },
            setSession: ({ sessionId, token }) => {
                set((state) => ({
                    ...state,
                    sessionId: sessionId ?? null,
                    token: token ?? state.token,
                }));
            },
            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    sessionId: null,
                    token: null,
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
