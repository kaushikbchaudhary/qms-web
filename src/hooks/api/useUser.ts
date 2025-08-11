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
                router.push('/auth/login' + '?t=' + Date.now());
            }
        },
        onError: (error: Error) => {
            showApiErrorToast(error);
        }
    });
}

