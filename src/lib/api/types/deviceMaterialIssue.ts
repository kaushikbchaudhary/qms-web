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
  specification?: string;
  serial_number?: string;
  quantity: number;
  unit?: string;
  expected_use_duration?: string;
}

export interface DeviceMaterialIssuePurpose {
  description: string;
  project_code?: string;
  client_reference?: string;
  justification?: string;
}

export interface DeviceMaterialIssueProduction {
  assigned_to?: string;
  assigned_at?: string;
  notes?: string;
  batch_number?: string;
  lot_numbers?: string[];
  prepared_on?: string;
}

export interface DeviceMaterialIssueApproval {
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

export interface DeviceMaterialIssueQualityChecks {
  checklist?: string[];
  completed_by?: string;
  completed_at?: string;
  remarks?: string;
}

export interface DeviceMaterialIssuePickup {
  scheduled_for?: string;
  location?: string;
  issued_by?: string;
  issued_at?: string;
  override_reason?: string;
  fifo_position?: number;
}

export interface DeviceMaterialIssueRecipient {
  signed_by?: string;
  name?: string;
  acknowledgement?: string;
  signature_path?: string;
  signed_at?: string;
}

export interface DeviceMaterialIssueAttachment {
  filename: string;
  path: string;
  description?: string;
  uploaded_by?: string;
  uploaded_at?: string;
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
  requester_snapshot?: DeviceMaterialIssueRequester;
  device_details: DeviceMaterialIssueDeviceDetails;
  purpose: DeviceMaterialIssuePurpose;
  production?: DeviceMaterialIssueProduction;
  approval?: DeviceMaterialIssueApproval;
  quality_checks?: DeviceMaterialIssueQualityChecks;
  pickup?: DeviceMaterialIssuePickup;
  recipient?: DeviceMaterialIssueRecipient;
  attachments?: DeviceMaterialIssueAttachment[];
  status_history?: DeviceMaterialIssueStatusHistory[];
  progress_metadata?: DeviceMaterialIssueProgressMetadata;
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
  approval?: DeviceMaterialIssueApproval;
  pickup?: DeviceMaterialIssuePickup;
  quality_checks?: DeviceMaterialIssueQualityChecks;
  custom_fields?: Record<string, unknown>;
}

export interface DeviceMaterialIssueStatusUpdatePayload {
  newStatus: DeviceMaterialIssueStatus;
  notes?: string;
  override?: boolean;
}

export interface DeviceMaterialIssueSignaturePayload {
  name: string;
  acknowledgement?: string;
  signature_path: string;
  metadata?: {
    device_id?: string;
    ip_address?: string;
    user_agent?: string;
  };
  override?: boolean;
  overrideReason?: string;
}

export interface DeviceMaterialIssueAttachmentResponse {
  filename: string;
  path: string;
  description?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}
