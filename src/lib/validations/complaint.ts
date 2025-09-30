import { z } from "zod";
import {
    buildInvestigationFormSchema,
    buildCustomerCommunicationSchema,
} from '@/lib/validations/complaintSubmission';
import {
    DEFAULT_INVESTIGATION_REQUIREMENTS,
    DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS,
} from '@/config/formRequirements';

export const investigationSchema = buildInvestigationFormSchema(DEFAULT_INVESTIGATION_REQUIREMENTS);

export const customerCommunicationSchema = buildCustomerCommunicationSchema(DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS);

export type CustomerCommunicationFormData = z.infer<typeof customerCommunicationSchema>;

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
