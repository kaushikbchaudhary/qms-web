import { apiClient } from '@/lib/api/client';
import { CreateNcPayload, CreateNcResponse, NcListResponse } from '@/lib/api/types/nc';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const ncApi = {
  create: (payload: CreateNcPayload) =>
    apiClient.post('api/v1/nc', payload).then((response) => extractData<CreateNcResponse>(response)),

  list: (params: { page?: number; pageSize?: number; search?: string }) =>
    apiClient.get('api/v1/nc', { params }).then((response) => extractData<NcListResponse>(response)),
};
