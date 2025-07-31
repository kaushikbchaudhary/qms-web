import {apiClient} from '../client';
// import {AuthPayload, AuthResponse} from "@/lib/api/types/authTypes";

export const userApi = {
    createUser: (data: any):Promise<any> =>
        apiClient.post('api/v1/users', data),
    // otpVerify: (data: AuthPayload):Promise<AuthResponse> =>
    //     apiClient.post('api/v1/auth/otp/verify', data),
    // logout: ():Promise<AuthResponse> =>
    //     apiClient.get('/api/v1/auth/logout'),
};