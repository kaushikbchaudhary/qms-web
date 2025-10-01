import { z } from "zod";
import {
    buildInvestigationFormSchema,
    buildCustomerCommunicationSchema,
    buildComplaintClosureSchema,
} from '@/lib/validations/complaintSubmission';
import {
    DEFAULT_INVESTIGATION_REQUIREMENTS,
    DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS,
    DEFAULT_COMPLAINT_CLOSURE_REQUIREMENTS,
} from '@/config/formRequirements';

export const investigationSchema = buildInvestigationFormSchema(DEFAULT_INVESTIGATION_REQUIREMENTS);

export const customerCommunicationSchema = buildCustomerCommunicationSchema(DEFAULT_CUSTOMER_COMMUNICATION_REQUIREMENTS);

export const complaintClosureSchema = buildComplaintClosureSchema(DEFAULT_COMPLAINT_CLOSURE_REQUIREMENTS);

export type CustomerCommunicationFormData = z.infer<typeof customerCommunicationSchema>;

export type InvestigationFormData = z.infer<typeof investigationSchema>;

export type ComplaintClosureFormData = z.infer<typeof complaintClosureSchema>
