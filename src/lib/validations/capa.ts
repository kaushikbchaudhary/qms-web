import { z } from 'zod';

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const requiredTrimmedString = (label: string) =>
  z
    .string()
    .min(1, { message: `${label} is required.` })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: `${label} is required.` });

export const capaCategoryValues = ['systemic', 'process', 'design', 'supplier', 'training'] as const;

export const capaFormSchema = z
  .object({
    capaInitiationDate: z.date(),
    capaActionCompletionDate: z.date().optional(),
    sourceOfCapa: optionalTrimmedString,
    complaintReference: optionalTrimmedString,
    description: optionalTrimmedString,
    capaCategory: z.enum(capaCategoryValues).optional(),
    impactsSafetyOrCompliance: z.boolean().default(false),
    isRepeated: z.boolean().default(false),
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
    createdBy: z.object({
      name: requiredTrimmedString('Prepared by name'),
      designation: requiredTrimmedString('Prepared by designation'),
    }),
  })
  .strict();

export type CapaFormValues = z.infer<typeof capaFormSchema>;
