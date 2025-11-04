import { apiClient } from '@/lib/api/client';
import {
  AvailableCapasResponse,
  CreateCapaPayload,
  CreateCapaResponse,
  ValidateCapaResponse,
  CapaListResponse,
} from '@/lib/api/types/capa';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const capaApi = {
  create: (payload: CreateCapaPayload) =>
    apiClient.post('api/v1/capa', payload).then((response) => extractData<CreateCapaResponse>(response)),

  list: (params: { page?: number; pageSize?: number; search?: string }) =>
    apiClient
      .get('api/v1/capa', { params })
      .then((response) => extractData<CapaListResponse>(response)),

  listAvailable: () =>
    apiClient.get('api/v1/capa/available').then((response) => extractData<AvailableCapasResponse>(response)),

  validate: (identifier: string, options: { onlyAvailable?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (options.onlyAvailable === false) {
      params.set('onlyAvailable', 'false');
    }
    const query = params.toString();
    const url = query ? `api/v1/capa/${encodeURIComponent(identifier)}?${query}` : `api/v1/capa/${encodeURIComponent(identifier)}`;

    return apiClient.get(url).then((response) => extractData<ValidateCapaResponse>(response));
  },
};
