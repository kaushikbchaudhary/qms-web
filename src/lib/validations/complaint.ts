import { z } from "zod";

export const investigatingOfficerSchema = z.object({
    sr_no: z.number().min(1, "Serial number must be at least 1"),
    name: z.string().min(1, "Officer name is required"),
    designation: z.string().min(1, "Designation is required"),
    signature: z.string().min(1, "Signature reference is required")
});

export const rootCauseSchema = z.discriminatedUnion("identified", [
    z.object({
        identified: z.enum([
            "Device Failure",
            "Manufacturing Issue",
            "Labeling/IFU",
            "Customer Misuse",
            "No Fault Found"
        ]),
        description: z.string().optional()
    }),
    z.object({
        identified: z.literal("Other"),
        description: z.string().min(1, "Description required when 'Other' is selected")
    })
]);

export const capaSchema = z.object({
    initiated: z.boolean().default(false),
    number: z.string().min(1, "CAPA number is required when initiated").optional(),
    details: z.string().min(1, "CAPA details are required when initiated").optional()
}).superRefine((data, ctx) => {
    if (data.initiated && !data.number) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CAPA number is required when CAPA is initiated",
            path: ["number"]
        });
    }
    if (data.initiated && !data.details) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CAPA details are required when CAPA is initiated",
            path: ["details"]
        });
    }
});

export const completionDetailsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    signature: z.string().min(1, "Signature reference is required"),
    date: z.date()
});

export const investigationSchema = z.object({
    investigation_date: z.date(),
    investigating_officers: z.array(investigatingOfficerSchema)
        .min(1, "At least one investigating officer is required"),
    root_cause: rootCauseSchema,
    corrective_action: z.string().min(1, "Corrective action is required"),
    capa: capaSchema,
    action_taken: z.string().min(1, "Action taken is required"),
    completion_details: completionDetailsSchema
});

export type InvestigationFormData = z.infer<typeof investigationSchema>;

// lib/validations/complaint.ts
// import { z } from "zod"
//
// export const investigationSchema = z.object({
//     investigation_date: z.date(),
//     investigating_officers: z.array(
//         z.object({
//             sr_no: z.number().min(1),
//             name: z.string().min(1, "Required"),
//             designation: z.string().min(1, "Required"),
//             signature: z.string().min(1, "Required")
//         })
//     ).nonempty("At least one officer required"),
//     root_cause: z.discriminatedUnion("identified", [
//         z.object({
//             identified: z.enum(["Device Failure", "Manufacturing Issue", "Labeling/IFU", "Customer Misuse", "No Fault Found"]),
//             description: z.string().optional()
//         }),
//         z.object({
//             identified: z.literal("Other"),
//             description: z.string().min(1, "Description required when 'Other' is selected")
//         })
//     ]),
//     // Add other fields...
// })
//
// export type InvestigationFormData = z.infer<typeof investigationSchema>