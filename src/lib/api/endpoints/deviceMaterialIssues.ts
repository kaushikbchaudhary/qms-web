import { apiClient, apiFileClient } from '@/lib/api/client';
import {
  CreateDeviceMaterialIssuePayload,
  DeviceMaterialIssue,
  DeviceMaterialIssueAttachmentResponse,
  DeviceMaterialIssueListResponse,
  DeviceMaterialIssueQueryParams,
  DeviceMaterialIssueSignaturePayload,
  DeviceMaterialIssueStatusUpdatePayload,
  DeviceMaterialIssueStoreIssuePayload,
  UpdateDeviceMaterialIssuePayload,
} from '@/lib/api/types/deviceMaterialIssue';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const deviceMaterialIssuesApi = {
  create: (payload: CreateDeviceMaterialIssuePayload) =>
    apiClient.post('api/v1/device-issue', payload).then((response) => extractData<DeviceMaterialIssue>(response)),

  list: (payload: DeviceMaterialIssueQueryParams) =>
    apiClient
      .post('api/v1/device-issue/list', {
        ...payload,
        page_index: payload?.page_index && payload.page_index > 0 ? payload.page_index : 1,
      })
      .then((response) => extractData<DeviceMaterialIssueListResponse>(response)),

  getQueueHead: () =>
    apiClient
      .get('api/v1/device-issue/queue/next')
      .then((response) => extractData<{ request_number: string; status: string } | null>(response)),

  getById: (id: string) =>
    apiClient.get(`api/v1/device-issue/${id}`).then((response) => extractData<DeviceMaterialIssue>(response)),

  update: (id: string, payload: UpdateDeviceMaterialIssuePayload) =>
    apiClient
      .put(`api/v1/device-issue/${id}`, payload)
      .then((response) => extractData<DeviceMaterialIssue>(response)),

  transitionStatus: (id: string, payload: DeviceMaterialIssueStatusUpdatePayload) =>
    apiClient
      .put(`api/v1/device-issue/${id}/status`, payload)
      .then((response) => extractData<DeviceMaterialIssue>(response)),

  uploadAttachment: (id: string, formData: FormData) =>
    apiClient
      .post(`api/v1/device-issue/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => extractData<DeviceMaterialIssueAttachmentResponse>(response)),

  deleteAttachment: (id: string, path: string) =>
    apiClient.delete(`api/v1/device-issue/${id}/attachments`, { params: { path } }).then(extractData),

  storeIssue: (id: string, payload: DeviceMaterialIssueStoreIssuePayload) =>
    apiClient
      .post(`api/v1/device-issue/${id}/store-issue`, payload)
      .then((response) => extractData<DeviceMaterialIssue>(response)),

  downloadAttachment: (path: string) =>
    apiFileClient
      .get('api/v1/device-issue/attachments', {
        params: { path },
        responseType: 'blob',
      })
      .then((response) => response.data as Blob),

  uploadSignature: (formData: FormData) =>
    apiClient
      .post('api/v1/device-issue/signature/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => extractData<{ filename: string; path: string }>(response)),

  acknowledgePickup: (id: string, payload: DeviceMaterialIssueSignaturePayload) =>
    apiClient
      .post(`api/v1/device-issue/${id}/signature`, payload)
      .then((response) => extractData<DeviceMaterialIssue>(response)),

  getBatchNumberAndSignature: (id: string) =>
    apiClient
      .get(`api/v1/device-issue/${id}/batch`)
      .then((response) => extractData<{ batch_number: string; store_signature_path?: string; store_signed_at?: string; store_signed_name?: string }>(response)),

  downloadPdf: (id: string) =>
    apiFileClient.get(`api/v1/device-issue/${id}/pdf`, { responseType: 'blob' }).then((response) => response.data as Blob),

  reopen: (id: string) =>
    apiClient.post(`api/v1/device-issue/${id}/reopen`, {}).then((response) => extractData<DeviceMaterialIssue>(response)),
};
