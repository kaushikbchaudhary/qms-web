import { apiClient } from '@/lib/api/client';
import { GrammarCorrectionResponse } from '@/lib/api/types/text';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const textApi = {
  correct: (text: string, options: { limit?: number } = {}) =>
    apiClient
      .post('api/v1/text/correct', { text, limit: options.limit ?? 3 })
      .then((response) => extractData<GrammarCorrectionResponse>(response)),
};
