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

export interface LookupType {
    name: string;
    description: string | null;
    config: {
        _id: string;
        name: string;
        type: string;
    };
}

export interface MasterLookupItem {
    _id: string;
    name: string;
    description?: string | null;
    type: 'RESOLUTION_METHOD' | 'ROOT_CAUSE' | 'FINAL_DISPOSITION' | 'CUSTOMER_COMMUNICATION' | 'COMPLAINT_TYPE' | string;
}

export interface MasterLookupResponse {
    success: boolean;
    message: string;
    data: MasterLookupItem[];
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
    complaint_type: LookupType;
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
    complaint_type: LookupType;
    issue_details: IssueDetails;
    previous_contact: PreviousContact;
    customer_actions: CustomerActions;
    preferred_resolution_method: PreferredResolutionMethod;
    replacement_details?: ReplacementDetails;
    customer_impact: string;
    attachments: string[];

    // Workflow fields
    status: ComplaintStatus;
    status_history: StatusHistoryItem[];

    // Received Info
    received_info?: {
        receiver_name: string;
        receiver_role: string;
        received_date: string;
    };

    // Investigation
    investigation?: {
        investigation_date: string;
        investigating_officers: InvestigatingOfficer[];
        root_cause: {
            identified: 'Device Failure' | 'Manufacturing Issue' | 'Labeling/IFU'
                | 'Customer Misuse' | 'No Fault Found' | 'Other';
            description?: string;
        };
        corrective_action: string;
        capa: {
            initiated: boolean;
            number?: string;
            details?: string;
        };
        action_taken: string;
        completion_details: {
            name: string;
            signature: string;
            date: string;
        };
    };

    // Customer Communication
    customer_communication?: {
        response_date: string;
        mode: 'Email' | 'Call' | 'Letter' | 'Other';
        summary: string;
        attachments?: string[];
    };

    // Risk Management
    risk_management?: {
        update_required: boolean;
        details?: string;
    };

    // Closure
    closure?: {
        final_disposition: 'Confirmed Device Defect' | 'No Fault Found'
            | 'Customer Misuse' | 'Duplicate' | 'Other';
        reviewed_by: {
            sr_no: number;
            name: string;
            designation: string;
            signature: string;
        }[];
        approved_by: {
            qa_head_name: string;
            signature: string;
            date: string;
        };
        closure_comments?: string;
    };
}

// Supporting interfaces
export interface StatusHistoryItem {
    status: ComplaintStatus;
    changed_by: string | { _id: string, name: string }; // Can be ObjectId or populated user
    changed_at: string;
    comments?: string;
}

// Your existing interfaces remain the same:
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
    config?: any;
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

//
export interface ComplaintCreateResponse {
    success: boolean;
    message: string;
    data: Complaint;
}

export interface ComplaintData {
    customer: Customer;
    product_details: ProductDetails;
    complaint_type: LookupType;
    issue_details: IssueDetails;
    customer_impact: string;
    previous_contact: PreviousContact;
    customer_actions: CustomerActions;
    preferred_resolution_method: ResolutionMethod;
    attachments: any[]; // or a more specific type if available
    _id: string;
    submission_date: string; // ISO string
    complaint_number: number;
    created_on: string;
    updated_on: string;
    __v: number;
}

export interface Customer {
    name: string;
    company: string;
    contact_number: string;
    email: string;
}

export interface ProductDetails {
    model: string;
    serial_number: string;
    purchase_date: string; // ISO string
}

export interface ResolutionMethod {
    name: string;
    description: string;
    config: Config;
}

export interface Config {
    _id: string;
    name: string;
    type: string;
}

// lib/api/types/complaints.ts
export type ComplaintStatus =
    | 'SUBMITTED'
    | 'UNDER_INVESTIGATION'
    | 'RESOLVED'
    | 'REJECTED'
    | 'CLOSED';

export interface StatusTransitionPayload {
    newStatus: ComplaintStatus;
    comments?: string;
}

export interface InvestigatingOfficer {
    sr_no: number;
    name: string;
    designation: string;
    signature: string;
}

export interface RootCause {
    identified:
        | 'Device Failure'
        | 'Manufacturing Issue'
        | 'Labeling/IFU'
        | 'Customer Misuse'
        | 'No Fault Found'
        | 'Other';
    description?: string;
}

export interface InvestigationData {
    investigation_date: string;
    investigating_officers: InvestigatingOfficer[];
    root_cause: RootCause;
    corrective_action: string;
    capa: {
        initiated: boolean;
        number?: string;
        details?: string;
    };
    action_taken: string;
    completion_details: {
        name: string;
        signature: string;
        date: string;
    };
}

// Add similar interfaces for other sections...