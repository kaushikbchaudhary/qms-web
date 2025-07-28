import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api/client'
import {
    Complaint,
    ComplaintQueryParams,
    ComplaintsApiResponse,
    CreateComplaintPayload, MasterLookupItem
} from '@/lib/api/types/complaints'
import {complaintsApi} from "@/lib/api/endpoints/complaints";
import {toast} from "sonner";
import {showApiErrorToast} from "@/lib/utils";

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
            toast.success('Complaint created successfully!');
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
            // try {
            //     const response = await apiClient.post('api/v1/complaint/complaint-attachment', file);
            //     return response.data;
            // } catch (error) {
            //     console.error('Upload failed:', error);
            //     throw error;
            // }
        },
        onError: (error) => {
            console.error('Error uploading attachment:', error);
        }
    });
}

export function useAttachmentDelete() {
    return useMutation({
        mutationFn: async (path: string) => {
            // await complaintsApi.deleteComplaintAttachment({ path });
            await new Promise((resolve => setTimeout(resolve, 1000))); // Simulate API call)
        }
    });
}
// export function useAttachmentUpload() {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: (file: File) => {
//             const formData = new FormData();
//             formData.append('file', file);
//             return complaintsApi.uploadComplaintAttachment(formData);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['complaints'] });
//         },
//         onError: (error) => {
//             console.error('Error uploading attachment:', error);
//         }
//     });
// }