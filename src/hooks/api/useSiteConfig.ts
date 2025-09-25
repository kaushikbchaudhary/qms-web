import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { siteConfigApi } from '@/lib/api/endpoints/siteConfig';
import { SiteConfigUpdatePayload, SiteConfig } from '@/lib/api/types/siteConfig';
import { showApiErrorToast } from '@/lib/utils';

export function usePublicSiteConfig() {
    return useQuery({
        queryKey: ['site-config', 'public'],
        queryFn: async () => {
            const response = await siteConfigApi.getPublicConfig();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSiteConfig() {
    return useQuery({
        queryKey: ['site-config'],
        queryFn: async () => {
            const response = await siteConfigApi.getConfig();
            return response.data as SiteConfig;
        },
    });
}

export function useUpdateSiteConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: SiteConfigUpdatePayload) => siteConfigApi.updateConfig(payload),
        onSuccess: (response) => {
            toast.success(response.message);
            queryClient.invalidateQueries({ queryKey: ['site-config'] });
            queryClient.invalidateQueries({ queryKey: ['site-config', 'public'] });
        },
        onError: showApiErrorToast,
    });
}
