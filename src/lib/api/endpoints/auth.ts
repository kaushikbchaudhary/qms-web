import {apiClient} from '../client';
import {
    AuthPayload,
    AuthResponse,
    PasswordLoginPayload,
    ForgotPasswordPayload,
    ResetPasswordPayload,
    SessionSummary
} from "@/lib/api/types/authTypes";

export const authApi = {
    otpRequest: (data: AuthPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/otp/request', data),
    otpVerify: (data: AuthPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/otp/verify', data),
    loginWithPassword: (data: PasswordLoginPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/login', data, { skipAuthErrorHandling: true }),
    forgotPassword: (data: ForgotPasswordPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/password/forgot', data),
    resetPassword: (data: ResetPasswordPayload):Promise<AuthResponse> =>
        apiClient.post('api/v1/auth/password/reset', data),
    logout: ():Promise<AuthResponse> =>
        apiClient.get('/api/v1/auth/logout'),
    refresh: (sessionId?: string):Promise<AuthResponse> =>
        apiClient.post('/api/v1/auth/refresh', sessionId ? { sessionId } : {}, { skipAuthErrorHandling: true }),
    listSessions: ():Promise<AuthResponse<SessionSummary[]>> =>
        apiClient.get('/api/v1/auth/sessions'),
    logoutAll: ():Promise<AuthResponse> =>
        apiClient.delete('/api/v1/auth/sessions'),
    logoutDevice: (sessionId: string):Promise<AuthResponse> =>
        apiClient.delete(`/api/v1/auth/sessions/${sessionId}`),
};
