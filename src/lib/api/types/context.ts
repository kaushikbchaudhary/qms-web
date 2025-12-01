export type SerialComplaint = {
  id: string;
  complaintNumber: string;
  issue: string;
  resolution?: string;
  capa?: string;
  rootCause?: string;
};

export type SerialMatch = {
  kit?: string;
  complaints: SerialComplaint[];
  lastResolution?: string;
  lastCAPA?: string;
};

export type SimilarIssue = {
  issue: string;
  resolution?: string;
  rootCause?: string;
  capa?: string;
  score: number;
};

export type ContextSuggestionResponse = {
  serialMatch: SerialMatch | null;
  similarIssues: SimilarIssue[];
  recommendedActions: string[];
  error?: boolean;
};
