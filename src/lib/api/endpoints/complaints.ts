import apiClient from '../client';
import {CreateComplaintPayload} from "@/lib/api/types/complaints";

export const complaintsApi = {
    createComplaint: (data: CreateComplaintPayload) =>
        apiClient.post('api/v1/complaints', data),
    getComplaintType: (params?: any) =>
        apiClient.get('/api/v1/master/lookup', { params }),
    // PaginationParams
    getComplaints: (params?: any) =>
        apiClient.get('api/v1/complaint', { params }),

    getComplaintById: (id: string) =>
        apiClient.get(`api/v1/complaint/${id}`),
};