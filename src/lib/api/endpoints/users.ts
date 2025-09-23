import { apiClient, apiFileClient } from '../client';

export const userApi = {
    createUser: (data: any):Promise<any> =>
        apiClient.post('api/v1/users', data),
    getUsers: (data: any) =>
        apiClient.post('api/v1/users/list', data),
    deleteUser: (endPoint:string) =>
        apiClient.delete(`api/v1/users/${endPoint}`),
    updateUser: (id: string, data: any) =>
        apiClient.patch(`api/v1/users/${id}`, data),
    uploadSignature: (formData: FormData) =>
        apiClient.post('api/v1/users/signature', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    deleteSignature: (params: { path: string }) =>
        apiClient.delete('api/v1/users/signature', { params }),
    getSignature: (params: { path: string }): Promise<{ url: string; blob: Blob }> =>
        apiFileClient.get('api/v1/users/signature', {
            params,
            responseType: 'blob',
        }).then((response: any) => {
            const url = URL.createObjectURL(response.data);
            return { url, blob: response.data };
        }),
};
