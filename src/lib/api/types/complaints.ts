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

// types/complaints.ts

// Base config type used in several places
export interface Config {
    _id: string;
    name: string;
    type: string;
}

// Sub-types for the complaint
export interface Customer {
    name: string;
    company: string;
    contact_number: string;
    email: string;
}

export interface ProductDetails {
    model: string;
    serial_number: string;
    purchase_date: string;
    unique_identifier?: string;
}

export interface ComplaintType {
    name: string;
    description: string | null;
    config: Config;
}

export interface PreferredResolutionMethod {
    name: string;
    description: string | null;
    config: Config;
}

// Main Complaint type
export interface Complaint {
    _id: string;
    complaint_number: number;
    submission_date: string;
    created_on: string;
    updated_on: string;
    __v: number;
    customer: Customer;
    product_details: ProductDetails;
    complaint_type: ComplaintType;
    issue_details: IssueDetails;
    previous_contact: PreviousContact;
    customer_actions: CustomerActions;
    preferred_resolution_method: PreferredResolutionMethod;
    replacement_details?: ReplacementDetails;
    customer_impact: string;
    attachments: string[];
}

// API Response type
export interface ComplaintsApiResponse  {
        count: number;
        list: Complaint[];
}

// Query params (you already had this)
export interface Filter {
    field: string;
    operator: string;
    value: string;
}

export interface ComplaintQueryParams {
    page_size: number;
    page_index: number;
    global_value: string;
    global_filter: string[];
    filters: Filter[];
    sort_by: string;
    sort_order: number; // -1 for descending, 1 for ascending
}
// types/upload.ts
export interface FileUploadResponse {
    success: boolean;
    message: string;
    data: {
        url: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        uploadedAt: string;
    };
}

export interface FileUploadParams {
    file: File;
    complaintId?: string;
    metadata?: Record<string, any>;
}