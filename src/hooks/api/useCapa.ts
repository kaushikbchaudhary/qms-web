import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { capaApi } from '@/lib/api/endpoints/capa';
import { AvailableCapasResponse, CreateCapaPayload, CreateCapaResponse, ValidateCapaResponse } from '@/lib/api/types/capa';
import { showApiErrorToast } from '@/lib/utils';
import { toast } from 'sonner';

const extractList = (response: AvailableCapasResponse | undefined) => response?.list ?? [];

export const useCreateCapa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCapaPayload) => capaApi.create(payload),
    onSuccess: (data: CreateCapaResponse) => {
      queryClient.invalidateQueries({ queryKey: ['capa', 'available'] });
      toast.success(`CAPA created successfully (${data.capaId}).`);
    },
    onError: showApiErrorToast,
  });
};

export const useAvailableCapas = (options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['capa', 'available'],
    queryFn: () => capaApi.listAvailable(),
    select: extractList,
    enabled: options.enabled ?? true,
    staleTime: 60 * 1000,
  });
};

export const useValidateCapa = () => {
  return useMutation({
    mutationFn: (identifier: string) => capaApi.validate(identifier),
    onSuccess: (response: ValidateCapaResponse) => {
      toast.success(`CAPA ${response.capa.capaId} is available to link.`);
    },
    onError: showApiErrorToast,
  });
};

