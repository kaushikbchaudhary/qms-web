'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ErrorBoundary({
                                          error,
                                          reset,
                                      }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log to error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="p-4 border border-red-200 bg-red-50 rounded">
            <h2>Something went wrong!</h2>
            <p>{error.message}</p>
            <button onClick={() => reset()}>Try again</button>
            <button onClick={() => router.push('/')}>Go home</button>
        </div>
    );
}