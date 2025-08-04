// lib/validations/complaint.ts
import { z } from "zod"

export const investigationSchema = z.object({
    investigation_date: z.date(),
    investigating_officers: z.array(
        z.object({
            sr_no: z.number().min(1),
            name: z.string().min(1, "Required"),
            designation: z.string().min(1, "Required"),
            signature: z.string().min(1, "Required")
        })
    ).nonempty("At least one officer required"),
    root_cause: z.discriminatedUnion("identified", [
        z.object({
            identified: z.enum(["Device Failure", "Manufacturing Issue", "Labeling/IFU", "Customer Misuse", "No Fault Found"]),
            description: z.string().optional()
        }),
        z.object({
            identified: z.literal("Other"),
            description: z.string().min(1, "Description required when 'Other' is selected")
        })
    ]),
    // Add other fields...
})

export type InvestigationFormData = z.infer<typeof investigationSchema>