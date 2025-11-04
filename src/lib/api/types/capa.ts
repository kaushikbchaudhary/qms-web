export interface CapaSummary {
  capaId: string;
  initiationDate: string;
  sourceOfNonConformance?: string | null;
  description?: string | null;
  remarks?: string | null;
  correction?: string | null;
  correctiveAction?: string | null;
  preventiveAction?: string | null;
  fileUrl?: string | null;
  linkedComplaint?: string | null;
  linkedNc?: string | null;
}

export interface CreateCapaPayload {
  capaInitiationDate: string;
  sourceOfNonConformance?: string;
  description?: string;
  isRepeated?: boolean;
  proceedToCapa?: boolean;
  rootCauseAnalysis?: string;
  remarks?: string;
  correction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
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

