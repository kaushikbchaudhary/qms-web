'use client';

import { ReactNode, useEffect } from 'react';

import { useWebPush } from '@/hooks/useWebPush';

export function PushProvider({ children }: { children: ReactNode }) {
  const { syncSubscriptionIfGranted } = useWebPush();

  useEffect(() => {
    syncSubscriptionIfGranted();
  }, [syncSubscriptionIfGranted]);

  return <>{children}</>;
}
