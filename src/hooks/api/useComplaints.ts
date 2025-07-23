import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import {
    Complaint,
    ComplaintQueryParams,
    ComplaintsApiResponse,
    CreateComplaintPayload
} from '@/lib/api/types/complaints'
import {complaintsApi} from "@/lib/api/endpoints/complaints";
import {toast} from "sonner";
import axios from "axios";
import {ApiErrorResponse} from "@/lib/api/types/errors";

export function useComplaints(params?: any) {
    return useQuery({
        queryKey: ['complaints', params],
        queryFn: async () => {
            const {data} = await complaintsApi.getComplaintType(params);
            return data as Complaint[]
        },
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
            console.log('complaintData',response)
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['complaints'] })
            toast.success('Complaint created successfully!');
        },
        onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.data) {
                const errData = error.response.data as ApiErrorResponse;
                console.log('errData',errData)
                let message = errData.message || 'Something went wrong';
                Object.keys(errData.errors).forEach((key) => {
                    message = errData.errors[key].message;
                    toast.error(message);
                })
            }
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