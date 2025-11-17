import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { ncApi } from '@/lib/api/endpoints/nc';
import { CreateNcPayload, CreateNcResponse, NcListResponse } from '@/lib/api/types/nc';
import { showApiErrorToast } from '@/lib/utils';
import { toast } from 'sonner';

export const useCreateNc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNcPayload) => ncApi.create(payload),
    onSuccess: (response: CreateNcResponse) => {
      queryClient.invalidateQueries({ queryKey: ['nc', 'list'] });
      toast.success(`NC report created (${response.ncNumber}).`);
    },
    onError: showApiErrorToast,
  });
};

type UseNcListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export const useNcList = (
  params: UseNcListParams,
  options?: Omit<UseQueryOptions<NcListResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: ['nc', 'list', params],
    queryFn: () => ncApi.list(params),
    ...options,
  });
};
