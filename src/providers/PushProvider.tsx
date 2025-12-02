'use client';

import { ReactNode, useEffect, useRef } from 'react';

import { useWebPush } from '@/hooks/useWebPush';

const PERMISSION_FLAG = 'qms-push-permission-requested';

export function PushProvider({ children }: { children: ReactNode }) {
  const {
    isSupported,
    hasConfig,
    permission,
    requestPermissionAndSubscribe,
    syncSubscriptionIfGranted,
  } = useWebPush();
  const promptedRef = useRef(false);

  useEffect(() => {
    syncSubscriptionIfGranted();
  }, [syncSubscriptionIfGranted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSupported || !hasConfig) return;
    if (permission !== 'default') return; // already granted or denied

    if (promptedRef.current) return;
    if (sessionStorage.getItem(PERMISSION_FLAG)) return;

    promptedRef.current = true;
    sessionStorage.setItem(PERMISSION_FLAG, '1');

    // Trigger a permission prompt once per session for logged-in users.
    requestPermissionAndSubscribe().catch(() => undefined);
  }, [hasConfig, isSupported, permission, requestPermissionAndSubscribe]);

  return <>{children}</>;
}
