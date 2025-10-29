import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deviceMaterialIssuesApi } from '@/lib/api/endpoints/deviceMaterialIssues';
import {
  CreateDeviceMaterialIssuePayload,
  DeviceMaterialIssue,
  DeviceMaterialIssueQueryParams,
  DeviceMaterialIssueSignaturePayload,
  DeviceMaterialIssueStatusUpdatePayload,
  DeviceMaterialIssueStoreIssuePayload,
  UpdateDeviceMaterialIssuePayload,
} from '@/lib/api/types/deviceMaterialIssue';
import { showApiErrorToast } from '@/lib/utils';

export const useDeviceMaterialIssueList = (params: DeviceMaterialIssueQueryParams) =>
  useQuery({
    queryKey: ['device-material-issues', params],
    queryFn: () => deviceMaterialIssuesApi.list(params),
  });

export const useDeviceMaterialIssueQueueHead = () =>
  useQuery({
    queryKey: ['device-material-issues', 'queue', 'next'],
    queryFn: deviceMaterialIssuesApi.getQueueHead,
  });

export const useDeviceMaterialIssue = (id?: string) =>
  useQuery<DeviceMaterialIssue | null>({
    queryKey: ['device-material-issue', id],
    queryFn: async () => {
      if (!id) return null;
      return deviceMaterialIssuesApi.getById(id);
    },
    enabled: Boolean(id),
  });

export const useCreateDeviceMaterialIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeviceMaterialIssuePayload) => deviceMaterialIssuesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Request created successfully');
    },
    onError: showApiErrorToast,
  });
};

export const useUpdateDeviceMaterialIssue = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDeviceMaterialIssuePayload) => deviceMaterialIssuesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Request updated');
      return data;
    },
    onError: showApiErrorToast,
  });
};

export const useDeviceMaterialIssueStatusTransition = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeviceMaterialIssueStatusUpdatePayload) =>
      deviceMaterialIssuesApi.transitionStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Status updated');
    },
    onError: showApiErrorToast,
  });
};

export const useDeviceMaterialIssueSignatureUpload = () =>
  useMutation({
    mutationFn: (formData: FormData) => deviceMaterialIssuesApi.uploadSignature(formData),
    onError: showApiErrorToast,
  });

export const useDeviceMaterialIssueStoreSignoff = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeviceMaterialIssueStoreIssuePayload) =>
      deviceMaterialIssuesApi.storeIssue(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Store issuance recorded');
    },
    onError: showApiErrorToast,
  });
};

export const useDeviceMaterialIssueAcknowledge = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeviceMaterialIssueSignaturePayload) =>
      deviceMaterialIssuesApi.acknowledgePickup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Pickup acknowledged');
    },
    onError: showApiErrorToast,
  });
};

export const useDeviceMaterialIssueReopen = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deviceMaterialIssuesApi.reopen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-material-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['device-material-issues'] });
      toast.success('Request reopened');
    },
    onError: showApiErrorToast,
  });
};
