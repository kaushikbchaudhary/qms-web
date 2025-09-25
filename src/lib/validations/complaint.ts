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
            "Labelling/IFU",
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
    investigation_date: z.date({
        message: "Investigation date is required"
    }),
    root_cause: rootCauseSchema,
    corrective_action: z.string().min(1, "Corrective action is required"),
    capa: capaSchema,
    action_taken: z.string().min(1, "Action taken is required")
});

export const customerCommunicationSchema = z.object({
    response_date: z.date({
        message: "Response date is required"
    }),
    mode: z.enum(["Email", "Call", "Letter", "Other"], {
        message: "Communication mode is required"
    }),
    summary: z.string().min(10, "Summary must be at least 10 characters long"),
    attachments: z.array(z.string())
})

export type CustomerCommunicationFormData = z.infer<typeof customerCommunicationSchema>


export type InvestigationFormData = z.infer<typeof investigationSchema>;


export const complaintClosureSchema = z.object({
    final_disposition: z.enum([
        "Confirmed Device Defect",
        "No Fault Found",
        "Customer Misuse",
        "Duplicate Complaint",
        "Other"
    ], {
        message: "Final disposition is required"
    }),
    reviewed_by: z.array(z.object({
        sr_no: z.number().min(1, "Serial number is required"),
        name: z.string().min(2, "Reviewer name is required"),
        designation: z.string().min(2, "Designation is required"),
        signature: z.string().optional()
    })).min(1, "At least one reviewer is required"),
    approved_by: z.object({
        qa_head_name: z.string().min(2, "QA Head name is required"),
        signature: z.string().min(1, "QA Head signature is required"),
        date: z.date({
            message: "Approval date is required"
        })
    }),
    closure_comments: z.string().optional()
})

export type ComplaintClosureFormData = z.infer<typeof complaintClosureSchema>
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
