import {apiClient} from '../client';
// import {AuthPayload, AuthResponse} from "@/lib/api/types/authTypes";

export const userApi = {
    createUser: (data: any):Promise<any> =>
        apiClient.post('api/v1/users', data),
};