// components/auth-provider.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthHandler() {
    const router = useRouter();

    useEffect(() => {
        // // This runs only on client-side after hydration
        // const checkAuth = async () => {
        //     const res = await fetch('/api/auth/verify', {
        //         credentials: 'include'
        //     });
        //
        //     if (!res.ok) {
        //         router.push('/auth/login');
        //     }
        // };
        //
        // checkAuth();
    }, [router]);

    return null;
}