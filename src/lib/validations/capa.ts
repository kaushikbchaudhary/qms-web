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

export const capaFormSchema = z
  .object({
    capaInitiationDate: z.date(),
    sourceOfNonConformance: optionalTrimmedString,
    description: optionalTrimmedString,
    isRepeated: z.boolean().default(false),
    proceedToCapa: z.boolean().default(false),
    rootCauseAnalysis: optionalTrimmedString,
    remarks: optionalTrimmedString,
    correction: optionalTrimmedString,
    correctiveAction: optionalTrimmedString,
    preventiveAction: optionalTrimmedString,
    createdBy: z.object({
      name: requiredTrimmedString('Prepared by name'),
      designation: requiredTrimmedString('Prepared by designation'),
    }),
  })
  .strict();

export type CapaFormValues = z.infer<typeof capaFormSchema>;
