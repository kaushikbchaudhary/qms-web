import {useQuery, useMutation, useQueryClient, UseQueryResult} from '@tanstack/react-query'
import {
    Complaint,
    ComplaintQueryParams,
    ComplaintsApiResponse,
    CreateComplaintPayload, MasterLookupItem,
    ComplaintStats,
    ComplaintSerialStats
} from '@/lib/api/types/complaints'
import {complaintsApi} from "@/lib/api/endpoints/complaints";
import {toast} from "sonner";
import {getFileType, showApiErrorToast} from "@/lib/utils";

export function useLookup(params: { type: string }) {
    return useQuery<MasterLookupItem[], Error>({
        queryKey: ['lookup', params.type],
        queryFn: async () => {
            const data = await complaintsApi.getLookupType(params);
            return data as MasterLookupItem[];
        },
        gcTime: 10 * 60 * 1000, // 10 minutes
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

export function useCreateComplaint() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (complaintData: CreateComplaintPayload) =>
        {
            return complaintsApi.createComplaint(complaintData);
        },
        onSuccess: (response) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            const backendMessage = typeof response?.message === 'string' && response.message.trim().length
                ? response.message
                : null;
            toast.success(backendMessage ?? 'Complaint created successfully!');
        },
        onError: showApiErrorToast
    })
}

export function useGetComplaints(payload: ComplaintQueryParams) {
    return useQuery({
        queryKey: ['complaints', payload],
        queryFn: async () => {
            const { data } = await complaintsApi.getComplaints(payload);
            return data as ComplaintsApiResponse;
        },
        // select: (response) => {
        //     if (!response.success) {
        //         throw new Error(response.message);
        //     }
        //     return {
        //         count: response.data.count,
        //         list: response.data.list,
        //     };
        // },
    });
}

// complaints-hooks.ts
export function useAttachmentUpload() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            // formData.append('file', file);
            formData.append('attachment', file); // 'attachment' must match
            const response = await complaintsApi.uploadComplaintAttachment(formData);
            return response.data; // Assuming your API returns { path: string }
        },
        onError: (error) => {
            console.error('Error uploading attachment:', error);
        }
    });
}

export function useAttachmentDelete() {
    return useMutation({
        mutationFn: async (path: string) => {
            await complaintsApi.deleteComplaintAttachment({ path });
        }
    });
}

export function useSignatureUpload() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            // formData.append('file', file);
            formData.append('signature', file); // 'attachment' must match
            const response = await complaintsApi.uploadInvestigatorSignature(formData);
            return response.data; // Assuming your API returns { path: string }
        },
        onError: (error) => {
            console.error('Error uploading Signature:', error);
        }
    });
}

export function useGetAttachment(params: {
    path: string | null;
    isOpen: boolean
}) {
    return useQuery({
        queryKey: ['complaint-attachment', params.path],
        queryFn: async () => {
            if (!params.path) return null;

            const response = await complaintsApi.getAttachment({ path: params.path });
            return {
                url: response.url,
                type: getFileType(params.path),
                blob: response.blob
            };
        },
        enabled: !!params.path && params.isOpen,
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        staleTime: 5 * 60 * 1000, // 5 minutes stale time
    });
}
// Status Transition Hook
export function useTransitionComplaintStatus(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { newStatus:string, comments:string }) =>
            complaintsApi.transitionComplaintStatus(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
            toast.success('Status updated successfully');
        },
        onError: showApiErrorToast
    });
}

// Received Info Hook
export function useUpdateReceivedInfo(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { receiver_name: string; receiver_role: string; received_date: string }) =>
            complaintsApi.updateReceivedInfo(complaintId, data),
        onSuccess: (response:any) => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            toast.success(response.message);
            toast.success(`status updated to under investigation successfully`);
            // toast.success('Received info updated successfully');
        },
        onError: showApiErrorToast
    });
}

// Investigation Hook
export function useUpdateInvestigation(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) =>
            complaintsApi.updateInvestigation(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['complaint', complaintId]});
            toast.success('Investigation updated successfully');
        },
        onError: showApiErrorToast
    });
}

export function useAssignInvestigators(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { assignees: { userId: string; note?: string }[] }) =>
            complaintsApi.assignInvestigation(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            toast.success('Investigators assigned successfully');
        },
        onError: showApiErrorToast
    });
}

export function useMarkInvestigationAssignmentRead(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => complaintsApi.markInvestigationAssignmentRead(complaintId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: showApiErrorToast
    });
}

export function useComplaintStats() {
    return useQuery({
        queryKey: ['complaint-stats'],
        queryFn: async () => {
            const response = await complaintsApi.getComplaintStats();
            return response.data as ComplaintStats;
        },
        staleTime: 60_000,
        refetchInterval: 5 * 60_000
    });
}

export function useComplaintSerialStats(serialNumber: string): UseQueryResult<ComplaintSerialStats, Error> {
    const trimmed = typeof serialNumber === 'string' ? serialNumber.trim() : '';
    return useQuery<ComplaintSerialStats, Error, ComplaintSerialStats, ['complaint-serial-stats', string]>({
        queryKey: ['complaint-serial-stats', trimmed],
        enabled: trimmed.length > 0,
        queryFn: async () => {
            const response = await complaintsApi.getComplaintSerialStats(trimmed);
            return response.data as ComplaintSerialStats;
        },
        staleTime: 60_000,
        // Handle errors at call sites if needed
    });
}

// Customer Communication Hook
export function useUpdateCustomerCommunication(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) =>
            complaintsApi.updateCustomerCommunication(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId]});
            toast.success('Customer communication updated successfully');
        },
        onError: showApiErrorToast
    });
}

// updateRiskManagement
export function useUpdateRiskManagement(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: (data: any) =>
            complaintsApi.updateRiskManagement(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            toast.success('Risk management updated successfully');
        },
        onError: showApiErrorToast
    });
};


export function useComplaintWithWorkflow(
    complaintId: string
): UseQueryResult<Complaint | undefined> {
    return useQuery<Complaint | undefined>({
        queryKey: ['complaint', complaintId],
        queryFn: async () => {
            if (!complaintId) return undefined;
            const response = await complaintsApi.getComplaintWithWorkflow(complaintId);
            return response?.data as Complaint;
        },
        enabled: !!complaintId,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });
}

export function useUpdateComplaintClosure(complaintId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) =>
            complaintsApi.updateClosure(complaintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
            toast.success('Closure section updated successfully');
        },
        onError: showApiErrorToast
    });
}
