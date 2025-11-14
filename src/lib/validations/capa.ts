import { z } from 'zod';

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

export const capaCategoryValues = ['systemic', 'process', 'design', 'supplier', 'training'] as const;

export const capaFormSchema = z
  .object({
    capaInitiationDate: z.date(),
    capaActionCompletionDate: z.date().optional(),
    sourceOfCapa: optionalTrimmedString,
    complaintReference: optionalTrimmedString,
    description: optionalTrimmedString,
    capaCategory: z.enum(capaCategoryValues).optional(),
    impactsSafetyOrCompliance: optionalTrimmedString,
    isRepeated: optionalTrimmedString,
    proceedToCapa: z.boolean().default(false),
    rootCauseAnalysis: optionalTrimmedString,
    correction: optionalTrimmedString,
    correctiveAction: optionalTrimmedString,
    preventiveAction: optionalTrimmedString,
    extensionJustification: optionalTrimmedString,
    effectivenessPlan: optionalTrimmedString,
    effectivenessReviewDueDate: z.date().optional(),
    isCapaClosed: z.boolean().default(false),
    capaClosureDate: z.date().optional(),
  })
  .strict();

export type CapaFormValues = z.infer<typeof capaFormSchema>;
