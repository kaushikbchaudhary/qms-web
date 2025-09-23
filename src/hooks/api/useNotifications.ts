import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationItem } from '@/lib/api/endpoints/notifications';
import { showApiErrorToast } from '@/lib/utils';

interface UseNotificationsOptions {
  enabled?: boolean;
}

export const useNotifications = (
  status: 'all' | 'unread' = 'all',
  options?: UseNotificationsOptions
) => {
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', status],
    queryFn: () => notificationsApi.getNotifications({ status }),
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: showApiErrorToast
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: showApiErrorToast
  });
};
