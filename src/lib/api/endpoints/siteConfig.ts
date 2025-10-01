import { apiClient } from '../client';
import { SiteConfig, SiteConfigUpdatePayload } from '@/lib/api/types/siteConfig';

export const siteConfigApi = {
    getPublicConfig: async (): Promise<{
        success: boolean;
        message: string;
        data: Pick<SiteConfig, 'loginMode' | 'complaintSubmissionRequirements' | 'investigationRequirements' | 'customerCommunicationRequirements' | 'complaintClosureRequirements'> & {
            updatedAt?: string | null;
        };
    }> =>
        apiClient.get('/api/v1/site-config/public'),
    getConfig: async (): Promise<{ success: boolean; message: string; data: SiteConfig }> =>
        apiClient.get('/api/v1/site-config'),
    updateConfig: async (payload: SiteConfigUpdatePayload): Promise<{ success: boolean; message: string; data: SiteConfig }> =>
        apiClient.patch('/api/v1/site-config', payload),
};
