export interface ComplaintSubmissionFieldDefinition {
    path: string;
    label: string;
    defaultRequired: boolean;
    description?: string;
}

export interface InvestigationFieldDefinition {
    path: string;
    label: string;
    defaultRequired: boolean;
    description?: string;
}

export interface CustomerCommunicationFieldDefinition {
    path: string;
    label: string;
    defaultRequired: boolean;
    description?: string;
}

export interface ComplaintClosureFieldDefinition {
    path: string;
    label: string;
    defaultRequired: boolean;
    description?: string;
}

export type ComplaintSubmissionRequirementMap = Record<string, boolean>;
export type InvestigationRequirementMap = Record<string, boolean>;
export type CustomerCommunicationRequirementMap = Record<string, boolean>;
export type ComplaintClosureRequirementMap = Record<string, boolean>;

export const COMPLAINT_SUBMISSION_FIELDS: ComplaintSubmissionFieldDefinition[] = [
    { path: 'customer.name', label: 'Customer Name', defaultRequired: true },
    { path: 'customer.patient_id', label: 'Patient ID', defaultRequired: false },
    { path: 'customer.company', label: 'Customer Company', defaultRequired: false },
    { path: 'customer.contact_number', label: 'Customer Contact Number', defaultRequired: true },
    { path: 'customer.email', label: 'Customer Email', defaultRequired: true },
    { path: 'product_details.model', label: 'Product Model', defaultRequired: true },
    { path: 'product_details.batch_number', label: 'Product Batch Number', defaultRequired: false },
    { path: 'product_details.serial_number', label: 'Product Serial Number', defaultRequired: true },
    { path: 'product_details.purchase_date', label: 'Product Purchase Date', defaultRequired: true },
    { path: 'complaint_type.name', label: 'Complaint Type', defaultRequired: true },
    { path: 'issue_details.description', label: 'Issue Description', defaultRequired: true },
    { path: 'issue_details.problem_start_date', label: 'Problem Start Date', defaultRequired: true },
    { path: 'issue_details.occurred_before', label: 'Issue Occurred Before', defaultRequired: true },
    { path: 'issue_details.replication_steps', label: 'Replication Steps', defaultRequired: false },
    { path: 'customer_impact', label: 'Customer Impact', defaultRequired: true },
    { path: 'previous_contact.reported_before', label: 'Previously Reported', defaultRequired: true },
    { path: 'previous_contact.reference_number', label: 'Reference Number', defaultRequired: false },
    { path: 'previous_contact.contact_date', label: 'Previous Contact Date', defaultRequired: false },
    { path: 'previous_contact.person_contacted', label: 'Person Contacted', defaultRequired: false },
    { path: 'customer_actions.troubleshooting_done', label: 'Troubleshooting Completed', defaultRequired: true },
    { path: 'customer_actions.troubleshooting_description', label: 'Troubleshooting Description', defaultRequired: false },
    { path: 'preferred_resolution_method.name', label: 'Preferred Resolution Method', defaultRequired: true },
    { path: 'preferred_resolution_method.description', label: 'Preferred Resolution Description', defaultRequired: false },
    { path: 'replacement_details.batch_number', label: 'Replacement Batch Number', defaultRequired: false },
    { path: 'replacement_details.serial_number', label: 'Replacement Serial Number', defaultRequired: false },
    { path: 'replacement_details.mfg_date', label: 'Replacement Manufacturing Date', defaultRequired: false },
    { path: 'attachments', label: 'Attachments', defaultRequired: false },
];

export const buildDefaultComplaintSubmissionRequirements = (): ComplaintSubmissionRequirementMap => {
    return COMPLAINT_SUBMISSION_FIELDS.reduce<ComplaintSubmissionRequirementMap>((acc, field) => {
        acc[field.path] = field.defaultRequired;
        return acc;
    }, {});
};

export const DEFAULT_COMPLAINT_SUBMISSION_REQUIREMENTS = buildDefaultComplaintSubmissionRequirements();

export const INVESTIGATION_FIELDS: InvestigationFieldDefinition[] = [
    { path: 'investigation_date', label: 'Date of Investigation', defaultRequired: true },
    { path: 'root_cause.identified', label: 'Root Cause Identified', defaultRequired: true },
    { path: 'root_cause.description', label: 'Root Cause Description', defaultRequired: false, description: 'Required when "Other" is selected.' },
    { path: 'capa.initiated', label: 'CAPA Initiated', defaultRequired: false },
    { path: 'capa.number', label: 'CAPA Number', defaultRequired: false, description: 'Required when CAPA is initiated.' },
    { path: 'completion_details.name', label: 'Investigation Completed By', defaultRequired: true },
    { path: 'completion_details.signature', label: 'Investigator Signature', defaultRequired: true },
    { path: 'completion_details.date', label: 'Completion Date', defaultRequired: true },
];

export const CUSTOMER_COMMUNICATION_FIELDS: CustomerCommunicationFieldDefinition[] = [
    { path: 'response_date', label: 'Response Date', defaultRequired: true },
    { path: 'mode', label: 'Communication Mode', defaultRequired: true },
    { path: 'summary', label: 'Communication Summary', defaultRequired: true },
];

export const buildDefaultInvestigationRequirements = (): InvestigationRequirementMap => {
    return INVESTIGATION_FIELDS.reduce<InvestigationRequirementMap>((acc, field) => {
        acc[field.path] = field.defaultRequired;
        return acc;
    }, {});
};

export const buildDefaultCustomerCommunicationRequirements = (): CustomerCommunicationRequirementMap => {
    return CUSTOMER_COMMUNICATION_FIELDS.reduce<CustomerCommunicationRequirementMap>((acc, field) => {
        acc[field.path] = field.defaultRequired;
        return acc;
    }, {});
};

export const DEFAULT_INVESTIGATION_REQUIREMENTS = buildDefaultInvestigationRequirements();
export const DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS = buildDefaultCustomerCommunicationRequirements();

export const COMPLAINT_CLOSURE_FIELDS: ComplaintClosureFieldDefinition[] = [
    { path: 'final_disposition', label: 'Final Disposition', defaultRequired: true },
    { path: 'final_disposition_other', label: 'Other Final Disposition Details', defaultRequired: false },
    { path: 'reviewed_by', label: 'Reviewed By Entries', defaultRequired: true, description: 'Require at least one reviewer.' },
    { path: 'reviewed_by.sr_no', label: 'Reviewer Serial Number', defaultRequired: true },
    { path: 'reviewed_by.name', label: 'Reviewer Name', defaultRequired: true },
    { path: 'reviewed_by.designation', label: 'Reviewer Designation', defaultRequired: true },
    { path: 'reviewed_by.signature', label: 'Reviewer Signature', defaultRequired: false },
    { path: 'approved_by.qa_head_name', label: 'QA Head Name', defaultRequired: true },
    { path: 'approved_by.signature', label: 'QA Head Signature', defaultRequired: true },
    { path: 'approved_by.date', label: 'QA Head Approval Date', defaultRequired: true },
];

export const buildDefaultComplaintClosureRequirements = (): ComplaintClosureRequirementMap => {
    return COMPLAINT_CLOSURE_FIELDS.reduce<ComplaintClosureRequirementMap>((acc, field) => {
        acc[field.path] = field.defaultRequired;
        return acc;
    }, {});
};

export const DEFAULT_COMPLAINT_CLOSURE_REQUIREMENTS = buildDefaultComplaintClosureRequirements();
