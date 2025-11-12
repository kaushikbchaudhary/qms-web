import {
    ComplaintSubmissionRequirementMap,
    InvestigationRequirementMap,
    CustomerCommunicationRequirementMap,
    ComplaintClosureRequirementMap,
} from '@/config/formRequirements';

export type LoginMode = 'OTP' | 'PASSWORD';

export interface SiteConfig {
    _id?: string;
    loginMode: LoginMode;
    complaintSubmissionRequirements: ComplaintSubmissionRequirementMap;
    investigationRequirements: InvestigationRequirementMap;
    customerCommunicationRequirements: CustomerCommunicationRequirementMap;
    complaintClosureRequirements: ComplaintClosureRequirementMap;
    updatedBy?: {
        id?: string;
        name?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface SiteConfigUpdatePayload {
    loginMode?: LoginMode;
    complaintSubmissionRequirements?: Partial<ComplaintSubmissionRequirementMap>;
    investigationRequirements?: Partial<InvestigationRequirementMap>;
    customerCommunicationRequirements?: Partial<CustomerCommunicationRequirementMap>;
    complaintClosureRequirements?: Partial<ComplaintClosureRequirementMap>;
}
