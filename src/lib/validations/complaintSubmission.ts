import { z } from 'zod';
import {
    ComplaintSubmissionRequirementMap,
    InvestigationRequirementMap,
    CustomerCommunicationRequirementMap,
    ComplaintClosureRequirementMap,
} from '@/config/formRequirements';

const preprocessOptionalString = () =>
    z.preprocess((value) => {
        if (value === null || value === undefined) {
            return undefined;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed.length ? trimmed : undefined;
        }
        return value;
    }, z.string().optional());

const stringField = (
    requirements: Record<string, boolean>,
    path: string,
    {
        message,
        minLength,
        email,
    }: {
        message: string;
        minLength?: number;
        email?: boolean;
    }
) => {
    if (requirements[path]) {
        let schema = z.string().trim();
        if (minLength) {
            schema = schema.min(minLength, message);
        } else {
            schema = schema.min(1, message);
        }
        if (email) {
            schema = schema.email('Invalid email address');
        }
        return schema;
    }

    let schema = preprocessOptionalString();
    if (minLength) {
        schema = schema.refine((value) => value === undefined || value.length >= minLength, {
            message,
        });
    }
    if (email) {
        schema = schema.refine((value) => value === undefined || /.+@.+\..+/.test(value), {
            message: 'Invalid email address',
        });
    }
    return schema;
};

const enumField = <T extends readonly [string, ...string[]]>(
    requirements: Record<string, boolean>,
    path: string,
    options: T,
    message: string
) => {
    if (requirements[path]) {
        return z.enum(options, { message });
    }
    return z.enum(options).optional();
};

const arrayOfStringsField = (
    requirements: Record<string, boolean>,
    path: string
) => {
    const base = z.array(z.string());
    if (requirements[path]) {
        return base.min(1, 'At least one attachment is required');
    }
    return base.optional();
};

const phoneNumberRegex = /^\d{10}$/;
const phoneNumberMessage = 'Enter a 10-digit contact number without the country code or special characters.';
const phoneField = (
    requirements: Record<string, boolean>,
    path: string,
) => {
    if (requirements[path]) {
        return z
            .string()
            .trim()
            .regex(phoneNumberRegex, phoneNumberMessage);
    }

    return preprocessOptionalString().refine(
        (value) => value === undefined || phoneNumberRegex.test(value),
        {
            message: phoneNumberMessage,
        }
    );
};

export const buildComplaintSubmissionSchema = (requirements: ComplaintSubmissionRequirementMap) =>
    z.object({
        customer: z.object({
            name: stringField(requirements, 'customer.name', {
                message: 'Name must be at least 2 characters',
                minLength: 2,
            }),
            patient_id: stringField(requirements, 'customer.patient_id', {
                message: 'Patient ID is required',
                minLength: 1,
            }),
            company: preprocessOptionalString(),
            contact_number: phoneField(requirements, 'customer.contact_number'),
            email: stringField(requirements, 'customer.email', {
                message: 'Email is required',
                email: true,
            }),
        }),
        product_details: z.object({
            model: stringField(requirements, 'product_details.model', {
                message: 'Model is required',
                minLength: 1,
            }),
            batch_number: preprocessOptionalString(),
            serial_number: stringField(requirements, 'product_details.serial_number', {
                message: 'Serial number is required',
                minLength: 1,
            }),
            purchase_date: stringField(requirements, 'product_details.purchase_date', {
                message: 'Purchase date is required',
                minLength: 1,
            }),
        }),
        complaint_type: z.object({
            name: stringField(requirements, 'complaint_type.name', {
                message: 'Complaint type is required',
                minLength: 1,
            }),
            description: z.string().nullable().optional(),
            config: z.object({
                _id: z.string(),
                name: z.string(),
                type: z.string(),
            }),
        }),
        issue_details: z.object({
            description: stringField(requirements, 'issue_details.description', {
                message: 'Description must be at least 10 characters',
                minLength: 10,
            }),
            problem_start_date: stringField(requirements, 'issue_details.problem_start_date', {
                message: 'Problem start date is required',
                minLength: 1,
            }),
            occurred_before: enumField(requirements, 'issue_details.occurred_before', ['Yes', 'No'] as const, 'Please select an option'),
            replication_steps: preprocessOptionalString(),
        }),
        customer_impact: stringField(requirements, 'customer_impact', {
            message: 'Impact description must be at least 10 characters',
            minLength: 10,
        }),
        previous_contact: z.object({
            reported_before: enumField(requirements, 'previous_contact.reported_before', ['Yes', 'No'] as const, 'Please select an option'),
            reference_number: preprocessOptionalString(),
            contact_date: preprocessOptionalString(),
            person_contacted: preprocessOptionalString(),
        }),
        customer_actions: z.object({
            troubleshooting_done: enumField(requirements, 'customer_actions.troubleshooting_done', ['Yes', 'No'] as const, 'Please select an option'),
            troubleshooting_description: preprocessOptionalString(),
        }),
        preferred_resolution_method: z.object({
            name: stringField(requirements, 'preferred_resolution_method.name', {
                message: 'Preferred resolution method is required',
                minLength: 1,
            }),
            description: z.string().nullable().optional(),
            config: z.object({
                _id: z.string(),
                name: z.string(),
                type: z.string(),
            }),
        }),
        replacement_details: z
            .object({
                batch_number: preprocessOptionalString(),
                serial_number: preprocessOptionalString(),
                mfg_date: preprocessOptionalString(),
            })
            .optional(),
        attachments: arrayOfStringsField(requirements, 'attachments'),
    });

const dateField = (
    requirements: Record<string, boolean>,
    path: string,
    _message: string
) => {
    void _message;
    const base = z.date();
    return requirements[path] ? base : base.optional();
};

const booleanField = (defaultValue = false) => z.boolean().default(defaultValue);

const preprocessNumber = (value: unknown) => {
    if (value === '' || value === null || value === undefined) {
        return undefined;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value;
    }

    return value;
};

const numberField = (
    requirements: Record<string, boolean>,
    path: string,
    {
        message,
        min,
    }: {
        message: string;
        min?: number;
    }
) => {
    if (requirements[path]) {
        let schema = z.preprocess(preprocessNumber, z.number());
        if (typeof min === 'number') {
            schema = schema.refine((value) => value >= min, { message });
        }
        return schema;
    }

    let schema = z.preprocess(preprocessNumber, z.number().optional());
    if (typeof min === 'number') {
        schema = schema.refine((value) => value === undefined || value >= min, { message });
    }
    return schema;
};

export const buildInvestigationFormSchema = (requirements: InvestigationRequirementMap) => {
    const rootCauseDescriptionRequired = requirements['root_cause.description'];
    const capaNumberRequired = requirements['capa.number'];

    const rootCauseSchema = z.object({
        identified: z.enum([
            'Device Failure',
            'Manufacturing Issue',
            'Labelling/IFU',
            'Customer Misuse',
            'No Fault Found',
            'Other',
        ] as const, {
            message: 'Root cause selection is required',
        }),
        description: rootCauseDescriptionRequired
            ? z.string().min(1, 'Root cause description is required')
            : preprocessOptionalString(),
    }).superRefine((data, ctx) => {
        if (data.identified === 'Other' && rootCauseDescriptionRequired && !data.description) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Description required when "Other" is selected',
                path: ['description'],
            });
        }
    });

    const capaSchema = z
        .object({
            initiated: booleanField(false),
            number: preprocessOptionalString(),
        })
        .superRefine((data, ctx) => {
            if (!data.initiated) {
                return;
            }

            if (capaNumberRequired && !data.number) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'CAPA number is required when CAPA is initiated',
                    path: ['number'],
                });
            }
        })
        .transform((value) => ({
            initiated: Boolean(value.initiated),
            number: value.number ?? undefined,
        }));

    return z.object({
        investigation_date: dateField(requirements, 'investigation_date', 'Investigation date is required'),
        root_cause: rootCauseSchema,
        capa: capaSchema,
        completion_details: z.object({
            name: preprocessOptionalString(),
            signature: preprocessOptionalString(),
            date: z
                .union([z.date(), z.string()])
                .optional()
                .transform((value) => {
                    if (value instanceof Date) return value;
                    if (typeof value === 'string' && value.trim()) {
                        const parsed = new Date(value);
                        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
                    }
                    return undefined;
                }),
        }),
    });
};

export const buildCustomerCommunicationSchema = (requirements: CustomerCommunicationRequirementMap) => {
    const riskManagementSchema = z
        .object({
            update_required: z.boolean().default(false),
            details: preprocessOptionalString(),
        })
        .superRefine((value, ctx) => {
            if (value.update_required && (!value.details || value.details.trim().length === 0)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Please provide details when a risk management update is required.',
                    path: ['details'],
                });
            }
        })
        .transform((value) => ({
            update_required: Boolean(value.update_required),
            ...(value.details && value.details.trim().length > 0
                ? { details: value.details.trim() }
                : {}),
        }));

    return z
        .object({
            response_date: dateField(requirements, 'response_date', 'Response date is required'),
            mode: requirements['mode']
                ? z.enum(['Email', 'Call', 'Letter', 'Other'] as const, {
                      message: 'Communication mode is required',
                  })
                : z.enum(['Email', 'Call', 'Letter', 'Other'] as const).optional(),
            summary: stringField(requirements, 'summary', {
                message: 'Summary must be at least 10 characters long',
                minLength: 10,
            }),
            risk_management: riskManagementSchema.default({ update_required: false }),
        })
        .transform((value) => ({
            ...value,
            risk_management: value.risk_management ?? { update_required: false },
        }));
};

export const buildComplaintClosureSchema = (requirements: ComplaintClosureRequirementMap) => {
    const reviewerSchema = z.object({
        sr_no: numberField(requirements, 'reviewed_by.sr_no', {
            message: 'Serial number is required',
            min: 1,
        }),
        name: stringField(requirements, 'reviewed_by.name', {
            message: 'Reviewer name is required',
            minLength: 2,
        }),
        designation: stringField(requirements, 'reviewed_by.designation', {
            message: 'Designation is required',
            minLength: 2,
        }),
        signature: stringField(requirements, 'reviewed_by.signature', {
            message: 'Signature is required',
            minLength: 1,
        }),
    });

    const reviewersArray = requirements['reviewed_by']
        ? z.array(reviewerSchema).min(1, 'At least one reviewer is required')
        : z.array(reviewerSchema).optional();

    return z
        .object({
            final_disposition: requirements['final_disposition']
            ? z.enum(
                  ['Confirmed Device Defect', 'No Fault Found', 'Customer Misuse', 'Duplicate Complaint', 'Other'] as const,
                  {
                      message: 'Final disposition is required',
                  }
              )
            : z.enum(
                  ['Confirmed Device Defect', 'No Fault Found', 'Customer Misuse', 'Duplicate Complaint', 'Other'] as const
              ).optional(),
            final_disposition_other: preprocessOptionalString(),
            reviewed_by: reviewersArray,
            approved_by: z.object({
                qa_head_name: stringField(requirements, 'approved_by.qa_head_name', {
                    message: 'QA Head name is required',
                    minLength: 2,
                }),
                signature: stringField(requirements, 'approved_by.signature', {
                    message: 'QA Head signature is required',
                    minLength: 1,
                }),
                date: dateField(requirements, 'approved_by.date', 'Approval date is required'),
            }),
        })
        .superRefine((data, ctx) => {
            if (data.final_disposition === 'Other' && !data.final_disposition_other) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Please provide details when selecting "Other".',
                    path: ['final_disposition_other'],
                });
            }
        });
};
