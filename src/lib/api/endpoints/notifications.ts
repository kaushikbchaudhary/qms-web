import { apiClient } from '../client';
import { ComplaintStatus } from '@/lib/api/types/complaints';

export type NotificationType =
  | 'COMPLAINT_ASSIGNED'
  | 'INVESTIGATION_ASSIGNED'
  | 'INVESTIGATION_UPDATED'
  | 'COMPLAINT_OVERDUE'
  | 'INVESTIGATION_OVERDUE'
  | 'DEVICE_REQUEST_SUBMITTED'
  | 'DEVICE_REQUEST_READY_FOR_PICKUP'
  | 'DEVICE_REQUEST_ISSUED'
  | 'DEVICE_REQUEST_STATUS_CHANGED';

export interface NotificationPayload {
  complaint_number?: string;
  stage?: 'investigation' | 'closure';
  overdueBy?: number;
  dueDate?: string | null;
  note?: string;
  request_number?: string;
  requestId?: string;
  status?: string;
  batch_number?: string;
  [key: string]: any;
}

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  complaint?: string;
  payload?: NotificationPayload;
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
