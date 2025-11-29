export type GrammarCorrectionResponse = {
  suggested: string | null;
  error?: boolean;
  suggestions?: string[];
};
