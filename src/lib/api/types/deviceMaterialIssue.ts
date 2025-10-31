export type DeviceMaterialIssueStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'IN_PRODUCTION'
  | 'READY_FOR_PICKUP'
  | 'ISSUED'
  | 'CLOSED'
  | 'REJECTED';

export type DeviceMaterialIssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DeviceMaterialIssueRequester {
  name?: string;
  department?: string;
  contact_number?: string;
  email?: string;
  employee_id?: string;
}

export interface DeviceMaterialIssueDeviceDetails {
  category: string;
  model?: string;
  quantity: number;
}

export interface DeviceMaterialIssuePurpose {
  description: string;
}

export interface DeviceMaterialIssueProduction {
  batch_number?: string;
}

export interface DeviceMaterialIssuePickup {
  issued_by?: string;
  issued_at?: string;
  store_signed_by?: string;
  store_signature_path?: string;
  store_signed_at?: string;
  store_signed_name?: string;
  fifo_position?: number;
}

export interface DeviceMaterialIssueRecipient {
  signed_by?: string;
  name?: string;
  acknowledgement?: string;
  signature_path?: string;
  signed_at?: string;
}

export interface DeviceMaterialIssueStatusHistory {
  status: DeviceMaterialIssueStatus;
  changed_at?: string;
  changed_by?: string;
  notes?: string;
  override?: boolean;
}

export interface DeviceMaterialIssueProgressMetadata {
  requested_on?: string;
  submitted_at?: string;
  reviewed_at?: string;
  approved_at?: string;
  production_started_at?: string;
  ready_for_pickup_at?: string;
  issued_at?: string;
  closed_at?: string;
  rejected_at?: string;
}

export interface DeviceMaterialIssue {
  _id: string;
  request_number: string;
  status: DeviceMaterialIssueStatus;
  priority: DeviceMaterialIssuePriority;
  requested_by?: string;
  requester_snapshot?: DeviceMaterialIssueRequester;
  device_details: DeviceMaterialIssueDeviceDetails;
  purpose: DeviceMaterialIssuePurpose;
  production?: DeviceMaterialIssueProduction;
  pickup?: DeviceMaterialIssuePickup;
  recipient?: DeviceMaterialIssueRecipient;
  status_history?: DeviceMaterialIssueStatusHistory[];
  progress_metadata?: DeviceMaterialIssueProgressMetadata;
  custom_fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceMaterialIssueQueryParams {
  page_size?: number;
  page_index?: number;
  sort_by?: string;
  sort_order?: 1 | -1;
  global_value?: string;
  global_filter?: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
    subType?: string;
  }>;
  status?: DeviceMaterialIssueStatus;
  priority?: DeviceMaterialIssuePriority;
  requested_by?: string;
}

export interface DeviceMaterialIssueListResponse {
  count: number;
  list: DeviceMaterialIssue[];
}

export interface CreateDeviceMaterialIssuePayload {
  requester_snapshot?: DeviceMaterialIssueRequester;
  device_details: DeviceMaterialIssueDeviceDetails;
  purpose: DeviceMaterialIssuePurpose;
  priority?: DeviceMaterialIssuePriority;
  autoSubmit?: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateDeviceMaterialIssuePayload {
  requester_snapshot?: DeviceMaterialIssueRequester;
  device_details?: DeviceMaterialIssueDeviceDetails;
  purpose?: DeviceMaterialIssuePurpose;
  priority?: DeviceMaterialIssuePriority;
  production?: DeviceMaterialIssueProduction;
  custom_fields?: Record<string, unknown>;
}

export interface DeviceMaterialIssueStatusUpdatePayload {
  newStatus: DeviceMaterialIssueStatus;
  notes?: string;
}

export interface DeviceMaterialIssueSignaturePayload {
  name?: string;
  acknowledgement?: string;
  signature_path?: string;
  metadata?: {
    device_id?: string;
    ip_address?: string;
    user_agent?: string;
  };
}

export interface DeviceMaterialIssueStoreIssuePayload {
  batch_number: string;
}

export type DeviceMaterialIssueExportPayload = Partial<
  Pick<
    DeviceMaterialIssueQueryParams,
    'status' | 'priority' | 'requested_by' | 'filters' | 'global_filter' | 'global_value' | 'sort_by' | 'sort_order'
  >
>;
