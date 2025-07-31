import {apiClient} from '../client';
import {ComplaintQueryParams} from "@/lib/api/types/complaints";
// import {AuthPayload, AuthResponse} from "@/lib/api/types/authTypes";

export const userApi = {
    createUser: (data: any):Promise<any> =>
        apiClient.post('api/v1/users', data),
    getUsers: (data: any) =>
        apiClient.post('api/v1/users/list', data),
    deleteUser: (endPoint:string) =>
        apiClient.delete(`api/v1/users/${endPoint}`),
};