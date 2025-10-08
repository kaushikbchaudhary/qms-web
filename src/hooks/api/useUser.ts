import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {showApiErrorToast} from "@/lib/utils";
import {userApi} from "@/lib/api/endpoints/users";
import {useRouter} from "next/navigation";

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userData: any) =>
        {
            return userApi.createUser(userData);
        },
        onSuccess: (response) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['users'] })
            // toast.success('User created successfully!');
        },
        onError: showApiErrorToast
    })
}

export function useGetUsers(payload: any) {
    return useQuery({
        queryKey: ['users', payload],
        queryFn: async () => {
            const { data } = await userApi.getUsers(payload);
            return data;
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (id?:string): Promise<any> => {
            // Determine endpoint based on whether ID is provided
            const endpoint = id
                ? `${id}`
                : 'deleteMe';
            return userApi.deleteUser(endpoint);
        },
        onSuccess: (response: any) => {
            // Invalidate user-related queries
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });

            toast.success(response.message);

            // Redirect if it was a self-deletion
            if (!response.data?.id) {
                router.replace('/auth/login');
            }
        },
        onError: (error: Error) => {
            showApiErrorToast(error);
        }
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => userApi.updateUser(id, data),
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success(response?.message ?? 'User updated successfully.');
        },
        onError: showApiErrorToast,
    });
}

export function useUpdatePassword(userId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { currentPassword: string; newPassword: string }) => {
            if (!userId) {
                return Promise.reject(new Error('User ID is required to update password.'));
            }
            return userApi.updatePassword(userId, payload);
        },
        onSuccess: (response: any) => {
            toast.success(response?.message ?? 'Password updated successfully.');
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
        onError: showApiErrorToast,
    });
}

export function useUserSignatureUpload() {
    return useMutation({
        mutationFn: async ({ file, userId }: { file: File; userId?: string }) => {
            const formData = new FormData();
            formData.append('signature', file);
            if (userId) {
                formData.append('userId', userId);
            }
            const response = await userApi.uploadSignature(formData);
            return response.data;
        },
        onError: (error) => {
            console.error('Error uploading signature:', error);
            showApiErrorToast(error as Error);
        },
    });
}

export function useUserSignatureDelete() {
    return useMutation({
        mutationFn: async (path: string) => {
            await userApi.deleteSignature({ path });
        },
        onError: (error) => {
            console.error('Error removing signature:', error);
        },
    });
}

export function useUserSignaturePreview(params: { path: string | null; isOpen: boolean }) {
    return useQuery({
        queryKey: ['user-signature', params.path],
        queryFn: async () => {
            if (!params.path) return null;
            const response = await userApi.getSignature({ path: params.path });
            return response;
        },
        enabled: !!params.path && params.isOpen,
        gcTime: 10 * 60 * 1000,
        staleTime: 5 * 60 * 1000,
    });
}
