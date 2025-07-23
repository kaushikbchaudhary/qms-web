import apiClient from '../client';
import {ComplaintCreateResponse, ComplaintQueryParams, CreateComplaintPayload} from "@/lib/api/types/complaints";

export const complaintsApi = {
    createComplaint: (data: CreateComplaintPayload):Promise<ComplaintCreateResponse> =>
        apiClient.post<ComplaintCreateResponse>('api/v1/complaint', data).then(response => response.data),
    getComplaintType: (params?: any) =>
        apiClient.get('/api/v1/master/lookup', { params }),
    getComplaints: (data: ComplaintQueryParams) =>
        apiClient.post('api/v1/complaint/list', data),
    getComplaintById: (id: string) =>
        apiClient.get(`api/v1/complaint/${id}`),
    uploadComplaintAttachment: (formData: FormData) =>
        apiClient.post('api/v1/complaint/complaint-attachment', formData, {
        }),
};