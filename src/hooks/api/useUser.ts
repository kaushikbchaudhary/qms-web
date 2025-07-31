import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {showApiErrorToast} from "@/lib/utils";
import {userApi} from "@/lib/api/endpoints/users";

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
            toast.success('User created successfully!');
        },
        onError: showApiErrorToast
    })
}
