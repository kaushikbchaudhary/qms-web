import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationItem } from '@/lib/api/endpoints/notifications';
import { showApiErrorToast } from '@/lib/utils';

interface UseNotificationsOptions {
  enabled?: boolean;
}

interface NotificationFilters {
  status?: 'all' | 'unread';
  scope?: 'all' | 'active';
  limit?: number;
}

export const useNotifications = (
  filters: NotificationFilters = {},
  options?: UseNotificationsOptions
) => {
  const queryFilters: Required<Pick<NotificationFilters, 'status' | 'scope'>> & Pick<NotificationFilters, 'limit'> = {
    status: filters.status ?? 'all',
    scope: filters.scope ?? 'active',
    ...(filters.limit !== undefined ? { limit: filters.limit } : {})
  };

  return useQuery<NotificationItem[]>({
    queryKey: ['notifications', queryFilters.status, queryFilters.scope, queryFilters.limit ?? null],
    queryFn: () => notificationsApi.getNotifications(queryFilters),
    enabled: options?.enabled ?? true
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
    onError: showApiErrorToast
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
    },
    onError: showApiErrorToast
  });
};
