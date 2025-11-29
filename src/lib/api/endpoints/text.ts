import { apiClient } from '@/lib/api/client';
import { GrammarCorrectionResponse } from '@/lib/api/types/text';

const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

export const textApi = {
  correct: (text: string) =>
    apiClient
      .post('api/v1/text/correct', { text })
      .then((response) => extractData<GrammarCorrectionResponse>(response)),
};
