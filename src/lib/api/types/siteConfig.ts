import { ComplaintSubmissionRequirementMap } from '@/config/formRequirements';

export type LoginMode = 'OTP' | 'PASSWORD';

export interface SiteConfig {
    _id?: string;
    loginMode: LoginMode;
    complaintSubmissionRequirements: ComplaintSubmissionRequirementMap;
    updatedBy?: {
        id?: string;
        name?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface SiteConfigUpdatePayload {
    loginMode?: LoginMode;
    complaintSubmissionRequirements?: ComplaintSubmissionRequirementMap;
}
