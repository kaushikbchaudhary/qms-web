import { apiClient } from '../client';
import { ComplaintStatus } from '@/lib/api/types/complaints';

export interface NotificationItem {
  _id: string;
  type: 'COMPLAINT_ASSIGNED' | 'INVESTIGATION_ASSIGNED' | 'INVESTIGATION_UPDATED';
  complaint?: string;
  payload?: Record<string, any>;
  read_at?: string;
  created_at: string;
  updated_at: string;
  complaintStatus?: ComplaintStatus | null;
  complaintNumber?: string | null;
  isResolved?: boolean;
}

export const notificationsApi = {
  getNotifications: (params?: { status?: 'all' | 'unread'; limit?: number; scope?: 'all' | 'active' }) =>
    apiClient.get<NotificationItem[]>('/api/v1/notifications', { params }).then(res => res.data),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/api/v1/notifications/${id}/read`, {}),
  markAllRead: () =>
    apiClient.patch('/api/v1/notifications/read/all', {})
};
