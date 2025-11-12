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
    login: (userData: UserData, token?: string) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (userData, token) => {
                if (typeof window !== 'undefined' && token) {
                    localStorage.setItem('token', token);
                }
                set({
                    user: userData,
                    isAuthenticated: true
                });
            },
            logout: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                }
                set({
                    user: null,
                    isAuthenticated: false
                });
            },
        }),
        {
            name: 'auth-storage', // LocalStorage key
            storage: createJSONStorage(() => localStorage), // or sessionStorage
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
