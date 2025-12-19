export type IncomingInspectionComponentType =
  | 'CONNECTOR'
  | 'CRYSTAL'
  | 'DIODE'
  | 'HEADER'
  | 'SWITCH'
  | 'TRANSISTOR'
  | 'USB_MICRO_B'
  | 'INDUCTOR'
  | 'SWITCH_DIMENSION'
  | 'USB_TYPE_C';

export type IncomingInspectionResult = 'PASS' | 'FAIL';

export interface IncomingInspectionChecklistRow {
  sr_no: number;
  test_name: string;
  specification: string;
  observation?: string;
  result?: IncomingInspectionResult;
}

export interface IncomingInspection {
  _id: string;
  form_number?: string;
  document_number?: string;
  revision_number?: string;
  effective_date?: string;
  component_type: IncomingInspectionComponentType;
  details?: {
    material_name?: string;
    batch_lot_no?: string;
    inward_date?: string;
    inward_quantity?: number;
    mpn_no?: string;
    material_master_id?: string;
    material_category?: string;
  };
  sampling?: {
    total_sample_tested?: number;
    sample_number?: string;
  };
  inspection_checklist?: IncomingInspectionChecklistRow[];
  release_decision?: {
    overall_result?: IncomingInspectionResult;
    released?: boolean;
  };
  tested_by?: {
    name?: string;
    signed_at?: string;
  };
  approved_by?: {
    name?: string;
    signed_at?: string;
  };
  status?: 'DRAFT' | 'FINALIZED';
  created_at?: string;
  updated_at?: string;
}

export interface IncomingInspectionQueryParams {
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
  component_type?: IncomingInspectionComponentType;
  status?: 'DRAFT' | 'FINALIZED';
}

export interface IncomingInspectionListResponse {
  count: number;
  list: IncomingInspection[];
}

export interface CreateIncomingInspectionPayload {
  component_type: IncomingInspectionComponentType;
  document_number?: string;
  revision_number?: string;
  effective_date?: string;
  details?: IncomingInspection['details'];
  sampling?: IncomingInspection['sampling'];
  inspection_checklist?: IncomingInspectionChecklistRow[];
  release_decision?: IncomingInspection['release_decision'];
  tested_by?: IncomingInspection['tested_by'];
  approved_by?: IncomingInspection['approved_by'];
  status?: 'DRAFT' | 'FINALIZED';
  custom_fields?: Record<string, unknown>;
}

export type UpdateIncomingInspectionPayload = Partial<CreateIncomingInspectionPayload>;
