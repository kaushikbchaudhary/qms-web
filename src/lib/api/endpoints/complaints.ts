import {apiClient, apiFileClient} from '../client';
import {
    Complaint,
    ComplaintCreateResponse,
    ComplaintQueryParams,
    CreateComplaintPayload, MasterLookupItem,
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
    uploadInvestigatorSignature: (formData: FormData) =>
        apiClient.post('api/v1/complaint/investigator-signatures', formData,{
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        }),
    deleteComplaintAttachment: (params: { path: string }) =>
        apiClient.delete('api/v1/complaint/delete-file', {
            params
        }).then(response => response.data),
    getAttachment: (params: { path: string }): Promise<{ url: string; blob: Blob }> =>
        apiFileClient.get('api/v1/complaint/complaint-attachment', {
            params,
            responseType: 'blob'
        }).then((response:any) => {
            const url = URL.createObjectURL(response.data);
            return { url, blob: response.data };
        }),
    getSignature: (params: { path: string }): Promise<{ url: string; blob: Blob }> =>
        apiFileClient.get('api/v1/complaint/investigator-signatures', {
            params,
            responseType: 'blob'
        }).then((response:any) => {
            const url = URL.createObjectURL(response.data);
            return { url, blob: response.data };
        }),
    // Workflow Status Transition
    transitionComplaintStatus: (complaintId: string, data: { newStatus:string, comments:string }) =>
        apiClient.put(`/api/v1/complaint/${complaintId}/status`, data),

    // Received Info
    updateReceivedInfo: (complaintId: string, data: {
        receiver_name: string;
        receiver_role: string;
        received_date: string;
    }) => apiClient.put(`/api/v1/complaint/${complaintId}/received-info`, data),
    // Investigation
    updateInvestigation: (complaintId: string, data: any) =>
        apiClient.put(`/api/v1/complaint/${complaintId}/investigation`, data),

    // Customer Communication
    updateCustomerCommunication: (complaintId: string, data: any) =>
        apiClient.put(`/api/v1/complaint/${complaintId}/customer-communication`, data),

    // Risk Management
    updateRiskManagement: (complaintId: string, data: any) =>
        apiClient.put(`/api/v1/complaint/${complaintId}/risk-management`, data),

    // Closure
    updateClosure: (complaintId: string, data: any) =>
        apiClient.put(`/api/v1/complaint/${complaintId}/closure`, data),

    // Get full complaint details with workflow data
    getComplaintWithWorkflow: (complaintId: any) =>
        apiClient.get<any>(`/api/v1/complaint/${complaintId}`),
    downloadComplaintReport: (complaintId: string) =>
        apiFileClient.get(`/api/v1/complaint/${complaintId}/pdf`, {
            responseType: 'blob'
        }).then(response => response.data as Blob),
    assignComplaint: (complaintId: string, data: { assigneeId: string; note?: string }) =>
        apiClient.post(`/api/v1/complaint/${complaintId}/assign`, data),
    assignInvestigation: (complaintId: string, data: { assignees: { userId: string; note?: string }[] }) =>
        apiClient.post(`/api/v1/complaint/${complaintId}/investigation/assignments`, data),
    markComplaintAssignmentRead: (complaintId: string) =>
        apiClient.patch(`/api/v1/complaint/${complaintId}/assignee/read`, {}),
    markInvestigationAssignmentRead: (complaintId: string) =>
        apiClient.patch(`/api/v1/complaint/${complaintId}/investigation/assignments/read`, {}),
};
