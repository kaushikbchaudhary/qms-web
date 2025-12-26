'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

/** Attempt to hydrate auth state from cookies on first load. */
export default function AuthInitializer() {
    const { login, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Check for existing auth on page load
        if (!isAuthenticated) {
            const token = document.cookie.match(/jwt_qms=([^;]+)/)?.[1];
            if (token) {
                console.log('Token found:', token);
                // Verify token and fetch user data
                // fetch('/api/auth/me', {
                //     credentials: 'include'
                // })
                //     .then(res => res.json())
                //     .then(data => {
                //         if (data.success) {
                //             login(data.data, token);
                //         }
                //     });
            }
        }
    }, [login, isAuthenticated]);

    return null;
}
