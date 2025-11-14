export type CapaCategory = 'systemic' | 'process' | 'design' | 'supplier' | 'training';

export interface CapaSummary {
  capaId: string;
  initiationDate: string;
  sourceOfCapa?: string | null;
  complaintReference?: string | null;
  description?: string | null;
  capaCategory?: CapaCategory | null;
  impactsSafetyOrCompliance?: boolean | null;
  capaActionCompletionDate?: string | null;
  effectivenessReviewDueDate?: string | null;
  isCapaClosed?: boolean | null;
  capaClosureDate?: string | null;
  correction?: string | null;
  correctiveAction?: string | null;
  preventiveAction?: string | null;
  extensionJustification?: string | null;
  effectivenessPlan?: string | null;
  fileUrl?: string | null;
  linkedComplaint?: string | null;
  linkedNc?: string | null;
  preparedBy?: {
    name?: string | null;
    designation?: string | null;
  } | null;
}

export interface CreateCapaPayload {
  capaInitiationDate: string;
  capaActionCompletionDate?: string;
  sourceOfCapa?: string;
  complaintReference?: string;
  description?: string;
  capaCategory?: CapaCategory;
  impactsSafetyOrCompliance?: boolean;
  isRepeated?: boolean;
  proceedToCapa?: boolean;
  rootCauseAnalysis?: string;
  correction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  extensionJustification?: string;
  effectivenessPlan?: string;
  effectivenessReviewDueDate?: string;
  isCapaClosed?: boolean;
  capaClosureDate?: string;
  createdBy: {
    name: string;
    designation: string;
  };
}

export interface CreateCapaResponse {
  capaId: string;
  fileUrl: string;
}

export interface AvailableCapasResponse {
  list: CapaSummary[];
}

export interface ValidateCapaResponse {
  capa: CapaSummary;
}

export interface CapaListResponse {
  list: CapaSummary[];
  page: number;
  pageSize: number;
  total: number;
}
