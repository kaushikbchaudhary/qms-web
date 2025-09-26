export interface ComplaintSubmissionFieldDefinition {
    path: string;
    label: string;
    defaultRequired: boolean;
    description?: string;
}

export type ComplaintSubmissionRequirementMap = Record<string, boolean>;

export const COMPLAINT_SUBMISSION_FIELDS: ComplaintSubmissionFieldDefinition[] = [
    { path: 'customer.name', label: 'Customer Name', defaultRequired: true },
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
