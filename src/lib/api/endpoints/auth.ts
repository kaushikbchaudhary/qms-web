import {apiClient} from '../client';
import {AuthPayload, AuthResponse} from "@/lib/api/types/authTypes";

export const authApi = {
    otpRequest: (data: AuthPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/otp/request', data),
    otpVerify: (data: AuthPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/otp/verify', data),
    logout: ():Promise<AuthResponse> =>
        apiClient.get('/api/v1/auth/logout'),
};