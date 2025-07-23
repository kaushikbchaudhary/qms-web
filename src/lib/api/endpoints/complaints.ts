import apiClient from '../client';
import {ComplaintQueryParams, CreateComplaintPayload} from "@/lib/api/types/complaints";

export const complaintsApi = {
    createComplaint: (data: CreateComplaintPayload) =>
        apiClient.post('api/v1/complaints', data),
    getComplaintType: (params?: any) =>
        apiClient.get('/api/v1/master/lookup', { params }),
    // PaginationParams
    getComplaints: (data: ComplaintQueryParams) =>
        apiClient.post('api/v1/complaint/list', data),

    getComplaintById: (id: string) =>
        apiClient.get(`api/v1/complaint/${id}`),
    uploadComplaintAttachment: (formData: FormData) =>
        apiClient.post('api/v1/complaint/complaint-attachment', formData, {
            // headers: {
            //     'Content-Type': 'multipart/form-data'
            // }
        }),
};