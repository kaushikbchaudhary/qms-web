import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { showApiErrorToast } from '@/lib/utils';
import { incomingInspectionsApi } from '@/lib/api/endpoints/incomingInspections';
import {
  CreateIncomingInspectionPayload,
  IncomingInspection,
  IncomingInspectionQueryParams,
  UpdateIncomingInspectionPayload,
} from '@/lib/api/types/incomingInspection';

export const useIncomingInspectionList = (params: IncomingInspectionQueryParams) =>
  useQuery({
    queryKey: ['incoming-inspections', params],
    queryFn: () => incomingInspectionsApi.list(params),
  });

export const useIncomingInspection = (id?: string) =>
  useQuery<IncomingInspection | null>({
    queryKey: ['incoming-inspection', id],
    queryFn: async () => {
      if (!id) return null;
      return incomingInspectionsApi.getById(id);
    },
    enabled: Boolean(id),
  });

export const useCreateIncomingInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncomingInspectionPayload) => incomingInspectionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      toast.success('Inspection created successfully');
    },
    onError: showApiErrorToast,
  });
};

export const useUpdateIncomingInspection = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateIncomingInspectionPayload) => incomingInspectionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspection', id] });
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      toast.success('Inspection updated');
    },
    onError: showApiErrorToast,
  });
};

export const useDeleteIncomingInspection = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => incomingInspectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['incoming-inspection', id] });
      toast.success('Inspection archived');
    },
    onError: showApiErrorToast,
  });
};
