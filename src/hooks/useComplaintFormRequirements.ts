import { useMemo } from 'react';
import { usePublicSiteConfig } from '@/hooks/api/useSiteConfig';
import {
    DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS,
    DEFAULT_INVESTIGATION_REQUIREMENTS,
    DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS,
    DEFAULT_COMPLAINT_CLOSURE_REQUIREMENTS,
} from '@/config/formRequirements';

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

export const useInvestigationFormRequirements = () => {
    const { data, isLoading, isFetching } = usePublicSiteConfig();

    const requirements = useMemo(() => {
        return data?.investigationRequirements ?? DEFAULT_INVESTIGATION_REQUIREMENTS;
    }, [data?.investigationRequirements]);

    return {
        requirements,
        isLoading: isLoading || isFetching,
    };
};

export const useCustomerCommunicationRequirements = () => {
    const { data, isLoading, isFetching } = usePublicSiteConfig();

    const requirements = useMemo(() => {
        return data?.customerCommunicationRequirements ?? DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS;
    }, [data?.customerCommunicationRequirements]);

    return {
        requirements,
        isLoading: isLoading || isFetching,
    };
};

export const useComplaintClosureRequirements = () => {
    const { data, isLoading, isFetching } = usePublicSiteConfig();

    const requirements = useMemo(() => {
        return data?.complaintClosureRequirements ?? DEFAULT_COMPLAINT_CLOSURE_REQUIREMENTS;
    }, [data?.complaintClosureRequirements]);

    return {
        requirements,
        isLoading: isLoading || isFetching,
    };
};
