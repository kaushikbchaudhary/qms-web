import { apiClient } from '../client';

export interface SerializedPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface RegisterPushSubscriptionPayload {
  subscription: SerializedPushSubscription;
  client?: {
    platform?: string;
    appVersion?: string;
  };
}

export const pushSubscriptionApi = {
  getPublicKey: () =>
    apiClient.get<{ publicKey: string | null; enabled: boolean }>('/api/v1/push-subscriptions/public-key'),
  register: (payload: RegisterPushSubscriptionPayload) =>
    apiClient.post('/api/v1/push-subscriptions', payload),
  unregister: (endpoint: string) =>
    apiClient.delete('/api/v1/push-subscriptions', { data: { endpoint } }),
};
