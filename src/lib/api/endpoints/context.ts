import { apiClient } from '@/lib/api/client';
import { ContextSuggestionResponse } from '@/lib/api/types/context';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const contextApi = {
  suggest: (text: string) =>
    apiClient
      .post('api/v1/context/suggest', { text })
      .then((response) => extractData<ContextSuggestionResponse>(response)),
};
