import {apiClient, apiFileClient} from '../client';
import {
    ComplaintCreateResponse,
    ComplaintQueryParams,
    CreateComplaintPayload, MasterLookupItem,
    MasterLookupResponse
} from "@/lib/api/types/complaints";

export const complaintsApi = {
    createComplaint: (data: CreateComplaintPayload):Promise<ComplaintCreateResponse> =>
        apiClient.post<ComplaintCreateResponse>('api/v1/complaint', data).then(response => response.data),
    getLookupType: (params:{type:string}):Promise<MasterLookupItem[]> =>
        apiClient.get('/api/v1/master/lookup', { params }).then(response => response.data)    ,
    getComplaints: (data: ComplaintQueryParams) =>
        apiClient.post('api/v1/complaint/list', data),
    getComplaintById: (id: string) =>
        apiClient.get(`api/v1/complaint/${id}`),
    uploadComplaintAttachment: (formData: FormData) =>
        apiClient.post('api/v1/complaint/complaint-attachment', formData,{
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }),
    getAttachment: (params: { path: string }): Promise<{ url: string; blob: Blob }> =>
        apiFileClient.get('api/v1/complaint/complaint-attachment', {
            params,
            responseType: 'blob'
        }).then((response:any) => {
            const url = URL.createObjectURL(response.data);
            return { url, blob: response.data };
        }),
};