import { apiClient } from '../client';

export interface NotificationItem {
  _id: string;
  type: 'COMPLAINT_ASSIGNED' | 'INVESTIGATION_ASSIGNED' | 'INVESTIGATION_UPDATED';
  complaint?: string;
  payload?: Record<string, any>;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export const notificationsApi = {
  getNotifications: (params?: { status?: 'all' | 'unread'; limit?: number }) =>
    apiClient.get<NotificationItem[]>('/api/v1/notifications', { params }).then(res => res.data),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/api/v1/notifications/${id}/read`, {}),
  markAllRead: () =>
    apiClient.patch('/api/v1/notifications/read/all', {})
};
