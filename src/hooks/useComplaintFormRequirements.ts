import { useMemo } from 'react';
import { usePublicSiteConfig } from '@/hooks/api/useSiteConfig';
import { DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS } from '@/config/formRequirements';

export const useComplaintFormRequirements = () => {
    const { data, isLoading, isFetching } = usePublicSiteConfig();

    const requirements = useMemo(() => {
        return data?.complaintSubmissionRequirements ?? DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS;
    }, [data?.complaintSubmissionRequirements]);

    return {
        requirements,
        isLoading: isLoading || isFetching,
    };
};
