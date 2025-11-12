import {useMutation, useQueryClient} from '@tanstack/react-query'
import {toast} from "sonner";
import {showApiErrorToast} from "@/lib/utils";
import {authApi} from "@/lib/api/endpoints/auth";
import {AuthPayload, AuthResponse, PasswordLoginPayload, ForgotPasswordPayload, ResetPasswordPayload} from "@/lib/api/types/authTypes";
import { useAuthStore } from "@/stores/authStore";

export function useRequestOtp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (authPayload:AuthPayload ):Promise<AuthResponse> =>
        {
            return authApi.otpRequest(authPayload);
        },
        onSuccess: (response: AuthResponse) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['otpRequest'] })
            toast.success(response.message);
        },
        onError: showApiErrorToast
    })
}

export function useVerifyOtp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (authPayload:AuthPayload ):Promise<AuthResponse> =>
        {
            return authApi.otpVerify(authPayload);
        },
        onSuccess: (response: AuthResponse) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['otpVerify'] })
            toast.success(response.message);
        },
        onError: showApiErrorToast
    })
}

export function usePasswordLogin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (authPayload: PasswordLoginPayload): Promise<AuthResponse> =>
            authApi.loginWithPassword(authPayload),
        onSuccess: (response: AuthResponse) => {
            queryClient.invalidateQueries({ queryKey: ['passwordLogin'] });
            toast.success(response.message);
        },
        onError: showApiErrorToast,
    });
}

export function useLogout() {
    return useMutation({
        mutationFn: async () => {
            const response = await authApi.logout();
            if (!response?.data) throw new Error("Logout failed");
            toast.success(response.message);
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
                window.location.replace('/auth/login');
            }
            return response.data;
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
        onSuccess: (response) => {
            toast.success(response.message || 'Password reset email sent');
        },
        onError: showApiErrorToast,
    });
}

export function useResetPassword() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
        onSuccess: (response) => {
            toast.success(response.message || 'Password updated');
            queryClient.invalidateQueries({ queryKey: ['me'] });
        },
        onError: showApiErrorToast,
    });
}
