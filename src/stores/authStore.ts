// stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UserData = {
    _id: string;
    firstName: string;
    lastName: string;
    role: string[];
    emailId: string;
    // Add other fields you need
};

type AuthState = {
    user: UserData | null;
    isAuthenticated: boolean;
    login: (userData: UserData) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (userData) => set({
                user: userData,
                isAuthenticated: true
            }),
            logout: () => set({
                user: null,
                isAuthenticated: false
            }),
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