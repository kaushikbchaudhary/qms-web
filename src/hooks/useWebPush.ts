import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { pushSubscriptionApi, SerializedPushSubscription } from '@/lib/api/endpoints/push-subscriptions';
import { showApiErrorToast } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

type PushStatus = 'idle' | 'syncing' | 'error' | 'subscribed';

const toUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(normalized) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isBrowserSupported = () =>
  typeof window !== 'undefined' &&
  typeof Notification !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

const normalizeSubscription = (subscription: PushSubscription | null): SerializedPushSubscription | null => {
  if (!subscription) return null;
  const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : (subscription as any);
  if (!json?.endpoint || !json?.keys?.p256dh || !json?.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
};

export const useWebPush = (options?: { autoSync?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore();
  const userId = user?._id;
  const vapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const autoSync = options?.autoSync ?? true;
  const [status, setStatus] = useState<PushStatus>('idle');
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification === 'undefined' ? 'denied' : Notification.permission
  );
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(() => isBrowserSupported());
  const hasConfig = Boolean(vapidKey);
  const inFlightRef = useRef(false);

  const registerServiceWorker = useCallback(async () => {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;

    const registrations = await navigator.serviceWorker.getRegistrations();
    const rootScope = registrations.find((reg) => reg.scope === `${window.location.origin}/`);
    if (rootScope) return rootScope;

    return navigator.serviceWorker.register('/notifications-sw.js');
  }, []);

  const sendSubscriptionToApi = useCallback(
    async (subscription: SerializedPushSubscription) => {
      await pushSubscriptionApi.register({
        subscription,
        client: {
          // navigator.platform is deprecated; prefer userAgentData where available
          platform:
            typeof navigator !== 'undefined'
              ? (navigator as any)?.userAgentData?.platform || undefined
              : undefined,
          appVersion: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
      });
    },
    []
  );

  const syncSubscription = useCallback(async () => {
    if (!isSupported || !hasConfig || !isAuthenticated || !userId) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setStatus('syncing');
    setError(null);

    try {
      const registration = await registerServiceWorker();
      if (permission !== 'granted') {
        setStatus('idle');
        return;
      }
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey ? toUint8Array(vapidKey) : undefined,
        }));

      const serialized = normalizeSubscription(subscription);
      if (!serialized) {
        throw new Error('Unable to create push subscription.');
      }

      await sendSubscriptionToApi(serialized);
      setStatus('subscribed');
    } catch (err: any) {
      setStatus('error');
      const message = err?.message ?? 'Unable to enable browser notifications.';
      setError(message);
      const currentPermission =
        typeof Notification !== 'undefined' ? Notification.permission : ('default' as NotificationPermission);
      if (err?.name === 'NotAllowedError' || currentPermission === 'denied') {
        toast.error('Browser notifications are blocked. Please enable them in your browser settings.');
      } else {
        showApiErrorToast(err);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [hasConfig, isAuthenticated, isSupported, permission, registerServiceWorker, sendSubscriptionToApi, userId, vapidKey]);

  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('This browser does not support push notifications.');
      return;
    }
    if (!hasConfig) {
      toast.error('Push notifications are not configured.');
      return;
    }
    if (!isAuthenticated || !userId) {
      toast.error('Please sign in to enable notifications.');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') {
      setStatus('idle');
      setError('Notification permission was not granted.');
      return;
    }

    await syncSubscription();
  }, [hasConfig, isAuthenticated, isSupported, syncSubscription, userId]);

  useEffect(() => {
    setIsSupported(isBrowserSupported());
    setPermission(typeof Notification === 'undefined' ? 'denied' : Notification.permission);

    if (isBrowserSupported()) {
      registerServiceWorker().catch(() => undefined);
    }
  }, [registerServiceWorker]);

  useEffect(() => {
    if (!autoSync) return;
    if (permission === 'granted') {
      syncSubscription();
    }
  }, [autoSync, permission, syncSubscription]);

  return {
    isSupported,
    hasConfig,
    permission,
    status,
    error,
    requestPermissionAndSubscribe,
    syncSubscriptionIfGranted: syncSubscription,
  };
};
