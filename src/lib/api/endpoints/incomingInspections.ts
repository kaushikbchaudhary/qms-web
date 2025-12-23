import { apiClient, apiFileClient } from '@/lib/api/client';
import {
  CreateIncomingInspectionPayload,
  IncomingInspection,
  IncomingInspectionListResponse,
  IncomingInspectionQueryParams,
  UpdateIncomingInspectionPayload,
} from '@/lib/api/types/incomingInspection';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const incomingInspectionsApi = {
  create: (payload: CreateIncomingInspectionPayload) =>
    apiClient
      .post('api/v1/incoming-inspections', payload)
      .then((response) => extractData<IncomingInspection>(response)),

  list: (payload: IncomingInspectionQueryParams) =>
    apiClient
      .post('api/v1/incoming-inspections/list', {
        ...payload,
        page_index: payload?.page_index && payload.page_index > 0 ? payload.page_index : 1,
      })
      .then((response) => extractData<IncomingInspectionListResponse>(response)),

  getById: (id: string) =>
    apiClient
      .get(`api/v1/incoming-inspections/${id}`)
      .then((response) => extractData<IncomingInspection>(response)),

  update: (id: string, payload: UpdateIncomingInspectionPayload) =>
    apiClient
      .put(`api/v1/incoming-inspections/${id}`, payload)
      .then((response) => extractData<IncomingInspection>(response)),

  delete: (id: string) =>
    apiClient
      .delete(`api/v1/incoming-inspections/${id}`)
      .then((response) => extractData<IncomingInspection>(response)),

  downloadPdf: (id: string) =>
    apiFileClient
      .get(`api/v1/incoming-inspections/${id}/pdf`, { responseType: 'blob' })
      .then((response) => response.data as Blob),
};
