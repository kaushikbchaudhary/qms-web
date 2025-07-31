import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export const useProtectedRoute = (allowedRoles?: string[]) => {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // if (!isAuthenticated) {
        //     router.push('/auth/login');
        // } else if (allowedRoles && !allowedRoles.some(role => user?.role.includes(role))) {
        //     router.push('/unauthorized');
        // }
    }, [isAuthenticated, user, router, allowedRoles]);

    return { user };
};