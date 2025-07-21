import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { Complaint, CreateComplaintPayload } from '@/lib/api/types/complaints'
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