// src/lib/api/types/complaints.ts
export interface Complaint {
    _id: string;
    name: string;
    description?: string;
    type: string;
}
//
// export type CreateComplaintData = Complaint & {
//     caseNumber: string;
// };

export interface ComplaintCustomer {
    name: string;
    company?: string;
    contact_number: string;
    email: string;
}

export interface ComplaintProductDetails {
    model: string;
    serial_number: string;
    purchase_date: string;
    config?: Record<string, unknown>;
}

export interface ComplaintType {
    name: string;
    description: string | null;
    config: {
        _id: string;
        name: string;
        type: string;
    };
}

export interface IssueDetails {
    description: string;
    problem_start_date: string;
    occurred_before: "Yes" | "No";
    replication_steps: string | null;
}

export interface PreviousContact {
    reported_before: "Yes" | "No";
    reference_number?: string;
    contact_date?: string;
    person_contacted?: string;
}

export interface CustomerActions {
    troubleshooting_done: "Yes" | "No";
    troubleshooting_description?: string;
}

export interface PreferredResolutionMethod {
    name: string;
    description: string | null;
    config: {
        _id: string;
        name: string;
        type: string;
    };
}

export interface ReplacementDetails {
    batch_number?: string;
    serial_number?: string;
    mfg_date?: string;
}

export interface CreateComplaintPayload {
    customer: ComplaintCustomer;
    product_details: ComplaintProductDetails;
    complaint_type: ComplaintType;
    issue_details: IssueDetails;
    customer_impact: string;
    previous_contact: PreviousContact;
    customer_actions: CustomerActions;
    preferred_resolution_method: PreferredResolutionMethod;
    replacement_details: ReplacementDetails;
    attachments: string[] | undefined;
}