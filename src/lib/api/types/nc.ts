export type NcType = 'critical' | 'major' | 'minor';

export type NcSource =
  | 'incoming-material'
  | 'in-process-inspection'
  | 'final-inspection'
  | 'customer-complaint'
  | 'post-market-surveillance'
  | 'other';

export interface CreateNcPayload {
  reportDate: string;
  reportedBy: string;
  department: string;
  ncType: NcType;
  description: string;
  sources: NcSource[];
  sourceOther?: string;
  productProcessName?: string;
  productCodeOrBatch?: string;
  serialNumber?: string;
  supplier?: string;
  capaRequired: boolean;
  capaNumber?: string;
  capaIssuedTo?: string;
  noCapaReason?: string;
  comments?: string;
  qaRemarks?: string;
  approverName?: string;
  approverDesignation?: string;
  approvalDate?: string;
}

export interface NcRecord {
  ncNumber: string;
  reportDate?: string;
  reportedBy?: string | null;
  department?: string | null;
  ncType?: NcType | null;
  description?: string | null;
  sources?: NcSource[];
  sourceOther?: string | null;
  productDetails?: {
    name?: string | null;
    codeOrBatch?: string | null;
    serialNumber?: string | null;
    supplier?: string | null;
  } | null;
  capaRequired?: boolean;
  capaNumber?: string | null;
  capaIssuedTo?: string | null;
  noCapaReason?: string | null;
  comments?: string | null;
  approval?: {
    remarks?: string | null;
    name?: string | null;
    designation?: string | null;
    date?: string | null;
  } | null;
  fileUrl?: string | null;
  createdAt?: string | null;
}

export interface CreateNcResponse {
  ncNumber: string;
  fileUrl: string;
}

export interface NcListResponse {
  list: NcRecord[];
  page: number;
  pageSize: number;
  total: number;
}
