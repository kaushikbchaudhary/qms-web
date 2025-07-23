import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import {
    Complaint,
    ComplaintQueryParams,
    ComplaintsApiResponse,
    CreateComplaintPayload
} from '@/lib/api/types/complaints'
import {complaintsApi} from "@/lib/api/endpoints/complaints";

export function useComplaints(params?: any) {
    return useQuery({
        queryKey: ['complaints', params],
        queryFn: async () => {
            const {data} = await complaintsApi.getComplaintType(params);
            // const { data } = await apiClient.get('/complaints', { params })
            return data as Complaint[]
        },
    })
}

export function useCreateComplaint() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (complaintData: CreateComplaintPayload) =>
        {
            console.log('complaintData',complaintData)
            return complaintsApi.createComplaint(complaintData);
            // return apiClient.post('/complaints', complaintData);
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
        },
        onError: (error) => {
            console.error('Error creating complaint:', error);
        }
    })
}

export function useGetComplaints(payload: ComplaintQueryParams) {
    return useQuery({
        queryKey: ['complaints', payload],
        queryFn: async () => {
            const { data } = await complaintsApi.getComplaints(payload);
            console.log('complaints',data)
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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return complaintsApi.uploadComplaintAttachment(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['complaints'] });
        },
        onError: (error) => {
            console.error('Error uploading attachment:', error);
        }
    });
}